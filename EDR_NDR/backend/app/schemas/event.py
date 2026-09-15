from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import EventType
from app.schemas.agent import AgentRef


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp: datetime
    agent_id: str
    agent: AgentRef | None = None
    event_type: EventType
    process_name: str | None
    command_line: str | None
    parent_process: str | None
    user: str | None
    src_ip: str | None
    dest_ip: str | None
    dest_port: int | None
    protocol: str | None
    file_hash: str | None
    file_path: str | None
    raw: str
    summary: str = ""


class EventContextResponse(BaseModel):
    anchor_event: EventOut
    before: list[EventOut]
    after: list[EventOut]
