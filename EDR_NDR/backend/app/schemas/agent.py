from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import AgentStatus


class AgentRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    hostname: str
    ip_address: str
    status: AgentStatus


class Agent(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    hostname: str
    ip_address: str
    os: str
    os_version: str
    status: AgentStatus
    agent_version: str
    last_seen: datetime
    group_tag: str
    risk_score: int


class AgentDetail(Agent):
    open_alert_count: int
    total_alert_count: int
