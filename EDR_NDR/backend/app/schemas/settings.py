from typing import Literal

from pydantic import BaseModel


class SettingsOut(BaseModel):
    llm_endpoint: str | None
    llm_model: str | None
    llm_api_key_masked: str | None

    edr_api_url: str | None
    edr_api_token_masked: str | None

    ndr_api_url: str | None
    ndr_api_token_masked: str | None

    virustotal_api_key_masked: str | None
    virustotal_key_source: Literal["settings", "env", "none"]


class SettingsUpdate(BaseModel):
    llm_endpoint: str | None = None
    llm_model: str | None = None
    llm_api_key: str | None = None

    edr_api_url: str | None = None
    edr_api_token: str | None = None

    ndr_api_url: str | None = None
    ndr_api_token: str | None = None

    virustotal_api_key: str | None = None


class TestConnectionRequest(BaseModel):
    target: Literal["llm", "edr", "ndr", "virustotal"]


class TestConnectionResult(BaseModel):
    ok: bool
    message: str
