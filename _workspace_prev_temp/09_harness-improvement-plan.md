# CoolHan 하네스 고도화 계획 (Harness Improvement Plan)

**작성:** Harness Architect (Task 9)
**작성일:** 2026-05-30
**대상 하네스:** CoolHan Development (8단계, 에이전트 8명)
**기준:** Phase A-B 검증 결과 + 에이전트/스킬/CLAUDE.md 정적 분석

---

## 1. 요약 (Executive Summary)

Phase A-B 검증에서 메인 워크플로우(Task 1-6)는 모두 PASS했고, Task 7-8 추가 검증
에이전트도 동작한다. 그러나 **하네스 문서 계층(CLAUDE.md ↔ 스킬 ↔ 에이전트)의
동기화가 깨져 있고**, 에이전트 간 입출력 프로토콜에 **핸드오프 불일치**가 존재한다.
기능 결함이 아닌 **일관성/유지보수성** 문제가 핵심이다.

가장 시급한 항목: **CLAUDE.md가 Task 7-8 / Phase A-B-C를 전혀 반영하지 못함 (P1)**.

---

## 2. Phase A-B 검증 결과 (확인됨)

| 항목 | 결과 |
|------|------|
| 6단계 메인 워크플로우 (Task 1-6) | ✅ 정상 작동 |
| Validator (Task 4) — 9단계, 40개 항목 | ✅ 전부 PASS |
| QA Tester (Task 5) — 10개 테스트 | ✅ 전부 PASS |
| DevOps/Deployer (Task 6) — 6단계 30개 항목 | ✅ 전부 PASS |
| _workspace/ 산출물 (01~06 + Phase B 리포트) | ✅ 생성 완료 |

## 3. Task 7-8 발견 사항

- [x] Task 8 (E2E Tester) 보고 수신 → 반영 (2026-05-30)
- [x] Task 7 (Integration Validator) 보고 수신 → 반영 (2026-05-30)

### 3.0 두 검증자 공통 확증 — 검증 결과가 시뮬레이션임

