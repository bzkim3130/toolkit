# EDR/NDR 보안 분석가 대시보드 (포트폴리오)

보안 분석가(SOC Analyst)가 실제로 쓰는 EDR/NDR 콘솔을 흉내낸 포트폴리오용 웹 대시보드.
실제 EDR/NDR 제품 연동 없이 FastAPI 백엔드가 현실감 있는 알림/이벤트/에이전트/탐지룰
데이터를 생성해 제공하고, VirusTotal만 실제 API로 연동되어 있다.

문서: [`docs/01_PROJECT_STRUCTURE.md`](docs/01_PROJECT_STRUCTURE.md), [`docs/02_API_SPEC.md`](docs/02_API_SPEC.md)

## 왜 이렇게 만들었나

"EDR/NDR 콘솔이 있는 척"만 하는 정적 데모가 아니라, 실제 SOC 분석 업무 흐름을 그대로
재현하는 데 초점을 맞췄다. 알림을 클릭하면 관련 엔드포인트의 실제 이벤트 로그(프로세스
생성, 네트워크 연결, DNS 질의 등)가 그 알림 발생 시점 주변에 뭉쳐 있고, 거기서 바로
"이 구간 분석"을 실행하면 MITRE ATT&CK 기법과 조치 권고안이 나온다 — 이게 실제로
동작하게 만드는 것이 이 프로젝트의 핵심이었다.

## 기능

| 기능 | 핵심 |
|---|---|
| 대시보드 | 첫 화면. 열린 알림/에이전트 현황 통계, 7일 알림 추이, 심각도 분포, 상위 MITRE 기법 |
| 알림 조회 | 500건의 mock 알림을 심각도/상태/소스/키워드로 필터링, 상세 패널에서 상태·담당자 변경 |
| 사고 조사 (Event Search) | 시간 범위 지정 + 이벤트 검색, 특정 이벤트 기준 ±N시간 컨텍스트(전/후) 타임라인, "분석 실행"으로 AI 분석 결과 뷰 |
| Agent 조회 | 엔드포인트 30대 목록/상세, 위험도 점수, 네트워크 격리 mock 액션 |
| 탐지 룰 관리 | 룰 CRUD, 활성/비활성 토글, 실제 mock 이벤트 데이터로 dry-run 테스트 |
| Threat Intel | **실제** VirusTotal API로 파일 해시/IP/도메인/URL 조회 |
| 설정 | LLM/EDR/NDR/VirusTotal 자격증명 저장, 비밀값은 Windows DPAPI로 암호화해 로컬 저장 |

## 구성

```
EDR_NDR/
├── backend/                    FastAPI
│   ├── app/
│   │   ├── main.py             앱 진입점, 라우터 등록, lifespan(시딩)
│   │   ├── core/                config, DB 세션, DPAPI 암/복호화
│   │   ├── models/               SQLAlchemy 모델 (Agent, Alert, Event, DetectionRule, EventAnalysis, VTCache, AppSettings)
│   │   ├── schemas/              Pydantic 요청/응답 스키마
│   │   ├── api/routes/           8개 라우터: alerts, events, agents, rules, virustotal, settings, dashboard
│   │   ├── services/             VT 클라이언트, 룰 dry-run 엔진, 사고 분석 휴리스틱, 설정 키 조회
│   │   └── seed/                 Faker 기반 mock 데이터 생성기
│   └── tests/                    pytest 42개
│
├── frontend/                   React + TypeScript + Vite
│   └── src/
│       ├── pages/                대시보드/알림/사고조사/Agent/룰/ThreatIntel/설정 — 7개 화면
│       ├── components/           화면별 폴더(alerts, agents, events, rules, vt, dashboard, settings) + common
│       ├── api/                  백엔드 엔드포인트별 fetch 클라이언트
│       ├── types/                 백엔드 스키마 대응 TS 타입
│       └── lib/                   라벨/색상 매핑, 날짜 포맷 등 공통 유틸
│
└── docs/                        기획 문서 (프로젝트 구조, API 스펙)
```

백엔드는 도메인별로 model → schema → route → service가 각각 대응되고, 프론트는 화면(page)
하나당 components 폴더 하나씩 붙는 구조다.

## 기술적으로 눈여겨볼 부분

- **사고 분석 엔진**: 진짜 LLM이 없어도 동작하도록, 알려진 악성 패턴(인코딩된 PowerShell,
  LSASS 접근, C2 IP 통신 등)을 스캔하는 휴리스틱 엔진을 직접 구현했다. 설정 탭에서 실제
  LLM을 연결하면 그대로 대체될 수 있는 구조다.
- **Mock 데이터의 현실성**: 단순 랜덤 데이터가 아니라, 각 알림마다 관련 엔드포인트에
  시간대가 맞는 이벤트 클러스터(프로세스 체인, 네트워크 연결 등)를 함께 생성한다.
  그래야 "사고 조사" 기능이 실제로 의미 있게 동작한다.
- **DPAPI 암호화**: `win32crypt.CryptProtectData`로 API 키를 암호화하는데, Windows
  계정에 바인딩되기 때문에 파일이 유출돼도 다른 PC/계정에서는 복호화가 불가능하다.
- **VirusTotal 무료 API 보호**: 로컬에서 분당 4회로 요청을 먼저 제한하고, DB에 1시간
  TTL 캐시를 둬서 같은 항목 재조회 시 쿼터를 쓰지 않는다.
- **테스트**: pytest 42개 — 임시 DB로 격리해서 실제 서비스에 영향 없이 CRUD/필터/암호화/
  분석 엔진을 검증한다.

## 실행 방법

### 백엔드 (FastAPI)

```powershell
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

최초 실행 시 `backend/data/edr_ndr.db` (SQLite)가 없으면 자동으로 mock 데이터를 시딩한다.
API 문서: http://localhost:8000/docs

### 프론트엔드 (React + Vite)

```powershell
cd frontend
npm run dev
```

http://localhost:5173 에서 확인. `/api/*` 요청은 Vite 프록시를 통해 백엔드(8000)로 전달된다.

### 테스트

```powershell
cd backend
.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.venv\Scripts\python.exe -m pytest
```

`tests/conftest.py`가 임시 SQLite 파일과 축소된 mock 데이터(에이전트 10 / 알림 60 / 이벤트 300)로 앱을 띄우므로 `backend/data/edr_ndr.db`나 실제 VirusTotal 쿼터에는 영향을 주지 않는다.

## 스택

- 백엔드: FastAPI, SQLAlchemy 2.0, SQLite, Faker, httpx(VirusTotal 클라이언트), pywin32(DPAPI)
- 프론트엔드: React 19 + TypeScript, Vite, TailwindCSS 4, TanStack Query, React Router, Recharts

> DPAPI(`app/core/security.py`)는 Windows 전용 API라서 이 백엔드는 Windows에서 실행해야 한다.
> VirusTotal 키는 설정 탭에서 등록하면 DPAPI로 암호화되어 이 PC의 현재 사용자 계정에만 묶여 저장되고,
> 등록 전까지는 `backend/.env`의 `VIRUSTOTAL_API_KEY`를 개발용 기본값으로 사용한다.
