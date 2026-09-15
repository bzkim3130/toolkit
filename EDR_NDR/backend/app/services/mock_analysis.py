"""Heuristic "analysis" used when no real LLM endpoint is configured (Settings feature,
not built yet). Scans a window of events for known-bad patterns and produces the same
shaped result an LLM-backed analysis would, so the Incident Investigation UI has a real
verdict/summary/recommendation to show without any external dependency.
"""

import json
from collections import Counter

from app.models.alert import Alert
from app.models.enums import EventType
from app.models.event import Event
from app.services.event_summary import build_summary

SUSPICIOUS_IP_PREFIXES = ("185.220.", "45.155.", "194.5.")
SUSPICIOUS_DOMAIN_SUFFIXES = (".xyz", ".top", ".icu", ".click", ".biz", ".info", ".ru")

# (matcher(event, raw) -> bool, mitre id, human label)
HEURISTICS: list[tuple] = [
    (lambda e, r: bool(e.command_line) and "-enc" in e.command_line, "T1059.001", "인코딩된 PowerShell 명령"),
    (lambda e, r: bool(e.command_line) and "lsass" in e.command_line.lower(), "T1003.001", "LSASS 메모리 접근 시도"),
    (lambda e, r: e.process_name == "certutil.exe", "T1105", "certutil을 통한 외부 다운로드"),
    (lambda e, r: e.process_name == "schtasks.exe" and bool(e.command_line) and "/create" in e.command_line, "T1053.005", "의심스러운 예약 작업 생성"),
    (lambda e, r: e.process_name == "net.exe" and bool(e.command_line) and "/add" in e.command_line, "T1136.001", "로컬 계정 생성 시도"),
    (lambda e, r: e.event_type == EventType.registry_modify and "Run" in (e.file_path or ""), "T1547.001", "레지스트리 자동실행 등록"),
    (lambda e, r: bool(e.file_path) and e.file_path.endswith(".locked"), "T1486", "파일 암호화(랜섬웨어) 의심"),
    (lambda e, r: bool(e.dest_ip) and e.dest_ip.startswith(SUSPICIOUS_IP_PREFIXES), "T1071", "알려진 악성 IP와의 통신"),
    (lambda e, r: e.event_type == EventType.dns_query and str(r.get("domain", "")).endswith(SUSPICIOUS_DOMAIN_SUFFIXES), "T1071.004", "의심스러운 도메인 질의"),
    (lambda e, r: e.event_type == EventType.login and r.get("success") is False, "T1110", "로그인 실패 다수 발생"),
]

def _raw(event: Event) -> dict:
    try:
        return json.loads(event.raw or "{}")
    except (json.JSONDecodeError, TypeError):
        return {}


def analyze_events(events: list[Event], alert: Alert | None) -> dict:
    matched: list[tuple[Event, str, str]] = []
    for event in events:
        raw = _raw(event)
        for predicate, mitre_id, label in HEURISTICS:
            try:
                if predicate(event, raw):
                    matched.append((event, mitre_id, label))
            except Exception:  # noqa: BLE001 - defensive, mock data is well-formed but stay safe
                continue

    techniques = sorted({m[1] for m in matched})
    type_counts = Counter(e.event_type.value for e in events)

    critical_hits = {"T1003.001", "T1486", "T1071", "T1071.004"}
    if techniques and (set(techniques) & critical_hits):
        verdict = "likely_malicious"
    elif techniques:
        verdict = "suspicious"
    else:
        verdict = "likely_benign"

    lines = []
    if alert:
        lines.append(f"알림 '{alert.title}' 관련 시간대의 이벤트 {len(events)}건을 분석했습니다.")
    else:
        lines.append(f"선택된 시간대의 이벤트 {len(events)}건을 분석했습니다.")

    if type_counts:
        breakdown = ", ".join(f"{k} {v}건" for k, v in type_counts.most_common())
        lines.append(f"이벤트 유형 분포: {breakdown}.")

    if matched:
        lines.append(f"의심 지표 {len(matched)}건이 발견되었습니다:")
        seen = set()
        for event, mitre_id, label in sorted(matched, key=lambda m: m[0].timestamp):
            key = (mitre_id, build_summary(event))
            if key in seen:
                continue
            seen.add(key)
            lines.append(f"  - [{event.timestamp.strftime('%H:%M:%S')}] {label} ({mitre_id}): {build_summary(event)}")
    else:
        lines.append("알려진 악성 패턴과 일치하는 이벤트는 발견되지 않았습니다.")

    if verdict == "likely_malicious":
        actions = ["해당 엔드포인트 네트워크 격리", "관련 해시/IP/도메인의 조직 내 확산 여부 확인", "사고 티켓 생성 및 담당자 배정"]
    elif verdict == "suspicious":
        actions = ["관련 사용자 및 엔드포인트에 대한 추가 로그 확인", "담당 분석가 배정 후 수동 조사"]
    else:
        actions = ["현재 관찰된 패턴으로는 정상 활동에 가까움 — 오탐 여부 검토 후 종료 처리 검토"]

    return {
        "summary": "\n".join(lines),
        "mitre_techniques": techniques,
        "verdict": verdict,
        "recommended_actions": actions,
    }
