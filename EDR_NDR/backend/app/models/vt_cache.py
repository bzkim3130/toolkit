from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class VTCache(Base):
    __tablename__ = "vt_cache"

    # "{query_type}:{query_key}", e.g. "file:44d88612fea8a8f36de82e1278abb02f"
    id: Mapped[str] = mapped_column(String(300), primary_key=True)
    query_type: Mapped[str] = mapped_column(String(16), index=True)
    query_key: Mapped[str] = mapped_column(String(280))
    response_json: Mapped[str] = mapped_column(Text)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
