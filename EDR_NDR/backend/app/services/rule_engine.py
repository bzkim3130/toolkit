"""Dry-run ("test") a detection rule against the seeded mock event set.

`DetectionRule.logic` is free-text pseudo-DSL, not a real query language, so this
does not parse and evaluate it. Instead: if the rule's MITRE technique matches one
of the heuristic matchers used for incident analysis, reuse that matcher (it's the
same kind of condition the rule's logic text describes). Otherwise fall back to a
naive literal-match: pull any quoted strings out of the logic text and check whether
they show up in the obvious event fields. This is enough to make "test this rule"
feel real against the mock dataset without pretending to be a production rule engine.
"""

import json
import re
from sqlalchemy.orm import Session

from app.models.event import Event
from app.models.rule import DetectionRule
from app.services.mock_analysis import HEURISTICS

HEURISTIC_BY_MITRE = {mitre_id: predicate for predicate, mitre_id, _ in HEURISTICS}

_QUOTED = re.compile(r"'([^']+)'")


def _raw(event: Event) -> dict:
    try:
        return json.loads(event.raw or "{}")
    except (json.JSONDecodeError, TypeError):
        return {}


def dry_run(db: Session, rule: DetectionRule, sample_limit: int = 5) -> dict:
    predicate = HEURISTIC_BY_MITRE.get(rule.mitre_technique or "")
    method = "heuristic"

    if predicate is None:
        literals = _QUOTED.findall(rule.logic or "")
        method = "literal_match" if literals else "no_match"

        def predicate(event: Event, raw: dict) -> bool:  # noqa: ARG001
            haystack = " ".join(
                filter(None, [event.process_name, event.command_line, event.file_path])
            ).lower()
            return any(lit.lower() in haystack for lit in literals)

    matches: list[Event] = []
    matched_count = 0
    for event in db.query(Event).yield_per(500):
        if predicate(event, _raw(event)):
            matched_count += 1
            if len(matches) < sample_limit:
                matches.append(event)

    return {"matched_count": matched_count, "sample_matches": matches, "method": method}
