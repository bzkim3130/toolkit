import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decrypt, encrypt, mask
from app.core.config import settings as app_config
from app.models.settings import AppSettings
from app.schemas.settings import SettingsOut, SettingsUpdate, TestConnectionRequest, TestConnectionResult
from app.services import settings_service
from app.services import virustotal_client as vt

router = APIRouter(prefix="/settings", tags=["settings"])

# request field -> encrypted column on AppSettings
SECRET_FIELDS = {
    "llm_api_key": "llm_api_key_enc",
    "edr_api_token": "edr_api_token_enc",
    "ndr_api_token": "ndr_api_token_enc",
    "virustotal_api_key": "virustotal_api_key_enc",
}
PLAIN_FIELDS = {"llm_endpoint", "llm_model", "edr_api_url", "ndr_api_url"}


def _to_out(row: AppSettings) -> SettingsOut:
    vt_key = decrypt(row.virustotal_api_key_enc)
    vt_source = "settings" if vt_key else ("env" if app_config.virustotal_api_key else "none")

    return SettingsOut(
        llm_endpoint=row.llm_endpoint,
        llm_model=row.llm_model,
        llm_api_key_masked=mask(decrypt(row.llm_api_key_enc)),
        edr_api_url=row.edr_api_url,
        edr_api_token_masked=mask(decrypt(row.edr_api_token_enc)),
        ndr_api_url=row.ndr_api_url,
        ndr_api_token_masked=mask(decrypt(row.ndr_api_token_enc)),
        virustotal_api_key_masked=mask(vt_key or app_config.virustotal_api_key),
        virustotal_key_source=vt_source,
    )


@router.get("", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db)):
    return _to_out(settings_service.get_or_create(db))


@router.put("", response_model=SettingsOut)
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    row = settings_service.get_or_create(db)
    data = payload.model_dump(exclude_unset=True)

    for field, value in data.items():
        if field in SECRET_FIELDS:
            setattr(row, SECRET_FIELDS[field], encrypt(value) if value else None)
        elif field in PLAIN_FIELDS:
            setattr(row, field, value or None)

    db.commit()
    db.refresh(row)
    return _to_out(row)


def _check_http_reachable(label: str, url: str | None) -> TestConnectionResult:
    if not url:
        return TestConnectionResult(ok=False, message=f"{label} URL이 설정되지 않았습니다")
    try:
        with httpx.Client(timeout=5.0, follow_redirects=True) as client:
            resp = client.get(url)
        if resp.status_code < 500:
            return TestConnectionResult(ok=True, message=f"연결 성공 (HTTP {resp.status_code})")
        return TestConnectionResult(ok=False, message=f"서버 오류 (HTTP {resp.status_code})")
    except httpx.HTTPError as exc:
        return TestConnectionResult(ok=False, message=f"연결 실패: {exc}")


@router.post("/test-connection", response_model=TestConnectionResult)
def test_connection(payload: TestConnectionRequest, db: Session = Depends(get_db)):
    row = settings_service.get_or_create(db)

    if payload.target == "llm":
        return _check_http_reachable("LLM", row.llm_endpoint)
    if payload.target == "edr":
        return _check_http_reachable("EDR", row.edr_api_url)
    if payload.target == "ndr":
        return _check_http_reachable("NDR", row.ndr_api_url)

    # virustotal: a real call against the configured key, not just a reachability ping
    api_key = settings_service.effective_virustotal_key(db)
    if not api_key:
        return TestConnectionResult(ok=False, message="VirusTotal API 키가 설정되지 않았습니다")
    try:
        quota = vt.fetch_quota(api_key)
        return TestConnectionResult(
            ok=True, message=f"연결 성공 — 오늘 {quota['daily_used']}/{quota['daily_allowed']}회 사용"
        )
    except vt.VTRateLimitedError as exc:
        return TestConnectionResult(ok=False, message=f"요청 한도 초과 — {exc.retry_after:.0f}초 후 재시도하세요")
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 401:
            return TestConnectionResult(ok=False, message="API 키가 유효하지 않습니다")
        return TestConnectionResult(ok=False, message=f"VirusTotal 오류: {exc.response.status_code}")
    except httpx.HTTPError as exc:
        return TestConnectionResult(ok=False, message=f"연결 실패: {exc}")
