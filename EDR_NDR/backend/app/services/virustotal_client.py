"""Thin wrapper around the VirusTotal v3 REST API.

Keeps two things off the caller's plate: the free-tier rate limit (4 req/min) and
turning VT's fairly deep JSON shape into the flat fields the UI actually renders.
Callers (the /api/vt routes) own the DB-backed TTL cache and resolve which API key
to use (Settings, DPAPI-encrypted, or the .env dev default) — this module only
talks to VirusTotal with whatever key it's handed and normalizes what comes back.
"""

import base64
import time
from collections import deque
from datetime import datetime, timezone

import httpx

from app.core.config import settings


class VTRateLimitedError(Exception):
    def __init__(self, retry_after: float):
        self.retry_after = retry_after
        super().__init__(f"VirusTotal rate limit hit, retry after {retry_after:.0f}s")


class _RateLimiter:
    """Sliding-window limiter so we fail fast locally instead of burning quota on a 429 from VT."""

    def __init__(self, max_per_minute: int):
        self.max_per_minute = max_per_minute
        self._timestamps: deque[float] = deque()

    def check(self) -> None:
        now = time.monotonic()
        window_start = now - 60
        while self._timestamps and self._timestamps[0] < window_start:
            self._timestamps.popleft()

        if len(self._timestamps) >= self.max_per_minute:
            retry_after = 60 - (now - self._timestamps[0])
            raise VTRateLimitedError(retry_after=max(retry_after, 1))

        self._timestamps.append(now)


_limiter = _RateLimiter(settings.vt_requests_per_minute)


def _client(api_key: str) -> httpx.Client:
    return httpx.Client(base_url=settings.virustotal_base_url, headers={"x-apikey": api_key}, timeout=15.0)


def _get(path: str, api_key: str) -> dict:
    _limiter.check()
    with _client(api_key) as client:
        resp = client.get(path)
        resp.raise_for_status()
        return resp.json()


def _post(path: str, api_key: str, data: dict | None = None) -> dict:
    _limiter.check()
    with _client(api_key) as client:
        resp = client.post(path, data=data)
        resp.raise_for_status()
        return resp.json()


def _stats(attributes: dict) -> tuple[int, int]:
    stats = attributes.get("last_analysis_stats") or {}
    malicious = stats.get("malicious", 0) + stats.get("suspicious", 0)
    total = sum(stats.values()) if stats else 0
    return malicious, total


def _malicious_vendors(attributes: dict) -> list[str]:
    results = attributes.get("last_analysis_results") or {}
    return sorted(
        vendor for vendor, verdict in results.items() if verdict.get("category") in ("malicious", "suspicious")
    )


def fetch_file_report(file_hash: str, api_key: str) -> dict:
    raw = _get(f"/files/{file_hash}", api_key)
    attrs = raw.get("data", {}).get("attributes", {})
    malicious, total = _stats(attrs)
    first_seen_ts = attrs.get("first_submission_date")

    return {
        "hash": file_hash,
        "detection_ratio": f"{malicious}/{total}",
        "malicious_count": malicious,
        "total_engines": total,
        "malicious_vendors": _malicious_vendors(attrs),
        "file_type": attrs.get("type_description"),
        "meaningful_name": attrs.get("meaningful_name"),
        "first_seen": datetime.fromtimestamp(first_seen_ts, tz=timezone.utc) if first_seen_ts else None,
        "raw": raw,
    }


def fetch_ip_report(ip: str, api_key: str) -> dict:
    raw = _get(f"/ip_addresses/{ip}", api_key)
    attrs = raw.get("data", {}).get("attributes", {})
    malicious, total = _stats(attrs)

    return {
        "ip": ip,
        "detection_ratio": f"{malicious}/{total}",
        "malicious_count": malicious,
        "total_engines": total,
        "malicious_vendors": _malicious_vendors(attrs),
        "reputation": attrs.get("reputation"),
        "country": attrs.get("country"),
        "as_owner": attrs.get("as_owner"),
        "raw": raw,
    }


def fetch_domain_report(domain: str, api_key: str) -> dict:
    raw = _get(f"/domains/{domain}", api_key)
    attrs = raw.get("data", {}).get("attributes", {})
    malicious, total = _stats(attrs)
    creation_ts = attrs.get("creation_date")

    return {
        "domain": domain,
        "detection_ratio": f"{malicious}/{total}",
        "malicious_count": malicious,
        "total_engines": total,
        "malicious_vendors": _malicious_vendors(attrs),
        "reputation": attrs.get("reputation"),
        "categories": sorted(set((attrs.get("categories") or {}).values())),
        "creation_date": datetime.fromtimestamp(creation_ts, tz=timezone.utc) if creation_ts else None,
        "raw": raw,
    }


def _url_id(url: str) -> str:
    return base64.urlsafe_b64encode(url.encode()).decode().strip("=")


def fetch_or_submit_url(url: str, api_key: str) -> dict:
    url_id = _url_id(url)

    try:
        raw = _get(f"/urls/{url_id}", api_key)
        attrs = raw.get("data", {}).get("attributes", {})
        stats = attrs.get("last_analysis_stats")
        if stats:
            malicious, total = _stats(attrs)
            return {
                "url": url,
                "status": "completed",
                "detection_ratio": f"{malicious}/{total}",
                "malicious_count": malicious,
                "total_engines": total,
                "malicious_vendors": _malicious_vendors(attrs),
                "raw": raw,
            }
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code != 404:
            raise

    submitted = _post("/urls", api_key, data={"url": url})
    return {
        "url": url,
        "status": "queued",
        "detection_ratio": None,
        "malicious_count": None,
        "total_engines": None,
        "malicious_vendors": [],
        "raw": submitted,
    }


def fetch_quota(api_key: str) -> dict:
    raw = _get(f"/users/{api_key}", api_key)
    quotas = raw.get("data", {}).get("attributes", {}).get("quotas", {})

    def used_allowed(name: str) -> tuple[int | None, int | None]:
        bucket = quotas.get(name) or {}
        return bucket.get("used"), bucket.get("allowed")

    hourly_used, hourly_allowed = used_allowed("api_requests_hourly")
    daily_used, daily_allowed = used_allowed("api_requests_daily")
    monthly_used, monthly_allowed = used_allowed("api_requests_monthly")

    return {
        "hourly_used": hourly_used,
        "hourly_allowed": hourly_allowed,
        "daily_used": daily_used,
        "daily_allowed": daily_allowed,
        "monthly_used": monthly_used,
        "monthly_allowed": monthly_allowed,
    }
