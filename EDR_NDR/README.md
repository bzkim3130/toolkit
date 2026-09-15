# EDR/NDR 보안 분석가 대시보드 (포트폴리오)

Mock 데이터 기반으로 동작하는 EDR/NDR SOC 분석가용 웹 대시보드. 실제 제품 연동 없이
FastAPI 백엔드가 현실감 있는 알림/이벤트/에이전트/탐지룰 데이터를 생성해 제공한다.

문서: [`docs/01_PROJECT_STRUCTURE.md`](docs/01_PROJECT_STRUCTURE.md), [`docs/02_API_SPEC.md`](docs/02_API_SPEC.md)

## 진행 상황

- [x] Mock 데이터 생성기 (Agent 30 / Rule 20 / Alert 500 / Event 5000, SQLite 자동 시딩)
- [x] 알림 조회 (필터/검색/페이지네이션 + 상세 패널 + 상태·담당자 변경)
- [x] 사고 조사 (Event Search, 시간범위 검색 + ±N시간 컨텍스트 뷰 + 휴리스틱 분석 결과, 알림에서 딥링크)
- [x] Agent 조회 (목록/상세/최근 이벤트 + 네트워크 격리 액션)
- [x] 탐지 룰 등록/관리 (CRUD + 활성/비활성 토글 + 이벤트 기반 테스트 실행)
- [x] VirusTotal 연동 (파일 해시/IP/도메인/URL 조회, 실제 API 키 사용, DB 캐시 + 분당 요청 제한)
- [x] 설정 탭 (LLM/EDR/NDR/VirusTotal 자격증명 저장, 비밀 값은 Windows DPAPI로 암호화 + 연결 테스트)
- [x] 대시보드 개요 (열린 알림/에이전트 현황 통계, 최근 7일 알림 추이, 심각도 분포, 상위 MITRE 기법 — 첫 화면)
- [x] 백엔드 테스트 (pytest, 42개 — CRUD/필터/DPAPI 암복호화/휴리스틱 분석 엔진)

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
