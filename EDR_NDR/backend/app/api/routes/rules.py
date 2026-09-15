from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import Pagination, pagination
from app.core.database import get_db
from app.models.enums import RuleType, Severity
from app.models.rule import DetectionRule
from app.schemas.common import PagedResponse
from app.schemas.event import EventOut
from app.schemas.rule import RuleCreate, RuleOut, RuleTestResult, RuleUpdate
from app.services.event_summary import build_summary
from app.services.rule_engine import dry_run

router = APIRouter(prefix="/rules", tags=["rules"])


@router.get("", response_model=PagedResponse[RuleOut])
def list_rules(
    q: str | None = Query(None, description="이름/설명 검색"),
    severity: Severity | None = None,
    rule_type: RuleType | None = None,
    enabled: bool | None = None,
    p: Pagination = Depends(pagination),
    db: Session = Depends(get_db),
):
    query = db.query(DetectionRule)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(DetectionRule.name.ilike(like), DetectionRule.description.ilike(like)))
    if severity:
        query = query.filter(DetectionRule.severity == severity)
    if rule_type:
        query = query.filter(DetectionRule.rule_type == rule_type)
    if enabled is not None:
        query = query.filter(DetectionRule.enabled == enabled)

    total = query.count()
    items = query.order_by(DetectionRule.updated_at.desc()).offset(p.offset).limit(p.page_size).all()

    return PagedResponse(items=items, total=total, page=p.page, page_size=p.page_size)


@router.post("", response_model=RuleOut, status_code=201)
def create_rule(payload: RuleCreate, db: Session = Depends(get_db)):
    rule = DetectionRule(**payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("/{rule_id}", response_model=RuleOut)
def get_rule(rule_id: str, db: Session = Depends(get_db)):
    rule = db.get(DetectionRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@router.put("/{rule_id}", response_model=RuleOut)
def update_rule(rule_id: str, payload: RuleUpdate, db: Session = Depends(get_db)):
    rule = db.get(DetectionRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)

    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=204)
def delete_rule(rule_id: str, db: Session = Depends(get_db)):
    rule = db.get(DetectionRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()


@router.patch("/{rule_id}/toggle", response_model=RuleOut)
def toggle_rule(rule_id: str, db: Session = Depends(get_db)):
    rule = db.get(DetectionRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.enabled = not rule.enabled
    db.commit()
    db.refresh(rule)
    return rule


@router.post("/{rule_id}/test", response_model=RuleTestResult)
def test_rule(rule_id: str, db: Session = Depends(get_db)):
    rule = db.get(DetectionRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    result = dry_run(db, rule)
    samples = []
    for event in result["sample_matches"]:
        out = EventOut.model_validate(event)
        out.summary = build_summary(event)
        samples.append(out)

    return RuleTestResult(matched_count=result["matched_count"], sample_matches=samples, method=result["method"])
