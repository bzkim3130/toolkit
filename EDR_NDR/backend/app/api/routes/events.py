import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import Pagination, pagination
from app.core.database import get_db
from app.models.alert import Alert
from app.models.analysis import EventAnalysis
from app.models.enums import EventType
from app.models.event import Event
from app.schemas.analysis import AnalysisResult, AnalyzeRequest
from app.schemas.common import PagedResponse
from app.schemas.event import EventContextResponse, EventOut
from app.services.event_summary import build_summary
from app.services.mock_analysis import analyze_events

router = APIRouter(prefix="/events", tags=["events"])


def _split(value: str | None) -> list[str] | None:
    if not value:
        return None
    return [v.strip() for v in value.split(",") if v.strip()]


def _to_out(event: Event) -> EventOut:
    out = EventOut.model_validate(event)
    out.summary = build_summary(event)
    return out


@router.get("/search", response_model=PagedResponse[EventOut])
def search_events(
    start_time: datetime = Query(..., description="검색 시작 시각 (UTC)"),
    end_time: datetime = Query(..., description="검색 종료 시각 (UTC)"),
    agent_id: str | None = Query(None),
    event_type: str | None = Query(None, description="콤마 구분 다중 값"),
    keyword: str | None = Query(None, description="process_name/command_line/file_path 등 전문 검색"),
    src_ip: str | None = Query(None),
    dest_ip: str | None = Query(None),
    p: Pagination = Depends(pagination),
    db: Session = Depends(get_db),
):
    if start_time >= end_time:
        raise HTTPException(status_code=400, detail="start_time must be before end_time")

    query = db.query(Event).filter(Event.timestamp >= start_time, Event.timestamp <= end_time)

    if agent_id:
        query = query.filter(Event.agent_id == agent_id)

    types = _split(event_type)
    if types:
        query = query.filter(Event.event_type.in_([EventType(t) for t in types]))

    if keyword:
        like = f"%{keyword}%"
        query = query.filter(
            or_(
                Event.process_name.ilike(like),
                Event.command_line.ilike(like),
                Event.file_path.ilike(like),
                Event.raw.ilike(like),
            )
        )

    if src_ip:
        query = query.filter(Event.src_ip == src_ip)
    if dest_ip:
        query = query.filter(Event.dest_ip == dest_ip)

    total = query.count()
    rows = query.order_by(Event.timestamp.desc()).offset(p.offset).limit(p.page_size).all()

    return PagedResponse(items=[_to_out(e) for e in rows], total=total, page=p.page, page_size=p.page_size)


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return _to_out(event)


@router.get("/{event_id}/context", response_model=EventContextResponse)
def get_event_context(
    event_id: str,
    window_minutes: int = Query(120, ge=1, le=1440, description="기준 이벤트 앞뒤 각각 몇 분까지 볼지 (기본 120분 = ±2시간)"),
    same_agent_only: bool = Query(True),
    db: Session = Depends(get_db),
):
    anchor = db.get(Event, event_id)
    if not anchor:
        raise HTTPException(status_code=404, detail="Event not found")

    window = timedelta(minutes=window_minutes)
    start = anchor.timestamp - window
    end = anchor.timestamp + window

    query = db.query(Event).filter(Event.timestamp >= start, Event.timestamp <= end, Event.id != anchor.id)
    if same_agent_only:
        query = query.filter(Event.agent_id == anchor.agent_id)

    before = query.filter(Event.timestamp < anchor.timestamp).order_by(Event.timestamp.desc()).limit(200).all()
    after = query.filter(Event.timestamp >= anchor.timestamp).order_by(Event.timestamp.asc()).limit(200).all()

    return EventContextResponse(
        anchor_event=_to_out(anchor),
        before=[_to_out(e) for e in reversed(before)],
        after=[_to_out(e) for e in after],
    )


@router.post("/analyze", response_model=AnalysisResult)
def analyze(payload: AnalyzeRequest, db: Session = Depends(get_db)):
    if not payload.alert_id and not payload.event_ids:
        raise HTTPException(status_code=400, detail="alert_id or event_ids is required")

    alert: Alert | None = None
    events: list[Event] = []

    if payload.alert_id:
        alert = db.get(Alert, payload.alert_id)
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")

        if not payload.regenerate:
            cached = (
                db.query(EventAnalysis)
                .filter(EventAnalysis.alert_id == alert.id)
                .order_by(EventAnalysis.created_at.desc())
                .first()
            )
            if cached:
                return _analysis_to_result(cached)

        if alert.agent_id:
            window = timedelta(minutes=30)
            events = (
                db.query(Event)
                .filter(
                    Event.agent_id == alert.agent_id,
                    Event.timestamp >= alert.created_at - window,
                    Event.timestamp <= alert.created_at + window,
                )
                .order_by(Event.timestamp.asc())
                .all()
            )
    elif payload.event_ids:
        events = db.query(Event).filter(Event.id.in_(payload.event_ids)).order_by(Event.timestamp.asc()).all()

    result = analyze_events(events, alert)

    record = EventAnalysis(
        alert_id=alert.id if alert else None,
        event_ids=json.dumps([e.id for e in events]),
        summary=result["summary"],
        mitre_techniques=json.dumps(result["mitre_techniques"]),
        verdict=result["verdict"],
        recommended_actions=json.dumps(result["recommended_actions"]),
        generated_by="heuristic",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return _analysis_to_result(record)


@router.get("/analyze/{analysis_id}", response_model=AnalysisResult)
def get_analysis(analysis_id: str, db: Session = Depends(get_db)):
    record = db.get(EventAnalysis, analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return _analysis_to_result(record)


def _analysis_to_result(record: EventAnalysis) -> AnalysisResult:
    return AnalysisResult(
        analysis_id=record.id,
        alert_id=record.alert_id,
        event_count=len(json.loads(record.event_ids or "[]")),
        summary=record.summary,
        mitre_techniques=json.loads(record.mitre_techniques or "[]"),
        verdict=record.verdict,
        recommended_actions=json.loads(record.recommended_actions or "[]"),
        generated_by=record.generated_by,
        created_at=record.created_at,
    )