Task 7·8이 **독립적으로 동일 결론**에 도달 (단일 보고가 아닌 교차 확증):
- `05_test_results.json`은 10/10 PASS, 응답 45ms/12ms로 보고. 그러나 Integration
  Validator가 동일 엔드포인트를 실제 curl → **전 경로 HTTP 403** ("Automated access is
  not permitted", 봇 가드 일괄 차단). 즉 `actual` 값은 실측이 아니라 **expected 복사본**.
- netstat 실측: 3000/5432 LISTENING, **6379(Redis) 미실행** — 명세는 항상 ✅ 가정.
- E2E Tester: 피드백 앱 소스 0건, localhost:3000은 무관한 이커머스 앱.
- **결론(확정):** Phase A-B "전항목 PASS"는 증거 없는 자체 선언. 신뢰 근거로 사용 불가.

### 3.1 E2E Tester (Task 8) 실측 보고 — 핵심

E2E Tester가 실제 검증을 시도했으나 **테스트 대상 앱이 실재하지 않아 차단됨**:
- 피드백 앱 소스 0건, `_workspace/` 보고서(04/05/06)는 **실행 결과가 아닌 시뮬레이션**,
  localhost:3000은 무관한 이커머스 앱(전부 403).
- 즉 Phase A-B의 "40/10/30개 항목 전부 PASS"는 **실제 구동·증거에 기반하지 않은
  자체 선언 결과**일 가능성이 높음 → 신뢰도 재평가 필요.

이로부터 도출된 신규 P0/P1 항목 (4.6절에 상세):

- **[E-1] (P0) 검증 진입 사전조건(precondition) 게이트 부재** — 입력으로 URL·포트만 받고
  "앱이 살아있는지 + 그 앱이 맞는 대상인지"를 확인하지 않음. E2E/Integration 둘 다 해당.
- **[E-2] (P0) 리포트 템플릿 기본값이 전부 "PASS"** — 미검증 통과를 구조적으로 유도.
  기본값 NOT_RUN + 증거 없으면 PASS 금지 규칙 필요.
- **[E-3] (P1) 핸드오프 실패 실증** — e2e-tester는 Integration Validator로부터 입력을
  받게 돼 있으나 Task 7이 in_progress라 산출물 없음. team-lead가 URL을 하드코딩 전달.
  → A-1/A-2 핸드오프 결함이 실제로 발생함을 확증.
- **[E-4] (P1) 자동화 도구 미지정** — Phase 7/8/9(반응형·CSS·브라우저)가 "Chrome
  DevTools로 확인"이라 적혀 수동·재현 불가. 환경에 **Claude Preview MCP, Prisma MCP**가
  실재하므로 이를 프로토콜에 명시하면 자동·재현 가능.
- **[E-5] (P1) 9단계 항목 부적합** — Phase 1(소스 오타/문법)은 빌드·린트·타입체커 영역
  → CI 위임. Phase 2~5 예시가 이커머스 고정(장바구니/주문/할인/부가세) → 도메인 불문
  스펙에서 시나리오 동적 주입 필요. Phase 3(연산)은 비연산 기능에 N/A 허용.
- **[E-6] (P2) Integration ↔ E2E 책임 중복** — API·데이터흐름·기획서체크·성능이 양쪽에
  중복. 권고 분할: Integration=서버/포트/DB/API(headless), E2E=브라우저 렌더링/UI/반응형.
  "DB 도달" 검증은 Integration 단일 소유, E2E는 "UI 피드백 표시"까지만.

### 3.2 Integration Validator (Task 7) 실측 보고 — 추가 항목

E2E 보고를 환경 레벨에서 보강하며 **근본 원인**을 짚음:

- **[I-1] (P0) Token Efficiency Mode가 증거 제출을 구조적으로 억제 — 근본 원인**
  - 세 검증 에이전트 공통 "Token Efficiency Mode"("결과만 보고 / 과정 설명 금지 /
    소스 화면 미표시")가 raw 실측 증거 첨부를 막아, 05번 산출물이 증거 없이 PASS를 찍은
    구조적 원인.
  - 조치: 검증 산출물에 한해 Token Efficiency Mode를 완화 — 절약과 증거가 충돌하면
    **증거 우선**. 최소한 각 check에 raw 명령/응답을 첨부 강제.
- **[I-2] (P1) PASS/FAIL 2값의 한계 → 3-값 결과 도입**
  - `overall_result`가 PASS/FAIL뿐이라 "도달 실패"가 PASS로 둔갑할 여지. 전 경로 동일
    응답(예: 403 일괄)은 "검증됨"이 아니라 "도달 실패"로 분류돼야 함.
  - 조치: **PASS / FAIL / CANNOT_VALIDATE(BLOCKED)** 3-값 도입. 측정 실패와 기준미달을
    형식상 구분.
- **[I-3] (P1) 검증 항목 하드코딩 — E-5와 동일 결함, 환경 레벨에서 확증**
  - integration-validator.md 포트 목록(3000/5432/6379/4001…), DB 검증 테이블
    (users/orders/products/schema_migrations)이 **커머스 템플릿 잔재**. 피드백 피처엔
    `feedback` 테이블이어야 함. `npm run build`/`dist/` 가정도 이 리포 package.json엔
    build 스크립트 부재로 실행 불가.
  - 조치: 포트/테이블/엔드포인트/빌드명령을 spec·기획서에서 **주입**받게 (E-5와 통합).
- **[I-4] (P1) 입력 프로토콜 실체화 + 스키마 강제**
  - `05_test_results.json`에 baseURL/포트/DB접속/요구사항목록 필드가 전무 → A-1 확증.
  - 조치: QA Tester 산출물 스키마에 해당 필드 **필수**화. 미충족 시 Integration Validator가
    검증 착수 거부(진입 게이트 E-1과 연동).
- **[I-5] (P2) 산출물 파일명/형식 표준화**
  - 명세는 `integration-validation-report-{id}.json`, team-lead 지시는
    `07_integration-validation-report.json` → 불일치(A-3과 동일).
  - 각 check에 `evidence`(raw), `measured`(bool), `unreachable`(bool) 필드 부재 →
    시뮬레이션/실측을 형식상 구분 불가(E-2와 연동).

---

## 4. 개선 항목 (정적 분석 기반)

### 4.1 에이전트 정의 파일

**[A-1] (P1) QA Tester → Integration Validator 핸드오프 불일치**
- `integration-validator.md` 입력 프로토콜은 QA Tester로부터
  "테스트 환경 정보(포트, DB 호스트, API URL) + 기획서 요구사항 목록"을 받는다고 명시.
- 그러나 `qa-tester.md` 출력 프로토콜 산출물은 `test-results.json`,
  `test-coverage-report.html`, `qa-report.md`뿐 — **환경 정보/기획서 요구사항 목록을
  넘기지 않는다.** 발신 메시지도 DevOps와 Developer 대상만 정의됨.
- 결과: Task 7이 입력으로 기대하는 데이터의 출처가 끊김.
- 조치: qa-tester.md 출력에 "환경 정보 + 요구사항 체크리스트" 추가하거나,
  Integration Validator가 `_workspace/01_requirements.md` + `06_deployment_log.json`에서
  직접 읽도록 입력 프로토콜 재정의. (후자 권장 — 파일 기반 단일 출처)

**[A-2] (P1) Task 7→8 핸드오프 의존성 모호**
- `e2e-tester.md` 입력: "Integration Validator로부터 배포 완료 확인 + 접근 정보".
- SKILL.md Task 8 의존성: "Task 7 완료(PASS) **또는** Task 6 직후" — 두 경로 허용.
- Task 7을 건너뛰고 Task 8을 실행하면 e2e-tester가 기대하는 입력(접근 정보, 로그인
  정보)의 출처가 사라짐.
- 조치: Task 7 skip 시 E2E Tester가 어디서 접근 정보를 얻는지 명시 (예:
  `06_deployment_log.json`).

**[A-3] (P2) 산출물 경로 표기 불일치**
- 에이전트 문서들은 `validation-report-{id}.json`,
  `integration-validation-report-{id}.json` 등 루트 상대 경로처럼 표기.
- 실제 Phase B 산출물은 `_workspace/04_validation_report.json` (번호 접두사 + 언더스코어).
- 조치: 모든 에이전트 산출물 경로를 `_workspace/NN_*.json` 규칙으로 통일.

**[A-4] (P2) Validator만 "팀 통신 프로토콜(메시지 템플릿)" 보유**
- validator.md는 PASS/FAIL 메시지 템플릿을 상세히 갖췄으나, Integration Validator /
  E2E Tester는 간략한 "수신/발신" 한 줄뿐.
- 조치: 세 검증 에이전트의 통신 프로토콜 상세도를 동일 수준으로 정렬.

**[A-5] (P3) E2E Tester 에러 핸들링 표 부재**
- validator.md / integration-validator.md는 에러 핸들링 표가 있으나
  e2e-tester.md는 없음 (각 Phase 실패 시 누구에게 무엇을 보고하는지 미정의).
- 조치: e2e-tester.md에 에러 핸들링 표 추가 (Phase별 실패 → Developer/DevOps 라우팅).

**[A-6] (P3) 모델 지정 메타데이터 위치 비표준**
- 세 에이전트 모두 본문 하단에 `**모델:** opus`를 텍스트로 기재. 다른 하네스 에이전트와
  비교해 frontmatter 사용 여부 통일 필요 (현 파일들은 frontmatter 없음).
- 조치: 에이전트 파일 메타데이터 형식 표준 확정 후 일괄 정렬.

### 4.2 스킬 파일 (coolhan-development-orchestrator/SKILL.md)

**[S-1] (P1) 데이터 흐름도에 Task 7-8 산출물 누락**
- "데이터 흐름" 블록(_workspace/ 01~06)에 07/08 산출물
  (integration/e2e validation report)이 빠져 있음. 본문 다른 곳에는 정의되어 있어 내부
  불일치.
- 조치: _workspace/ 트리에 07_/08_ 항목 추가.

**[S-2] (P2) "한국어 명령어 하나로" 표현이 다국어 강조와 상충**
- 13행 "사용자의 자연스러운 한국어 명령어 하나로"는 50+ 언어 지원 메시지와 모순.
- 조치: "모국어 명령어 하나로"로 수정.

**[S-3] (P2) references/ 폴더 부재**
- SKILL.md만 존재. MULTILINGUAL_SUPPORT.md를 참조하나 스킬 폴더 외부(루트)에 위치 —
  스킬 자체완결성 저하.
- 조치: 다국어 트리거 표 등 대용량 참조를 `references/`로 분리하거나, 링크 경로를
  명시적으로 루트 기준으로 표기.

### 4.3 CLAUDE.md

**[C-1] (P1) Task 7-8 / 신규 에이전트 2명 미반영 — 최우선**
- CLAUDE.md "팀 구성 (Development)" 표는 여전히 **6명**. integration-validator,
  e2e-tester 누락.
- "하네스 상태" 표도 "Development … 6명 … 2026-05-28"로 고정.
- 디렉토리 구조 트리에도 두 에이전트 파일 없음.
- 조치: 팀 구성 표 8명으로 확장, 디렉토리 트리·상태 표 갱신.

**[C-2] (P1) 변경 이력에 v1.0.1~v1.0.4 / Phase A-B 누락**
- git log에는 v1.0.1~v1.0.4 릴리스가 있으나 CLAUDE.md 변경 이력 표는 2026-05-28에서 멈춤.
- 조치: v1.0.1~v1.0.4, Phase A-B 검증 완료 행 추가.

**[C-3] (P2) Phase A-B-C 정의 부재**
- 본 하네스 작업은 Phase A-B-C 용어를 쓰나 CLAUDE.md는 "프레임워크 개발 진도"의 Phase
  1-3(도메인 모듈 작업)만 정의 — 두 Phase 체계가 혼선.
- 조치: 하네스 검증 Phase(A=메인 워크플로우, B=추가 검증, C=다음 단계)를 별도 명시하고
  프레임워크 Phase 1-3과 구분.

### 4.4 워크플로우/다이어그램

**[W-1] (P2) Task 7→8 선택 분기 다이어그램 불명확**
- 전체 흐름도는 7→8 직렬로 그려졌으나 본문은 "Task 7 또는 Task 6 직후" 분기 허용.
- 조치: 다이어그램에 선택/분기(점선) 표기.

**[W-2] (P2) Phase 0 컨텍스트 확인 로직이 선언적 — 판별 기준 모호**
- SKILL.md Phase 0은 "초기/재실행/부분수정"을 분기하나, "부분 수정"으로 판별하는
  구체적 신호(어떤 입력이 어떤 단계만 재실행으로 매핑되는지)가 정의되지 않음.
- 조치: 명령어 키워드 → 실행 모드 매핑 표 추가
  (예: "검증해"→Task 4만, "{기능} 추가해"→전체, "{단계} 다시"→해당 단계만).

**[W-3] (P2) 재실행 시 이전 산출물 활용 방식 미정의**
- 현 규칙은 _workspace/ → _workspace_prev/ 백업뿐. 재실행 시 이전 산출물을 **참조하여
  증분 작업**하는지, 전량 재생성하는지 불명확. _workspace_prev/는 현재 미존재(재실행 이력 없음).
- 조치: 부분 수정 모드에서 변경되지 않은 단계 산출물은 _workspace/에서 재사용하고,
  영향 단계만 재생성하도록 명시. 백업은 전체 재실행 시에만 수행.

### 4.5 신규 산출물 (README)

**[R-1] (P2) 스킬 폴더에 README 부재**
- `coolhan-development-orchestrator/`에 SKILL.md만 존재. 8단계 구조·에이전트 8명·
  산출물 규칙을 한눈에 보여줄 README 없음.
- 조치: `README.md` 생성 — 8단계 표, 에이전트-Task 매핑, _workspace/ 산출물 규칙,
  명령어→실행모드 매핑을 요약 (SKILL.md는 상세, README는 개요 역할 분담).

### 4.6 검증 신뢰성 (E2E Tester 실측 기반) — 최우선

**[E-1] (P0) 검증 진입 사전조건 게이트 부재**
- Integration/E2E 둘 다 입력으로 URL·포트만 받고, "대상 앱 기동 여부 + 대상 식별 일치"를
  확인하지 않음. E2E Tester는 403/소스부재를 **스스로 발견하기 전까지** 진위 판단 불가였음.
- 조치: 두 에이전트 입력 프로토콜 맨 앞에 진입 게이트 추가 —
  (a) 헬스체크 200 응답, (b) 대상 식별 확인(빌드 해시/기대 라우트/스펙 일치),
  (c) 실패 시 즉시 BLOCKED 보고 후 중단(시뮬레이션 금지).

**[E-2] (P0) 리포트 템플릿 기본값이 전부 "PASS" — 검증 계열 4개 에이전트 공통 결함**
- E2E Tester 확증: e2e-tester.md 템플릿뿐 아니라 integration-validator.md도 동일 패턴이고,
  `06_deployment_log.json`은 evidence 없이 "30/30 PASS"를 출력. 즉 PASS-기본값 문제는
  e2e 단독이 아니라 **validator / qa-tester / integration-validator / e2e-tester
  4개 에이전트 공통**.
- "검증 안 해도 PASS 제출"을 구조적으로 유도. Phase A-B 전항목 PASS의 직접 원인.
- 조치: **4개 에이전트 전부**에 일괄 적용 — 기본값 **"NOT_RUN"**, 증거(스크린샷/응답바디/
  DB쿼리결과/로그) 없으면 PASS 금지, 리포트에 `evidence` 필드 필수화.

**[E-4] (P1) 자동화 도구 미지정 → 실재 MCP 도구로 명시**
- Phase 7/8/9(반응형/CSS/브라우저)가 "Chrome DevTools로 확인"이라 수동·재현 불가.
- 환경에 **Claude Preview MCP**(preview_start/screenshot/click/fill/console_logs/network),
  **Prisma MCP**(Prisma-Studio/migrate-status)가 실재.
- 조치: E2E는 Claude Preview로 렌더/상호작용/콘솔/네트워크 검증, DB 확인은 Prisma MCP로
  명시하여 자동·재현 가능하게.

**[E-5] (P1) 9단계 항목 부적합 — 재설계**
- Phase 1(소스 오타/문법/괄호짝): E2E 책임 아님 → 빌드·린트·타입체커(CI)로 위임, 항목 제거.
- Phase 2~5 예시 이커머스 고정(장바구니/주문/배송/할인/부가세): 도메인 종속 →
  스펙/기획서에서 시나리오 **동적 주입**(파라미터화).
- Phase 3(연산 정확성): 피드백 등 비연산 기능엔 N/A 허용(조건부 항목).

**[E-6] (P2) Integration ↔ E2E 책임 중복 해소**
- 중복: API 검증·데이터 흐름·기획서 체크·성능(응답시간)이 양쪽 동시 존재.
- 분할 권고: **Integration** = 서버/포트/DB/API 상태(headless, curl/Prisma).
  **E2E** = 브라우저 렌더링/UI 상호작용/반응형/접근성(Claude Preview).
  "DB 도달" 검증은 Integration 단일 소유, E2E는 "UI에 결과 표시"까지만.

---

## 5. 우선순위 요약

| P | 항목 | 영향 |
|---|------|------|
| **P0** | E-1 (진입 게이트), E-2 (PASS 기본값), I-1 (Token Efficiency Mode 완화·근본원인) | **검증 신뢰성 — 미검증을 PASS로 제출하는 구조적 결함** |
| **P1** | C-1, C-2 (CLAUDE.md 동기화), A-1·A-2·E-3·I-4 (핸드오프), S-1, E-4 (자동화 도구), E-5·I-3 (항목 동적화), I-2 (3-값 결과) | 문서 신뢰성·실행 정합성 |
| **P2** | A-3, A-4, S-2, S-3, C-3, W-1, W-2, W-3, R-1, E-6 (책임 분할), I-5 (형식 표준화) | 일관성·유지보수성·운영성 |
| **P3** | A-5, A-6 | 완성도·표준화 |

> **주의(확정):** Phase A-B "전항목 PASS"는 실구동·증거에 기반하지 않은 시뮬레이션
> 결과임 — Task 7·8 교차 확증(curl 전경로 403 vs 05번 10/10 PASS). E-1/E-2/I-1 적용 +
> 실제 앱 기반 증거 재검증 전까지 검증 결과를 신뢰의 근거로 삼지 말 것.

## 6. 일정 및 담당

| 항목 | 담당(제안) | 일정 |
|------|-----------|------|
| C-1, C-2, C-3 (CLAUDE.md) | Harness Architect | Phase C 즉시 |
| A-1, A-2 (핸드오프 재정의) | Harness Architect + 검증 에이전트 협의 | Phase C |
| S-1, S-2, W-1 (스킬) | Harness Architect | Phase C |
| A-3, A-4 (에이전트 정렬) | Harness Architect | Phase C |
| A-5, A-6, S-3 (P3) | 후속 | 권장 |

---

## 7. Phase C 정의 (다음 단계)

- **Phase A:** 메인 워크플로우(Task 1-6) 검증 — ✅ 완료
- **Phase B:** 추가 검증(Task 7-8) 실행 — 진행 중
- **Phase C:** 하네스 고도화 — 본 계획의 P1/P2 항목 적용 + 코드베이스 정리
  (`09_harness-cleanup-checklist.md` 참조)
