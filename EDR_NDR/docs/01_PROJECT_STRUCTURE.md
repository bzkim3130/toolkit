# EDR/NDR 보안 분석가 대시보드 — 프로젝트 구조

포트폴리오용 웹 대시보드. 실제 EDR/NDR 콘솔 연동 없이 Mock 데이터로 동작하되,
VirusTotal API만 실제 무료 API 키로 연동한다.

## 1. 스택 결정

| 영역 | 선택 | 이유 |
|---|---|---|
| 백엔드 | Python + FastAPI | 빠른 스캐폴딩, Pydantic으로 스키마/검증 자동화, async 지원 (VT API 호출에 유리) |
| DB | SQLite (SQLAlchemy) | 포트폴리오 단일 실행 환경에 적합, 파일 하나로 배포/초기화 용이 |
| Mock 데이터 | Faker + 커스텀 시더 | 프로세스명/해시/IP/MITRE 기법 등 현실감 있는 보안 데이터 생성 |
| 프론트엔드 | React + TypeScript + Vite | 빠른 개발, 타입 안정성 |
| 스타일 | TailwindCSS + shadcn/ui | 보안 콘솔 느낌의 데이터 중심 UI를 빠르게 구성 |
| 서버 상태 | TanStack Query (React Query) | 폴링/캐싱/리페치 관리 (알림 리스트, VT 조회 등) |
| 차트 | Recharts | 대시보드 요약 위젯 (선택 사항, §4 참고) |
| 로컬 암호화 | Windows DPAPI (`pywin32` `win32crypt`) | 사용자 요청대로 LLM/EDR/NDR 토큰을 OS 레벨로 암호화, 별도 마스터 키 관리 불필요 |

> DPAPI는 Windows 전용 API이므로 이 앱은 로컬 Windows 실행을 전제로 한다. (포트폴리오 시연 환경과 일치)

## 2. 리포지토리 구조

```
EDR_NDR/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI 앱 진입점, 라우터 등록, CORS
│   │   ├── core/
│   │   │   ├── config.py            # 환경변수, 앱 설정 (Pydantic Settings)
│   │   │   ├── security.py          # DPAPI encrypt/decrypt 래퍼
│   │   │   └── database.py          # SQLAlchemy engine/session
│   │   ├── models/                  # SQLAlchemy ORM 모델
│   │   │   ├── alert.py
│   │   │   ├── event.py
│   │   │   ├── agent.py
│   │   │   ├── rule.py
│   │   │   ├── settings.py
│   │   │   └── vt_cache.py
│   │   ├── schemas/                 # Pydantic 요청/응답 스키마
│   │   │   ├── alert.py
│   │   │   ├── event.py
│   │   │   ├── agent.py
│   │   │   ├── rule.py
│   │   │   ├── settings.py
│   │   │   └── virustotal.py
│   │   ├── api/
│   │   │   ├── deps.py              # 공통 의존성 (페이징, DB 세션)
│   │   │   └── routes/
│   │   │       ├── alerts.py
│   │   │       ├── events.py
│   │   │       ├── agents.py
│   │   │       ├── rules.py
│   │   │       ├── virustotal.py
│   │   │       ├── settings.py
│   │   │       └── dashboard.py     # 선택 사항, §4 참고
│   │   ├── services/
│   │   │   ├── virustotal_client.py # VT REST API 클라이언트 (httpx, rate-limit 처리)
│   │   │   ├── llm_client.py        # 설정된 LLM 엔드포인트 호출 (사고 분석 요약용)
│   │   │   └── rule_engine.py       # 룰 "테스트 실행" 시 mock 이벤트 매칭 로직
│   │   └── seed/
│   │       ├── generators.py        # Faker 기반 alert/event/agent 생성기
│   │       └── seed_data.py         # 최초 실행 시 DB 시딩 스크립트
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                  # 라우팅, 레이아웃
│   │   ├── pages/
│   │   │   ├── AlertsPage.tsx
│   │   │   ├── IncidentInvestigationPage.tsx  # Event Search + 분석 뷰
│   │   │   ├── AgentsPage.tsx
│   │   │   ├── DetectionRulesPage.tsx
│   │   │   ├── ThreatIntelPage.tsx  # VirusTotal 조회
│   │   │   └── SettingsPage.tsx
│   │   ├── components/
│   │   │   ├── layout/              # Sidebar, Topbar
│   │   │   ├── alerts/              # AlertTable, FilterBar, SeverityBadge
│   │   │   ├── events/              # EventTable, TimeRangePicker, ContextTimeline
│   │   │   ├── agents/              # AgentTable, AgentDetailDrawer
│   │   │   ├── rules/                # RuleForm, RuleTable, RuleTestPanel
│   │   │   ├── vt/                   # VTResultCard (file/ip/domain 별)
│   │   │   └── common/               # DataTable, Pagination, StatusPill
│   │   ├── api/                      # 리소스별 타입 있는 fetch 클라이언트
│   │   ├── types/                    # 백엔드 스키마 대응 TS 인터페이스
│   │   └── hooks/
│   ├── package.json
│   └── vite.config.ts
│
├── docs/
│   ├── 01_PROJECT_STRUCTURE.md      # 이 문서
│   └── 02_API_SPEC.md
└── README.md
```

