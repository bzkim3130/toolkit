import json
from datetime import datetime, timedelta, timezone
from typing import Callable

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.vt_cache import VTCache
from app.schemas.virustotal import (
    VTDomainResult,
    VTFileResult,
    VTIpResult,
    VTQuota,
    VTUrlResult,
    VTUrlSubmitRequest,
)
from app.services import settings_service
from app.services import virustotal_client as vt

router = APIRouter(prefix="/vt", tags=["virustotal"])


def _require_api_key(db: Session) -> str:
    api_key = settings_service.effective_virustotal_key(db)
    if not api_key:
        raise HTTPException(status_code=503, detail="VirusTotal API 키가 설정되지 않았습니다 — 설정 탭에서 등록하세요")
    return api_key


def _run(fetch_fn: Callable[[], dict]) -> dict:
    try:
        return fetch_fn()
    except vt.VTRateLimitedError as exc:
        raise HTTPException(
            status_code=429, detail=f"VirusTotal 요청 한도 초과 — {exc.retry_after:.0f}초 후 다시 시도하세요"
        ) from None
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            raise HTTPException(status_code=404, detail="VirusTotal에서 결과를 찾을 수 없습니다") from None
        if exc.response.status_code == 401:
            raise HTTPException(status_code=401, detail="VirusTotal API 키가 유효하지 않습니다") from None
        raise HTTPException(status_code=502, detail=f"VirusTotal API 오류: {exc.response.status_code}") from None
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"VirusTotal 연결 실패: {exc}") from None


def _get_cached(db: Session, query_type: str, query_key: str) -> dict | None:
    entry = db.get(VTCache, f"{query_type}:{query_key}")
    if not entry:
        return None
    if datetime.now(timezone.utc) - entry.fetched_at.replace(tzinfo=timezone.utc) > timedelta(
        minutes=settings.vt_cache_ttl_minutes
    ):
        return None
    return json.loads(entry.response_json)


def _store_cache(db: Session, query_type: str, query_key: str, data: dict) -> None:
    entry_id = f"{query_type}:{query_key}"
    entry = db.get(VTCache, entry_id)
    payload = json.dumps(data, default=str)
    if entry:
        entry.response_json = payload
        entry.fetched_at = datetime.now(timezone.utc)
    else:
        db.add(VTCache(id=entry_id, query_type=query_type, query_key=query_key, response_json=payload))
    db.commit()


def _cached_or_fetch(db: Session, query_type: str, query_key: str, fetch_fn: Callable[[], dict]) -> tuple[dict, bool]:
    cached = _get_cached(db, query_type, query_key)
    if cached is not None:
        return cached, True

    data = _run(fetch_fn)
    _store_cache(db, query_type, query_key, data)
    return data, False


@router.get("/file/{file_hash}", response_model=VTFileResult)
def get_file(file_hash: str, db: Session = Depends(get_db)):
    api_key = _require_api_key(db)
    data, cached = _cached_or_fetch(db, "file", file_hash.lower(), lambda: vt.fetch_file_report(file_hash, api_key))
    return VTFileResult(**data, cached=cached, checked_at=datetime.now(timezone.utc))


@router.get("/ip/{ip}", response_model=VTIpResult)
def get_ip(ip: str, db: Session = Depends(get_db)):
    api_key = _require_api_key(db)
    data, cached = _cached_or_fetch(db, "ip", ip, lambda: vt.fetch_ip_report(ip, api_key))
    return VTIpResult(**data, cached=cached, checked_at=datetime.now(timezone.utc))


@router.get("/domain/{domain}", response_model=VTDomainResult)
def get_domain(domain: str, db: Session = Depends(get_db)):
    api_key = _require_api_key(db)
    data, cached = _cached_or_fetch(db, "domain", domain, lambda: vt.fetch_domain_report(domain, api_key))
    return VTDomainResult(**data, cached=cached, checked_at=datetime.now(timezone.utc))


@router.post("/url", response_model=VTUrlResult)
def post_url(payload: VTUrlSubmitRequest, db: Session = Depends(get_db)):
    api_key = _require_api_key(db)
    data, cached = _cached_or_fetch(db, "url", payload.url, lambda: vt.fetch_or_submit_url(payload.url, api_key))
    return VTUrlResult(**data, cached=cached, checked_at=datetime.now(timezone.utc))


@router.get("/quota", response_model=VTQuota)
def get_quota(db: Session = Depends(get_db)):
    api_key = _require_api_key(db)
    data, _cached = _cached_or_fetch(db, "quota", "self", lambda: vt.fetch_quota(api_key))
    return VTQuota(**data)
