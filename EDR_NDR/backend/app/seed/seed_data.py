import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.agent import Agent
from app.models.alert import Alert
from app.models.event import Event
from app.models.rule import DetectionRule
from app.seed.generators import generate_agents, generate_alerts, generate_events, generate_rules

logger = logging.getLogger(__name__)


def seed_if_empty(db: Session) -> None:
    if db.query(Agent).first() is not None:
        logger.info("Seed skipped: data already present.")
        return

    logger.info("Seeding mock EDR/NDR dataset...")

    agent_dicts = generate_agents(settings.seed_agent_count)
    db.bulk_insert_mappings(Agent, agent_dicts)

    rule_dicts = generate_rules(settings.seed_rule_count)
    db.bulk_insert_mappings(DetectionRule, rule_dicts)

    alert_dicts = generate_alerts(settings.seed_alert_count, agent_dicts, rule_dicts, settings.seed_days_back)
    event_dicts = generate_events(settings.seed_event_count, agent_dicts, alert_dicts, settings.seed_days_back)

    clean_alerts = [{k: v for k, v in a.items() if not k.startswith("_")} for a in alert_dicts]
    db.bulk_insert_mappings(Alert, clean_alerts)
    db.bulk_insert_mappings(Event, event_dicts)

    db.commit()
    logger.info(
        "Seed complete: %d agents, %d rules, %d alerts, %d events.",
        len(agent_dicts), len(rule_dicts), len(clean_alerts), len(event_dicts),
    )