## 3. 데이터 모델

### Alert (알림)
| 필드 | 타입 | 비고 |
|---|---|---|
| id | UUID | |
| title | string | |
| description | string | |
| severity | enum | critical / high / medium / low / info |
| status | enum | new / investigating / resolved / false_positive / closed |
| source | enum | EDR / NDR |
| agent_id | UUID? | 관련 엔드포인트 (NDR 알림은 null 가능) |
| src_ip / dest_ip | string? | |
| mitre_technique | string? | 예: T1059.001 |
| detection_rule_id | UUID? | 어떤 룰이 발생시켰는지 |
| assignee | string? | |
| created_at / updated_at | datetime | |

### Event (원시 텔레메트리 — Event Search 대상)
| 필드 | 타입 | 비고 |
|---|---|---|
| id | UUID | |
| timestamp | datetime | |
| agent_id | UUID | |
| event_type | enum | process_create / network_connection / file_write / registry_modify / dns_query / login |
| process_name / command_line / parent_process | string? | 프로세스 이벤트용 |
| user | string? | |
| src_ip / dest_ip / dest_port / protocol | string?/int? | 네트워크 이벤트용 |
| file_hash / file_path | string? | 파일 이벤트용 |
| raw | JSON | 원본 필드 전체 (상세 패널에서 pretty-print) |

### Agent (엔드포인트)
| 필드 | 타입 | 비고 |
|---|---|---|
| id | UUID | |
| hostname | string | |
| ip_address | string | |
| os / os_version | string | |
| status | enum | online / offline / isolated |
| agent_version | string | |
| last_seen | datetime | |
| group_tag | string? | 예: "Finance-DMZ" |
| risk_score | int | 0-100, 최근 알림 기반 mock 점수 |

### DetectionRule (탐지 룰)
| 필드 | 타입 | 비고 |
|---|---|---|
| id | UUID | |
| name / description | string | |
| rule_type | enum | signature / threshold / correlation |
| severity | enum | |
| logic | text | 간단한 DSL 또는 Sigma 유사 YAML (조건 텍스트) |
| mitre_technique | string? | |
| enabled | bool | |
| hit_count | int | 테스트 실행/매칭 시 누적 |
| created_by / created_at / updated_at | | |

### Settings (암호화 저장)
| 필드 | 암호화 여부 |
|---|---|
| llm_endpoint, llm_model | 평문 |
| llm_api_key | DPAPI 암호화 |
| edr_api_url, ndr_api_url | 평문 |
| edr_api_token, ndr_api_token | DPAPI 암호화 |
| virustotal_api_key | DPAPI 암호화 |

암호화 흐름: `CryptProtectData(plaintext, entropy=app_salt)` → base64 저장 → 조회 시 `CryptUnprotectData`로 복호화. API 응답에는 항상 마스킹된 값(`sk-****ab12`)만 내려주고, 평문은 프론트에 절대 반환하지 않는다.

## 4. 선택 사항 (제안)

필수 기능은 아니지만 포트폴리오 완성도를 위해 추가를 제안합니다. 원치 않으면 제외:

- **대시보드 개요 페이지**: 심각도/상태별 알림 추이, 상위 MITRE 기법, 에이전트 온라인 현황을 카드+차트로 요약 (`GET /api/dashboard/summary`)
- **에이전트 격리(Isolate) mock 액션**: `POST /api/agents/{id}/isolate` — 실제 EDR 액션을 흉내내는 버튼, 시연 임팩트가 큼
- **룰 테스트 실행**: 룰 저장 전 mock 이벤트 셋에 대해 매칭 여부를 미리 보여주는 dry-run 기능

## 5. 실행 방식 (요약)

- 백엔드: `uvicorn app.main:app --reload` (포트 8000), 최초 기동 시 SQLite가 비어있으면 자동 시딩
- 프론트: `npm run dev` (Vite, 포트 5173), `/api`는 Vite 프록시로 백엔드 연결
- 인증: 포트폴리오 범위상 실제 로그인은 생략(단일 사용자 로컬 도구). 필요하면 후속 단계에서 간단한 로컬 패스코드 게이트 추가 가능
