from datetime import datetime
from typing import Any

from pydantic import BaseModel


class VTFileResult(BaseModel):
    hash: str
    detection_ratio: str
    malicious_count: int
    total_engines: int
    malicious_vendors: list[str]
    file_type: str | None
    meaningful_name: str | None
    first_seen: datetime | None
    cached: bool
    checked_at: datetime
    raw: dict[str, Any]


class VTIpResult(BaseModel):
    ip: str
    detection_ratio: str
    malicious_count: int
    total_engines: int
    malicious_vendors: list[str]
    reputation: int | None
    country: str | None
    as_owner: str | None
    cached: bool
    checked_at: datetime
    raw: dict[str, Any]


class VTDomainResult(BaseModel):
    domain: str
    detection_ratio: str
    malicious_count: int
    total_engines: int
    malicious_vendors: list[str]
    reputation: int | None
    categories: list[str]
    creation_date: datetime | None
    cached: bool
    checked_at: datetime
    raw: dict[str, Any]


class VTUrlSubmitRequest(BaseModel):
    url: str


class VTUrlResult(BaseModel):
    url: str
    status: str  # "queued" | "completed"
    detection_ratio: str | None
    malicious_count: int | None
    total_engines: int | None
    malicious_vendors: list[str]
    cached: bool
    checked_at: datetime
    raw: dict[str, Any]


class VTQuota(BaseModel):
    hourly_used: int | None
    hourly_allowed: int | None
    daily_used: int | None
    daily_allowed: int | None
    monthly_used: int | None
    monthly_allowed: int | None
