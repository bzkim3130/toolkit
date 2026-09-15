import json

from app.models.enums import EventType
from app.models.event import Event


def _raw(event: Event) -> dict:
    try:
        return json.loads(event.raw or "{}")
    except (json.JSONDecodeError, TypeError):
        return {}


def build_summary(event: Event) -> str:
    raw = _raw(event)

    if event.event_type == EventType.process_create:
        return f"{event.parent_process or '?'} → {event.process_name} ({event.command_line or ''})".strip()

    if event.event_type == EventType.network_connection:
        return f"{event.src_ip or '?'} → {event.dest_ip}:{event.dest_port} ({event.protocol or ''})"

    if event.event_type == EventType.dns_query:
        domain = raw.get("domain", "?")
        return f"DNS 질의: {domain}"

    if event.event_type == EventType.file_write:
        return f"파일 생성/수정: {event.file_path} (해시 {event.file_hash[:12] if event.file_hash else '?'}...)"

    if event.event_type == EventType.registry_modify:
        value_name = raw.get("value_name", "?")
        return f"레지스트리 변경: {event.file_path}\\{value_name}"

    if event.event_type == EventType.login:
        success = raw.get("success", True)
        return f"로그온 {'성공' if success else '실패'}: {event.user} @ {event.src_ip or '?'} ({raw.get('logon_type', '')})"

    return "이벤트"
