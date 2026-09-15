from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import Pagination, pagination
from app.core.database import get_db
from app.models.agent import Agent
from app.models.alert import Alert
from app.models.enums import AgentStatus, AlertStatus
from app.models.event import Event
from app.schemas.agent import Agent as AgentSchema
from app.schemas.agent import AgentDetail
from app.schemas.common import PagedResponse
from app.schemas.event import EventOut
from app.services.event_summary import build_summary

router = APIRouter(prefix="/agents", tags=["agents"])

OPEN_STATUSES = [AlertStatus.new, AlertStatus.investigating]


@router.get("", response_model=PagedResponse[AgentSchema])
def list_agents(
    q: str | None = Query(None, description="hostname/ip 검색"),
    status: AgentStatus | None = None,
    os: str | None = None,
    group_tag: str | None = None,
    p: Pagination = Depends(pagination),
    db: Session = Depends(get_db),
):
    query = db.query(Agent)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Agent.hostname.ilike(like), Agent.ip_address.ilike(like)))
    if status:
        query = query.filter(Agent.status == status)
    if os:
        query = query.filter(Agent.os == os)
    if group_tag:
        query = query.filter(Agent.group_tag == group_tag)

    total = query.count()
    items = query.order_by(Agent.hostname).offset(p.offset).limit(p.page_size).all()

    return PagedResponse(items=items, total=total, page=p.page, page_size=p.page_size)


@router.get("/{agent_id}", response_model=AgentDetail)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    total_alert_count = db.query(func.count(Alert.id)).filter(Alert.agent_id == agent_id).scalar() or 0
    open_alert_count = (
        db.query(func.count(Alert.id))
        .filter(Alert.agent_id == agent_id, Alert.status.in_(OPEN_STATUSES))
        .scalar()
        or 0
    )

    return AgentDetail(
        **AgentSchema.model_validate(agent).model_dump(),
        open_alert_count=open_alert_count,
        total_alert_count=total_alert_count,
    )


@router.get("/{agent_id}/events", response_model=PagedResponse[EventOut])
def get_agent_events(
    agent_id: str,
    p: Pagination = Depends(pagination),
    db: Session = Depends(get_db),
):
    agent = db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    query = db.query(Event).filter(Event.agent_id == agent_id)
    total = query.count()
    rows = query.order_by(Event.timestamp.desc()).offset(p.offset).limit(p.page_size).all()

    items = []
    for row in rows:
        out = EventOut.model_validate(row)
        out.summary = build_summary(row)
        items.append(out)

    return PagedResponse(items=items, total=total, page=p.page, page_size=p.page_size)


@router.post("/{agent_id}/isolate", response_model=AgentSchema)
def isolate_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.status = AgentStatus.isolated
    db.commit()
    db.refresh(agent)
    return agent


@router.post("/{agent_id}/unisolate", response_model=AgentSchema)
def unisolate_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.status = AgentStatus.online
    db.commit()
    db.refresh(agent)
    return agent
