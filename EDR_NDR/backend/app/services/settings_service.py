from sqlalchemy.orm import Session

from app.core.config import settings as app_config
from app.core.security import decrypt
from app.models.settings import AppSettings

SINGLETON_ID = "singleton"


def get_or_create(db: Session) -> AppSettings:
    row = db.get(AppSettings, SINGLETON_ID)
    if not row:
        row = AppSettings(id=SINGLETON_ID)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def effective_virustotal_key(db: Session) -> str | None:
    """DB-stored (DPAPI-encrypted, set via the Settings UI) takes precedence over the .env dev default."""
    row = db.get(AppSettings, SINGLETON_ID)
    if row and row.virustotal_api_key_enc:
        return decrypt(row.virustotal_api_key_enc)
    return app_config.virustotal_api_key
