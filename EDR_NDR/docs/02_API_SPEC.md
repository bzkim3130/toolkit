# API 스펙

Base URL: `http://localhost:8000/api`
공통 규칙:
- 모든 timestamp는 ISO 8601 UTC (`2026-09-15T04:12:00Z`)
- 모든 ID는 UUID 문자열
- 리스트 응답은 페이징 봉투 사용:
  ```json
  { "items": [...], "total": 128, "page": 1, "page_size": 20 }
  ```
- 에러 응답:
  ```json
  { "detail": "human readable message", "code": "ALERT_NOT_FOUND" }
  ```

---

## 1. Alerts (알림 조회)

### `GET /api/alerts`
필터/검색 가능한 알림 리스트.

| 쿼리 파라미터 | 타입 | 설명 |
|---|---|---|
| `q` | string | 제목/설명 전문 검색 |
| `severity` | string[] | critical,high,medium,low,info (콤마 구분 다중) |
| `status` | string[] | new,investigating,resolved,false_positive,closed |
| `source` | string | EDR / NDR |
| `agent_id` | UUID | |
| `date_from`, `date_to` | datetime | `created_at` 범위 |
| `page`, `page_size` | int | 기본 1 / 20 |
| `sort` | string | 예: `-created_at` |

응답: `PagedResponse<AlertSummary>`

### `GET /api/alerts/{id}`
알림 상세 (관련 agent 요약, rule 요약 포함).

### `PATCH /api/alerts/{id}`
상태/담당자/심각도 갱신.
```json
{ "status": "investigating", "assignee": "bzkim" }
```

### `GET /api/alerts/stats/summary`
대시보드/알림 페이지 상단 위젯용 집계.
```json
{ "by_severity": {"critical": 3, "high": 12, ...}, "by_status": {...}, "total_open": 41 }
```

---

## 2. Event Search / 사고 조사 (Incident Investigation)

### `GET /api/events/search`
시간 범위 지정 이벤트 검색 (핵심 조사 화면).

| 쿼리 파라미터 | 타입 | 설명 |
|---|---|---|
| `start_time`, `end_time` | datetime | 필수. UI에서 시간 설정 |
| `agent_id` | UUID | |
| `event_type` | string[] | process_create,network_connection,file_write,registry_modify,dns_query,login |
| `keyword` | string | process_name/command_line/file_path 등 전문 검색 |
| `src_ip`, `dest_ip` | string | |
| `page`, `page_size` | int | |

응답: `PagedResponse<Event>`

### `GET /api/events/{id}`
단일 이벤트 상세 (raw JSON 포함).

### `GET /api/events/{id}/context`
**앞뒤 시간 컨텍스트 뷰.** 기준 이벤트 timestamp 앞뒤로 지정 범위(기본 2시간)의 관련 이벤트를 반환 — "사고 조사" 화면의 핵심 기능.

| 쿼리 파라미터 | 타입 | 설명 |
|---|---|---|
| `window_minutes` | int | 기본 120 (앞뒤 각각), UI 슬라이더로 조절 |
| `same_agent_only` | bool | 기본 true |

응답:
```json
{
  "anchor_event": { ... },
  "before": [Event, ...],
  "after": [Event, ...]
}
```

### `POST /api/events/analyze`
선택된 이벤트/알림 묶음을 설정된 LLM 엔드포인트에 보내 조사 요약 생성. LLM 미설정 시 규칙 기반 mock 요약으로 폴백.

요청:
```json
{ "alert_id": "uuid", "event_ids": ["uuid", "uuid"] }
```
응답:
```json
{
  "analysis_id": "uuid",
  "summary": "설명 텍스트 (타임라인 요약)",
  "mitre_techniques": ["T1059.001", "T1071"],
  "verdict": "likely_malicious",
  "recommended_actions": ["엔드포인트 격리", "IOC 차단"],
  "generated_by": "llm" 
}
```

### `GET /api/events/analyze/{analysis_id}`
과거 분석 결과 재조회 (재요청 없이 캐시된 결과 표시).

---

## 3. Agents (엔드포인트 조회)

### `GET /api/agents`
| 쿼리 파라미터 | 설명 |
|---|---|
| `q` | hostname/ip 검색 |
| `status` | online/offline/isolated |
| `os` | |
| `group_tag` | |

응답: `PagedResponse<Agent>`

### `GET /api/agents/{id}`
에이전트 상세 (risk_score, 최근 알림 개수 포함).

### `GET /api/agents/{id}/events`
해당 에이전트의 최근 이벤트 (Event Search로 딥링크 시 사용). `?limit=100` 등.

### `POST /api/agents/{id}/isolate` / `POST /api/agents/{id}/unisolate`
*(선택 기능)* mock 격리 액션 — status를 `isolated`/`online`으로 토글, 실제 EDR 호출 없음.

---

## 4. Detection Rules (탐지 룰)

### `GET /api/rules`
`?q=&severity=&rule_type=&enabled=&page=&page_size=`

### `POST /api/rules`
```json
{
  "name": "Suspicious PowerShell EncodedCommand",
  "description": "...",
  "rule_type": "signature",
  "severity": "high",
  "logic": "process_name == 'powershell.exe' AND command_line CONTAINS '-enc'",
  "mitre_technique": "T1059.001",
  "enabled": true
}
```

### `GET /api/rules/{id}` / `PUT /api/rules/{id}` / `DELETE /api/rules/{id}`
표준 CRUD.

### `PATCH /api/rules/{id}/toggle`
`enabled` 값만 토글.

