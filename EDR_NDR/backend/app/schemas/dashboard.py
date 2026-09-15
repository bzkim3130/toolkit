from pydantic import BaseModel


class TrendPoint(BaseModel):
    date: str
    count: int


class MitreCount(BaseModel):
    technique: str
    count: int


class DashboardSummary(BaseModel):
    alerts_by_severity: dict[str, int]
    alerts_trend_7d: list[TrendPoint]
    top_mitre_techniques: list[MitreCount]
    agents_online: int
    agents_offline: int
    agents_isolated: int
    open_alerts: int
