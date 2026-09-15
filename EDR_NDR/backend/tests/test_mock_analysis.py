"""Unit tests for the heuristic analysis engine — pure functions, no DB/HTTP needed."""

import json
from datetime import datetime

from app.models.enums import EventType
from app.models.event import Event
from app.services.mock_analysis import analyze_events


def make_event(**overrides) -> Event:
    defaults = dict(
        id="e1",
        timestamp=datetime(2026, 1, 1, 12, 0, 0),
        agent_id="a1",
        event_type=EventType.process_create,
        process_name=None,
        command_line=None,
        parent_process=None,
        user=None,
        src_ip=None,
        dest_ip=None,
        dest_port=None,
        protocol=None,
        file_hash=None,
        file_path=None,
        raw="{}",
    )
    defaults.update(overrides)
    return Event(**defaults)


def test_encoded_powershell_flags_malicious():
    event = make_event(process_name="powershell.exe", command_line="powershell.exe -nop -w hidden -enc AAAA")
    result = analyze_events([event], None)
    assert "T1059.001" in result["mitre_techniques"]
    assert result["verdict"] in ("suspicious", "likely_malicious")


def test_clean_process_is_benign():
    event = make_event(process_name="chrome.exe", command_line='"C:\\Program Files\\Google\\Chrome\\chrome.exe"')
    result = analyze_events([event], None)
    assert result["mitre_techniques"] == []
    assert result["verdict"] == "likely_benign"


def test_lsass_access_is_flagged_critical():
    event = make_event(process_name="procdump.exe", command_line="procdump.exe -ma lsass.exe out.dmp")
    result = analyze_events([event], None)
    assert "T1003.001" in result["mitre_techniques"]
    assert result["verdict"] == "likely_malicious"


def test_known_bad_ip_communication_detected():
    event = make_event(event_type=EventType.network_connection, dest_ip="185.220.101.4")
    result = analyze_events([event], None)
    assert "T1071" in result["mitre_techniques"]


def test_suspicious_domain_query_detected():
    event = make_event(event_type=EventType.dns_query, raw=json.dumps({"domain": "abc123.xyz"}))
    result = analyze_events([event], None)
    assert "T1071.004" in result["mitre_techniques"]


def test_recommended_actions_scale_with_verdict():
    benign = analyze_events([make_event()], None)
    malicious = analyze_events(
        [make_event(process_name="procdump.exe", command_line="procdump.exe -ma lsass.exe out.dmp")], None
    )
    assert benign["recommended_actions"] != malicious["recommended_actions"]
    assert any("격리" in action for action in malicious["recommended_actions"])
