import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import AlertSource, AlertStatus, Severity


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: uuid.uuid4().hex)
    title: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    severity: Mapped[Severity] = mapped_column(Enum(Severity), index=True)
    status: Mapped[AlertStatus] = mapped_column(Enum(AlertStatus), default=AlertStatus.new, index=True)
    source: Mapped[AlertSource] = mapped_column(Enum(AlertSource), index=True)

    agent_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("agents.id"), nullable=True, index=True)
    src_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    dest_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    mitre_technique: Mapped[str | None] = mapped_column(String(32), nullable=True)
    detection_rule_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("detection_rules.id"), nullable=True, index=True
    )
    assignee: Mapped[str | None] = mapped_column(String(64), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    agent = relationship("Agent", lazy="joined")
    rule = relationship("DetectionRule", lazy="joined")
