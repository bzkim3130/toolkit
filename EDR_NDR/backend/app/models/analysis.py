import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class EventAnalysis(Base):
    __tablename__ = "event_analyses"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: uuid.uuid4().hex)
    alert_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("alerts.id"), nullable=True, index=True)
    event_ids: Mapped[str] = mapped_column(Text, default="[]")  # JSON list of event ids considered
    summary: Mapped[str] = mapped_column(Text)
    mitre_techniques: Mapped[str] = mapped_column(Text, default="[]")  # JSON list
    verdict: Mapped[str] = mapped_column(String(32))
    recommended_actions: Mapped[str] = mapped_column(Text, default="[]")  # JSON list
    generated_by: Mapped[str] = mapped_column(String(16), default="heuristic")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
