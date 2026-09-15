from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "EDR/NDR Dashboard API"
    database_url: str = f"sqlite:///{(BASE_DIR / 'data' / 'edr_ndr.db').as_posix()}"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    seed_on_startup: bool = True
    seed_agent_count: int = 30
    seed_rule_count: int = 20
    seed_alert_count: int = 500
    seed_event_count: int = 5000
    seed_days_back: int = 30

    # DPAPI local encryption entropy (extra pepper on top of the OS-bound key).
    # Not a secret by itself: DPAPI already binds the ciphertext to this Windows user account.
    dpapi_entropy: str = "edr-ndr-dashboard-settings-v1"

    # VirusTotal — dev default until the Settings tab (DPAPI-encrypted storage) replaces it.
    virustotal_api_key: str | None = None
    virustotal_base_url: str = "https://www.virustotal.com/api/v3"
    vt_cache_ttl_minutes: int = 60
    vt_requests_per_minute: int = 4  # free-tier limit


settings = Settings()