### `POST /api/rules/{id}/test` *(선택 기능)*
저장된 `logic`을 mock 이벤트 셋에 대해 dry-run. 응답:
```json
{ "matched_count": 7, "sample_matches": [Event, ...] }
```

---

## 5. VirusTotal 연동 (실 API 키 사용)

내부적으로 VT REST API v3를 프록시하며, DB에 TTL 캐시(예: 1시간)를 두어 무료 티어 레이트리밋(4 req/min, 500/day)을 보호한다.

### `GET /api/vt/file/{hash}`
md5/sha1/sha256 지원. VT `/files/{id}` 프록시.
응답 (요약 정규화):
```json
{
  "hash": "...",
  "detection_ratio": "42/71",
  "malicious_vendors": ["Kaspersky", "Microsoft", ...],
  "file_type": "PE32",
  "first_seen": "...",
  "cached": true,
  "raw": { ... VT 원본 ... }
}
```

### `GET /api/vt/ip/{ip}`
VT `/ip_addresses/{ip}` 프록시. reputation, 최근 통신 도메인, AS 정보 등 정규화.

### `GET /api/vt/domain/{domain}`
VT `/domains/{domain}` 프록시. 카테고리, 등록 정보, reputation.

### `POST /api/vt/url`
```json
{ "url": "http://example.com/x" }
```
URL 제출 → VT 분석 ID 반환 → 내부적으로 폴링 후 결과 반환 (또는 202 + `GET /api/vt/url/{analysis_id}`로 분리).

### `GET /api/vt/quota`
설정된 API 키의 남은 일일/분당 쿼터 표시 (UI 상단에 "오늘 남은 조회: N" 배지용).

> VT API 키는 Settings에 저장된 값을 서버 측에서만 사용하며, 프론트에는 절대 노출하지 않는다 (백엔드가 프록시).

---

## 6. Settings (설정)

### `GET /api/settings`
저장된 설정을 마스킹된 형태로 반환.
```json
{
  "llm_endpoint": "https://api.example.com/v1/chat/completions",
  "llm_model": "gpt-4o-mini",
  "llm_api_key_masked": "sk-****ab12",
  "edr_api_url": "https://edr.local/api",
  "edr_api_token_masked": "tok-****91",
  "ndr_api_url": null,
  "ndr_api_token_masked": null,
  "virustotal_api_key_masked": "vt-****cd34"
}
```

### `PUT /api/settings`
부분 업데이트 허용. 비밀 필드는 평문으로 요청받아 저장 시 DPAPI로 암호화, 응답은 항상 마스킹.
```json
{ "virustotal_api_key": "실제키...", "llm_endpoint": "..." }
```

### `POST /api/settings/test-connection`
```json
{ "target": "virustotal" }
```
해당 대상에 가벼운 호출(예: VT `/users/{apikey}` 또는 LLM에 1토큰짜리 ping)을 시도해 성공/실패 반환.
```json
{ "ok": true, "message": "연결 성공" }
```

---

## 7. (선택) Dashboard 요약

### `GET /api/dashboard/summary`
```json
{
  "alerts_by_severity": {"critical": 3, "high": 12, "medium": 30, "low": 40, "info": 8},
  "alerts_trend_7d": [{"date": "2026-09-09", "count": 12}, ...],
  "top_mitre_techniques": [{"technique": "T1059.001", "count": 9}, ...],
  "agents_online": 27,
  "agents_offline": 3,
  "agents_isolated": 1,
  "open_alerts": 41
}
```

---

## 엔드포인트 총괄표

| 메서드 | 경로 | 기능 |
|---|---|---|
| GET | /api/alerts | 알림 리스트/필터/검색 |
| GET | /api/alerts/{id} | 알림 상세 |
| PATCH | /api/alerts/{id} | 알림 상태/담당자 갱신 |
| GET | /api/alerts/stats/summary | 알림 집계 |
| GET | /api/events/search | 시간범위 이벤트 검색 |
| GET | /api/events/{id} | 이벤트 상세 |
| GET | /api/events/{id}/context | 앞뒤 시간 컨텍스트(기본 ±2h) |
| POST | /api/events/analyze | LLM 기반 사고 분석 |
| GET | /api/events/analyze/{id} | 분석 결과 재조회 |
| GET | /api/agents | 엔드포인트 리스트 |
| GET | /api/agents/{id} | 엔드포인트 상세 |
| GET | /api/agents/{id}/events | 엔드포인트별 이벤트 |
| POST | /api/agents/{id}/isolate | (선택) mock 격리 |
| POST | /api/agents/{id}/unisolate | (선택) mock 격리 해제 |
| GET | /api/rules | 탐지 룰 리스트 |
| POST | /api/rules | 룰 생성 |
| GET | /api/rules/{id} | 룰 상세 |
| PUT | /api/rules/{id} | 룰 수정 |
| DELETE | /api/rules/{id} | 룰 삭제 |
| PATCH | /api/rules/{id}/toggle | 룰 활성/비활성 |
| POST | /api/rules/{id}/test | (선택) 룰 dry-run |
| GET | /api/vt/file/{hash} | VT 파일 해시 조회 |
| GET | /api/vt/ip/{ip} | VT IP 평판 조회 |
| GET | /api/vt/domain/{domain} | VT 도메인 평판 조회 |
| POST | /api/vt/url | VT URL 제출/조회 |
| GET | /api/vt/quota | VT 쿼터 조회 |
| GET | /api/settings | 설정 조회(마스킹) |
| PUT | /api/settings | 설정 저장(DPAPI 암호화) |
| POST | /api/settings/test-connection | 연결 테스트 |
| GET | /api/dashboard/summary | (선택) 대시보드 요약 |
