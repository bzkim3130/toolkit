from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AnalyzeRequest(BaseModel):
    alert_id: str | None = None
    event_ids: list[str] | None = None
    regenerate: bool = False


class AnalysisResult(BaseModel):
    model_config = ConfigDict(from_attributes=False)

    analysis_id: str
    alert_id: str | None
    event_count: int
    summary: str
    mitre_techniques: list[str]
    verdict: str
    recommended_actions: list[str]
    generated_by: str
    created_at: datetime
