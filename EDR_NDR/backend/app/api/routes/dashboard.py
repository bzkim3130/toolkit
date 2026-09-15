from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.agent import Agent
from app.models.alert import Alert
from app.models.enums import AlertStatus
from app.schemas.dashboard import DashboardSummary, MitreCount, TrendPoint

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

OPEN_STATUSES = [AlertStatus.new, AlertStatus.investigating]


@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db)):
    severity_rows = db.query(Alert.severity, func.count(Alert.id)).group_by(Alert.severity).all()
    alerts_by_severity = {sev.value: count for sev, count in severity_rows}

    today = datetime.now(timezone.utc).date()
    trend_rows = (
        db.query(func.date(Alert.created_at), func.count(Alert.id))
        .filter(Alert.created_at >= datetime.now(timezone.utc) - timedelta(days=7))
        .group_by(func.date(Alert.created_at))
        .all()
    )
    counts_by_date = {str(d): c for d, c in trend_rows}
    alerts_trend_7d = [
        TrendPoint(date=str(d), count=counts_by_date.get(str(d), 0))
        for d in (today - timedelta(days=i) for i in range(6, -1, -1))
    ]

    mitre_rows = (
        db.query(Alert.mitre_technique, func.count(Alert.id))
        .filter(Alert.mitre_technique.isnot(None))
        .group_by(Alert.mitre_technique)
        .order_by(func.count(Alert.id).desc())
        .limit(6)
        .all()
    )
    top_mitre_techniques = [MitreCount(technique=t, count=c) for t, c in mitre_rows]

    agent_status_rows = db.query(Agent.status, func.count(Agent.id)).group_by(Agent.status).all()
    status_counts = {status.value: count for status, count in agent_status_rows}

    open_alerts = db.query(func.count(Alert.id)).filter(Alert.status.in_(OPEN_STATUSES)).scalar() or 0

    return DashboardSummary(
        alerts_by_severity=alerts_by_severity,
        alerts_trend_7d=alerts_trend_7d,
        top_mitre_techniques=top_mitre_techniques,
        agents_online=status_counts.get("online", 0),
        agents_offline=status_counts.get("offline", 0),
        agents_isolated=status_counts.get("isolated", 0),
        open_alerts=open_alerts,
    )
