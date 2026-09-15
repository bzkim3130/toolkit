from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import AlertSource, AlertStatus, Severity
from app.schemas.agent import AgentRef
from app.schemas.rule import RuleRef


class AlertSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    severity: Severity
    status: AlertStatus
    source: AlertSource
    agent: AgentRef | None
    src_ip: str | None
    dest_ip: str | None
    mitre_technique: str | None
    assignee: str | None
    created_at: datetime
    updated_at: datetime


class AlertDetail(AlertSummary):
    description: str
    rule: RuleRef | None
    detection_rule_id: str | None


class AlertUpdate(BaseModel):
    status: AlertStatus | None = None
    severity: Severity | None = None
    assignee: str | None = None


class AlertStatsSummary(BaseModel):
    by_severity: dict[str, int]
    by_status: dict[str, int]
    total_open: int
