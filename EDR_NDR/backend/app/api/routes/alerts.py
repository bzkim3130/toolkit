from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import Pagination, pagination
from app.core.database import get_db
from app.models.alert import Alert
from app.models.enums import AlertSource, AlertStatus, Severity
from app.schemas.alert import AlertDetail, AlertStatsSummary, AlertSummary, AlertUpdate
from app.schemas.common import PagedResponse

router = APIRouter(prefix="/alerts", tags=["alerts"])


def _split(value: str | None) -> list[str] | None:
    if not value:
        return None
    return [v.strip() for v in value.split(",") if v.strip()]


SORT_FIELDS = {
    "created_at": Alert.created_at,
    "-created_at": Alert.created_at.desc(),
    "severity": Alert.severity,
    "-severity": Alert.severity.desc(),
    "updated_at": Alert.updated_at,
    "-updated_at": Alert.updated_at.desc(),
}


@router.get("", response_model=PagedResponse[AlertSummary])
def list_alerts(
    q: str | None = Query(None, description="제목/설명 전문 검색"),
    severity: str | None = Query(None, description="콤마 구분 다중 값, 예: critical,high"),
    status: str | None = Query(None, description="콤마 구분 다중 값, 예: new,investigating"),
    source: AlertSource | None = None,
    agent_id: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    sort: str = Query("-created_at"),
    p: Pagination = Depends(pagination),
    db: Session = Depends(get_db),
):
    query = db.query(Alert)

    if q:
        like = f"%{q}%"
        query = query.filter(or_(Alert.title.ilike(like), Alert.description.ilike(like)))

    severities = _split(severity)
    if severities:
        query = query.filter(Alert.severity.in_([Severity(s) for s in severities]))

    statuses = _split(status)
    if statuses:
        query = query.filter(Alert.status.in_([AlertStatus(s) for s in statuses]))

    if source:
        query = query.filter(Alert.source == source)
    if agent_id:
        query = query.filter(Alert.agent_id == agent_id)
    if date_from:
        query = query.filter(Alert.created_at >= date_from)
    if date_to:
        query = query.filter(Alert.created_at <= date_to)

    total = query.count()

    order_clause = SORT_FIELDS.get(sort, Alert.created_at.desc())
    items = (
        query.order_by(order_clause)
        .offset(p.offset)
        .limit(p.page_size)
        .all()
    )

    return PagedResponse(items=items, total=total, page=p.page, page_size=p.page_size)


@router.get("/stats/summary", response_model=AlertStatsSummary)
def alerts_stats_summary(db: Session = Depends(get_db)):
    by_severity_rows = db.query(Alert.severity, func.count(Alert.id)).group_by(Alert.severity).all()
    by_status_rows = db.query(Alert.status, func.count(Alert.id)).group_by(Alert.status).all()

    open_statuses = [AlertStatus.new, AlertStatus.investigating]
    total_open = db.query(func.count(Alert.id)).filter(Alert.status.in_(open_statuses)).scalar() or 0

    return AlertStatsSummary(
        by_severity={sev.value: count for sev, count in by_severity_rows},
        by_status={st.value: count for st, count in by_status_rows},
        total_open=total_open,
    )


@router.get("/{alert_id}", response_model=AlertDetail)
def get_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/{alert_id}", response_model=AlertDetail)
def update_alert(alert_id: str, payload: AlertUpdate, db: Session = Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(alert, field, value)

    db.commit()
    db.refresh(alert)
    return alert
