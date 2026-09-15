import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import AgentStatus


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: uuid.uuid4().hex)
    hostname: Mapped[str] = mapped_column(String(255), index=True)
    ip_address: Mapped[str] = mapped_column(String(64))
    os: Mapped[str] = mapped_column(String(64))
    os_version: Mapped[str] = mapped_column(String(64))
    status: Mapped[AgentStatus] = mapped_column(Enum(AgentStatus), default=AgentStatus.online, index=True)
    agent_version: Mapped[str] = mapped_column(String(32))
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    group_tag: Mapped[str] = mapped_column(String(64))
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
