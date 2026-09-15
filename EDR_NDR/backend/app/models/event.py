import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import EventType


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: uuid.uuid4().hex)
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True)
    agent_id: Mapped[str] = mapped_column(String(32), ForeignKey("agents.id"), index=True)
    event_type: Mapped[EventType] = mapped_column(Enum(EventType), index=True)

    process_name: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    command_line: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_process: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user: Mapped[str | None] = mapped_column(String(128), nullable=True)

    src_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    dest_ip: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    dest_port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    protocol: Mapped[str | None] = mapped_column(String(16), nullable=True)

    file_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(512), nullable=True)

    raw: Mapped[str] = mapped_column(Text, default="{}")

    agent = relationship("Agent", lazy="joined")
