import enum


class Severity(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    info = "info"


class AlertStatus(str, enum.Enum):
    new = "new"
    investigating = "investigating"
    resolved = "resolved"
    false_positive = "false_positive"
    closed = "closed"


class AlertSource(str, enum.Enum):
    EDR = "EDR"
    NDR = "NDR"


class AgentStatus(str, enum.Enum):
    online = "online"
    offline = "offline"
    isolated = "isolated"


class EventType(str, enum.Enum):
    process_create = "process_create"
    network_connection = "network_connection"
    file_write = "file_write"
    registry_modify = "registry_modify"
    dns_query = "dns_query"
    login = "login"


class RuleType(str, enum.Enum):
    signature = "signature"
    threshold = "threshold"
    correlation = "correlation"
