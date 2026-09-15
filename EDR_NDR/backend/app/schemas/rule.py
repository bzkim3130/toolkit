from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import RuleType, Severity
from app.schemas.event import EventOut


class RuleRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    rule_type: RuleType
    severity: Severity


class RuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    rule_type: RuleType
    severity: Severity
    logic: str
    mitre_technique: str | None
    enabled: bool
    hit_count: int
    created_by: str
    created_at: datetime
    updated_at: datetime


class RuleCreate(BaseModel):
    name: str
    description: str = ""
    rule_type: RuleType = RuleType.signature
    severity: Severity = Severity.medium
    logic: str
    mitre_technique: str | None = None
    enabled: bool = True
    created_by: str = "analyst"


class RuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    rule_type: RuleType | None = None
    severity: Severity | None = None
    logic: str | None = None
    mitre_technique: str | None = None
    enabled: bool | None = None


class RuleTestResult(BaseModel):
    matched_count: int
    sample_matches: list[EventOut]
    method: str
