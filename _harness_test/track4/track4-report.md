# 트랙 4 재검증 리포트 — 실제 테스트 앱 기반

**일자:** 2026-06-08
**대상:** CoolHan Development Harness (Task 1-8)
**테스트 앱:** FastAPI 샘플 앱 (`_harness_test/track4/sample-app/`)
**목적:** 기획자 의도 강제 메커니즘(P0, 트랙 3 구축)의 실작동 재검증 + 하네스 이식성 결함 식별

---

## 1. 실행 요약

| Task | 에이전트 | 결과 | 증거 |
|------|---------|------|------|
| 1 의도 분석 | Intent Analyzer | ✅ PASS | `01_requirements-track4.md` — [기획자 의도] + 금지 6항목 |
| 2 스펙 작성 | Spec Writer | ✅ PASS | `02_specification-track4.md` — 테이블 1, 엔드포인트 2, 07 충돌 없음 |
| 3 코드 구현 | Developer | ✅ PASS | `sample-app/` — pytest 8 pass, 범위 준수 (무단 추가 0) |
| 4 소스 검증 | Validator | ✅ 메커니즘 작동 | `04_validation-report-A.json` (PASS) / `-B.json` (FAIL) |
| 5 통합 테스트 | QA Tester | ✅ PASS | `05_test-results.json` — 8 pass, 승인기준 9/9 |
| 6 배포 | DevOps/Deployer | ✅ PASS | `06_deployment-log.json` — 부팅 OK, `/`=200, 무인증 `/feedback`=401 |
| 7 환경 검증 | Integration Validator | ➖ 부분 적용 | Task 6 배포 스모크가 포트/API/인증을 이미 커버 (중복) |
| 8 E2E | E2E Tester | ⛔ 비적용 | UI 없는 헤드리스 JSON API — 브라우저/반응형 검증 대상 없음 |

---

## 2. 핵심 검증: 기획자 의도 강제 메커니즘 (P0)

**방법 (적대적/무편향):** Validator를 두 코드베이스에 독립 실행. 어느 쪽이 클린/위반인지
사전에 알리지 않음 — Validator가 증거(소스의 실제 엔드포인트·테이블)만으로 판정.

| 코드베이스 | 0단계 기획 의도 검증 | overall | 무단 추가 감지 |
|-----------|---------------------|---------|---------------|
| **A (클린)** `sample-app/` | **PASS** | PASS | `[]` (정확) |
| **B (위반)** `sample-app-violated/` | **FAIL** | FAIL | 2건 정확 감지 |

**B에서 감지된 무단 추가 (기획서 명시적 금지 위반):**
1. `GET /health` 엔드포인트 — `routes.py:18` (금지목록 #1 직접 위반)
2. `health_status` 테이블 — `models.py:33` (승인기준 "테이블 1개" 위반)

> 두 Validator 모두 프레임워크 자동 라우트(`/openapi.json`, `/docs`, `/redoc`)와
> 베이스라인 `GET /`를 위반으로 오탐하지 않음 (정밀도 양호).

### 판정: ✅ 메커니즘 작동 확인

기획자 의도 강제 메커니즘이 **무단 기능 추가를 실제로 감지**한다.
클린 코드는 통과시키고(거짓 양성 없음), 위반 코드는 정확한 항목·위치와 함께 차단한다(거짓 음성 없음).

---

## 3. 식별된 하네스 결함 (Gap)

### GAP-1 (P0): validator/qa/devops 에이전트의 Node/npm 종속

**증상:** validator.md·qa-tester.md·devops-deployer.md가 Node 전용 명령을 전제한다:
- `npm run list-endpoints`, `npm run list-tables`, `npm run list-components`
- `npm run spec:parse`, `npm run code:analyze`, `npm run build`, `npm run lint`, `npm test`
- 진입 게이트 Health Check가 `package.json` 존재를 확인

**영향:** Python/FastAPI 프로젝트에는 `package.json`·npm 스크립트가 없어 위 명령이 전부 실행 불가.
- Task 4의 8단계(테스트)·9단계(빌드/린트)가 **NOT_RUN** 처리됨
- Task 5가 `npm test` 대신 pytest로 대체 실행
- Task 6이 `npm run build`(빌드 단계 없음) 대신 uvicorn 직접 구동으로 대체

**다행인 점:** 0단계 기획 의도 검증은 **언어 무관 의미 비교**(소스의 라우트/테이블 vs 기획서)라
npm 부재에도 정상 작동했다. 즉 P0 핵심 메커니즘은 이식성 문제의 영향을 받지 않는다.

**권고 (GAP-1 수정안):**
1. 에이전트 정의에 **스택 감지** 단계 추가: `package.json` → Node, `requirements.txt`/`pyproject.toml` → Python
2. 스택별 명령 매핑 테이블 제공:
   | 작업 | Node | Python/FastAPI |
   |------|------|----------------|
   | 엔드포인트 추출 | `npm run list-endpoints` | `app.routes` 순회 또는 소스 데코레이터 파싱 |
   | 테이블 추출 | `npm run list-tables` | `Base.metadata.tables` 또는 `__tablename__` 파싱 |
   | 테스트 | `npm test` | `pytest` |
   | 빌드/린트 | `npm run build && npm run lint` | (빌드 없음) `ruff`/`flake8` + import 체크 |
   | 헬스체크 | `npm run healthcheck` | uvicorn 구동 + curl |
3. 진입 게이트 Health Check를 "package.json 존재" → "프로젝트 매니페스트(any) 존재"로 일반화

### GAP-2 (P2): 산출물 파일명 불일치

에이전트 정의는 `validation-report-{timestamp}.json`·`test-results-{timestamp}.json`을 명시하나,
오케스트레이터는 `04_validation-report-{id}.json`·`05_test-results.json`을 요구. 명명 규칙 통일 필요.

### GAP-3 (P3): 음성(anti-scope) 테스트 부재

QA(Task 5)의 pytest는 정상 동작만 검증하고, 금지 기능 부재(헬스/admin/통계 없음)는
정적 읽기로만 확인됨. 범위 경계 강제는 Validator(Task 4) 0단계가 담당하나,
QA 단계에도 "금지 엔드포인트 호출 시 404" 류의 음성 테스트를 추가하면 이중 방어가 된다.

---

## 4. 결론

1. **P0 메커니즘 검증 완료** — 기획자 의도 강제(무단 기능 추가 감지)가 실제 코드에서 작동함을 입증.
   클린→PASS, 위반→FAIL(항목·위치 명시), 오탐/누락 없음.
2. **6명 팀 워크플로우(Task 1-6) 실작동 확인** — 의도→스펙→코드→검증→테스트→배포가
   기획자 의도 범위 내에서만 산출물을 생성하며 끝까지 완주.
3. **이식성 결함(GAP-1) 식별** — 검증/QA/배포 에이전트가 Node 전용. Python 등 타 스택 지원을
   위한 스택 감지 + 명령 매핑이 필요. (단, P0 핵심은 영향 없음)
4. **Task 7-8 적용성 정리** — 환경 검증은 배포 스모크와 중복, E2E는 UI 없는 API에 비적용.

**다음 액션 후보:** GAP-1 수정 (validator/qa-tester/devops-deployer.md에 스택 감지 + Python 매핑 추가).
