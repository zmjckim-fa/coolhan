# PROGRESS — 진행 원장 (이 저장소, §9 `knowledge_base/00_MINIMAL_SOURCE_PRINCIPLES.md`)

> 대화가 아니라 이 파일이 진실이다. 세션 시작·«이어서»·«계속»은 이 파일을 읽는 것으로 시작한다.
> 형식 검사: `node scripts/progress-check.js docs/PROGRESS.md` (C8). 고정 검증: `node scripts/checks-run.js`.

목표: 사용자가 지정한 표준 원칙을 쿨한 하네스의 기본 원칙으로 설치하고 기계 검사 가능한 부분을 게이트로 집행한다. 개발 원칙(최소 소스 · 단일 원천 S1–S8 · 진행 원장 · 고정 검증, G20)에 더해 2026-11-11 사용자 지시로 기획서 제작 표준(마스터 프롬프트, G21)을 포함한다. 같은 날 사용자 지시로 C:sites 전 프로젝트의 성공 방법과 실패 사례를 흡수해(현장 교훈, G22) 앞으로 만들 사이트에 적용하고 실패를 기계로 막는 일을 포함한다. 2026-11-17 사용자 지시로 운영자가 프로젝트마다 반복하던 명령을 상시 지시로 설치하고 모듈 저장소(00Module_site)를 기획의 필수 입력으로 쓰는 프로젝트 킷(G23)을 포함한다. 같은 날 사용자 지시로 상시 지시가 모든 세션과 모든 명령에 «쿨한으로»라는 말 없이 적용되게 하는 전역 설치(G24)를 포함한다. 2026-11-22 사용자 지시로 모듈 저장소(00Module_site)의 모듈을 더 잘 분리하고, 다른 프로젝트 폴더에서 고도화된 기능(문서 생성, 회원가입, 외부 API 연동, HS 코드 검색, 쇼핑몰, 관리자, 마이페이지, 디자인 스타일, 글로벌 우편번호)을 흡수하게 하는 일을 포함한다.

## 작업 목록

| 번호 | 이름 | 상태 | 완료 증거 | 남은 항목 |
|---|---|---|---|---|
| 1 | G20 게이트 3종 (progress-check · checks-run · single-source-check) + S8 `scripts/lib` + S2 `scripts/messages` | 완료 | jest 신규 29/29 (3 suites) | - |
| 2 | 원칙 KB 문서 + 에이전트·SKILL·SDLC 지도 배선 (developer · validator · self-auditor · spec-writer · Phase 0 · UNIT PREAMBLE) | 완료 | prompt-modernization-check clean 48 files | - |
| 3 | 이 저장소 자기 적용: `docs/CHECKS.md` · `docs/SINGLE_SOURCE_MAP.md` · 기준선 · 이 원장 | 완료 | single-source ratchet PASS {dup 3, sentences 95}; no-placeholder clean 36 files | - |
| 4 | 적대 검증 track36 (적합 PASS / 위반 FAIL 명명 / 원장 거짓 FAIL / 고정 목록 3수치 / 래칫 증가·감소 / 자기 실행) | 완료 | 시나리오 7/7 일치, 0 false +/- (`_harness_test/track36-minimal-source/run-log.txt`); 전체 jest 279/279 (31 suites) | - |
| 5 | 릴리스 v2.7.0 (CHANGELOG · CLAUDE.md 행 · HANDOFF · DECISIONS · 전체 jest · secret-scan · 커밋·태그·푸시 · CI 녹색) | 완료 | 커밋 3285544, 태그 v2.7.0 = releases/latest; CI Release·Test·Harness-check·Python API success (npm publish은 NPM_TOKEN 미설정으로 예상 실패); checks-run 통과 9 · 실패 0 · 확인 안 함 0 | - |
| 6 | G21 게이트 `scripts/plan-doc-check.js` + S8 `scripts/lib`(fs · md-table 확장) + S2 문구 키 + 시험 | 완료 | jest 신규 16/16 (plan-doc-check), single-source 시험 13/13; ratchet PASS {dup 3, sentences 95} | - |
| 7 | 기획서 제작 표준 KB `00_PLANNING_DOC_STANDARD.md` + 에이전트·SKILL·SDLC 지도 배선 (intent-analyzer · spec-writer · plan-reviewer 0단계 · ux-design-lead · Task 2.5 · 엔진 루프) | 완료 | prompt-modernization-check clean 48 files; 줄표 문자 0개 | - |
| 8 | 적대 검증 track37 (적합 PASS / 14개 규칙 위반 FAIL 명명 / 다중 파일 ID 충돌 / 빈 폴더 exit 2 / 펜스·허용 표지 PASS) | 완료 | 시나리오 7/7 일치, 0 false +/- (`_harness_test/track37-plan-doc/run-log.txt`) | - |
| 9 | 릴리스 v2.8.0 (CHANGELOG · CLAUDE.md 행 · HANDOFF · DECISIONS · 전체 jest · secret-scan · 커밋·태그·푸시 · CI 녹색) | 완료 | 커밋 bf1918d, 태그 v2.8.0 = releases/latest; CI Release·Test·Harness-check·Python API success (npm publish은 NPM_TOKEN 미설정으로 예상 실패); jest 297/297 (32 suites); checks-run 통과 9 · 실패 0 · 확인 안 함 0 | - |
| 10 | 전 프로젝트 분석 (분석 에이전트 8개, 읽기 전용, 증거 인용, 비공개 보관) | 완료 | 군별 파일 8/8 (각 coverage 줄 · WIN/FAIL 표), `.coolhan-private/site-lessons/` | - |
| 11 | 교훈 레지스트리(단일 원천) `knowledge_base/field-lessons.json` + 파생 KB 문서 | 완료 | validate PASS 교훈 64건; render --check exit 0 | - |
| 12 | 탐지 가능한 실패 패턴 게이트 + 시험 (+ 기존 게이트 강화: 빈 스캔 NOT_RUN · 번호 중복 · 범위 축소 · 자식 종료 코드 4) | 완료 | jest field-lessons 15/15; 강화 시험 포함 4개 스위트 51 passed | - |
| 13 | 기획 단계 집행: 기획서의 실패 방지 대응표 검사 (`plan-doc-check --lessons`) + `[결정필요]` 기본값 | 완료 | jest plan-doc-check 17/17 + 대응표 시험 4/4 | - |
| 14 | 현장 모듈 카탈로그(레지스트리의 modules, 같은 문서에 파생) + 에이전트 17개·SKILL·SDLC 지도 배선 | 완료 | prompt-modernization-check clean 48 files; 배선 17/17 | - |
| 15 | 적대 검증 track38 | 완료 | 시나리오 19/19 일치, 0 false +/- (`_harness_test/track38-field-lessons/run-log.txt`); 전체 jest 317/317 (33 suites) | - |
| 16 | 릴리스 v2.9.0 (문서 · 전체 jest · checks-run · 커밋·태그·푸시 · CI) | 완료 | 커밋 5c7ea8f, 태그 v2.9.0 = releases/latest; CI Release·Test·Harness-check·Python API success (npm publish은 NPM_TOKEN 미설정으로 예상 실패); jest 317/317 (33 suites); checks-run 통과 12 · 실패 0 · 확인 안 함 0 | - |
| 17 | 운영자 명령 채굴(비공개 저장소) + 상시 지시 레지스트리 `orders` O-01~O-18 + 파생 문서 | 완료 | validate PASS (지시 18건 포함); render --check exit 0 | - |
| 18 | 프로젝트 킷: `new-project.js` · 런처 · 템플릿 · `handoff-write.js` · `lib/template.js` + 훅 프로젝트 모드 | 완료 | jest project-kit 19/19; ask-run-guards · stop-guard 통과 | - |
| 19 | 모듈 저장소 연결: 모듈 계획표 기본값 + `plan-doc-check --modules` | 완료 | jest 모듈 계획 시험 3/3; 실제 저장소 대조 26/26 묶음 응답 | - |
| 20 | 에이전트 5개 · SKILL · SDLC 지도 배선 + 적대 검증 track39 | 완료 | prompt-modernization-check clean 48 files; 시나리오 25/25 일치, 0 false +/- (`_harness_test/track39-project-kit/run-log.txt`) | - |
| 21 | 릴리스 v2.10.0 (문서 · 전체 jest · checks-run · 커밋·태그·푸시 · CI) | 완료 | 커밋 c9448a5, 태그 v2.10.0 = releases/latest; CI Release·Test·Harness-check·Python API success (npm publish은 NPM_TOKEN 미설정으로 예상 실패); jest 337/337 (34 suites); checks-run 통과 12 · 실패 0 · 확인 안 함 0 | - |
| 22 | 전역 설치 `install-global.js` (관리 블록 · --check · --remove) + 이 기기에 적용 | 완료 | jest install-global 13/13; 이 기기 --check exit 0 | - |
| 23 | 킷 어긋남 검사 `new-project --check` + 본체·모듈 저장소 설치 거부 | 완료 | jest 3/3 (--check · 거부 · 훅 제거 감지) | - |
| 24 | 열린 결함 D-2, D-3, D-4, D-8 닫기 (공용 도우미 이행 13개 스크립트, 삼킨 오류 4건) | 완료 | single-source ratchet PASS (중복 도우미 3 → 0); field-lessons ratchet PASS (F-05 4 → 0); 두 기준선 갱신; jest 354/354 (36 suites) | - |
| 25 | 배선 + 적대 검증 track40 | 완료 | 시나리오 16/16 일치, 0 false +/- (`_harness_test/track40-global-orders/run-log.txt`); prompt-modernization-check clean 48 files | - |
| 26 | 릴리스 v2.11.0 (문서 · 전체 jest · checks-run · 커밋·태그·푸시 · CI) | 완료 | 커밋 898f265, 태그 v2.11.0 = releases/latest; CI Release·Test·Harness-check·Python API success (npm publish은 NPM_TOKEN 미설정으로 예상 실패); jest 354/354 (36 suites); checks-run 통과 13 · 실패 0 · 확인 안 함 0 | - |
| 27 | D-13 기기 쪽 원인 찾기 (측정 · 격리 재현) | 완료 | 실패 실행 4/4가 운영체제 메모리 부족 기록과 겹침; CPU 포화 6,960회 중 시작 못 함 0; 작업 개체 재현 120/120 판정 (`_harness_test/track41-machine-headroom/run-log.txt`) | - |
| 28 | 기기 여유 탐침 `resource-check.js` + `memoryDenied` + checks-run · nonstop 연결 + 교훈 F-41 | 완료 | jest resource-check 13/13, nonstop 13/13; 시나리오 11/11 일치, 0 false +/-; field-lessons validate PASS 65건 | - |
| 29 | 릴리스 v2.11.1 (문서 · 전체 jest · checks-run · 커밋·태그·푸시 · CI) | 완료 | 커밋 7882e1f, 태그 v2.11.1 = releases/latest; CI Release·Test·Harness-check·Python API success (npm publish은 NPM_TOKEN 미설정으로 예상 실패); jest 370/370 (37 suites); checks-run 통과 13 · 실패 0 · 확인 안 함 0 | - |
| 30 | 킷 실증 track42: 실제 작은 사이트를 킷으로 기획서부터 끝까지 만들고, 만난 킷 결함을 본체에서 고친다 | 완료 | 사이트 단위 13/13; node --test 191/191, 건너뜀 0; 사이트 자동 검증 10/10 통과; 킷 결함 9건 수정과 시험 (`_harness_test/track42-kit-e2e/track42-report.md`) | - |
| 31 | 모듈 저장소 분리 점검과 프로젝트 폴더의 앞선 기능 조사 (읽기 전용, 보고서는 비공개 폴더) + 추출 대기열 | 완료 | 조사 보고 6/6 (저장소 점검, 문서·연동·HS·우편번호, 가입·관리자·쇼핑몰, 디자인, 관리자·정산·구매대행, 픽업); 대기열 26줄; 원천 지정 4건 기록 | - |
| 32 | 모듈 표준과 흡수 장치: 형식 검사, 설치·상태·갱신, 원천 앞섬 감지, 이전 형식 변환, 전역 지시 O-19 | 완료 | jest module-standard 45/45; 시나리오 15/15 일치, 0 false +/- (`_harness_test/track43-module-standard/run-log.txt`); 실제 저장소: 변환 68/68, 형식 검사 PASS, 모듈 시험 332개 통과, 원천 앞섬 109곳(모듈 44개) | - |
| 33 | 모듈 추출 1차 (운영자가 원천을 지정한 것과 회원): 관리자, 운송사, 회원, 우편번호를 표준 형식 모듈로 | 완료 | 새 모듈 13/13 형식 검사 PASS (관리자 6, 운송사 2, 회원 4, 우편번호 1); 모듈 시험 416/416, 건너뜀 0; 빈 폴더 설치와 상태 확인 13/13 종료 코드 0; 저장소 전체 비밀값 스캔 611개 파일 PASS; 저장소 커밋 b314c9c, 17bfb31, 2181fbd, 8788d55, 1ed86da, a44fff3 | - |
| 34 | 릴리스 v2.12.0 (문서 · 전체 jest · checks-run · 커밋·태그·푸시 · CI) | 완료 | jest 421/421, 38 suites; checks-run 통과 13 · 실패 0; 커밋 a67dd8a, 태그 v2.12.0; CI 3/3 success(integrity, test, release), releases/latest = v2.12.0. npm 게시는 토큰이 없어 실패(가정 A-38) | - |
| 35 | 모듈 추출 2차: 관리자 틀·알림·계정·접근 기록, 배송 추적·픽업 예약·운송사 충전 원장 | 진행 중 | | 모듈 7개의 형식 검사 · 시험 · 빈 폴더 설치 · 저장소 커밋 |

## 현재 위치
35번 모듈 추출 2차(관리자 틀·알림·계정·접근 기록, 배송 추적·픽업 예약·충전 원장). 이 단위가 목표에 속하는가: 예, 2026-11-22 지시의 대기열 3번과 7번이다.

## 가정 목록

| 번호 | 가정 (묻지 않고 고른 기본값) | 이유 |
|---|---|---|
| A-1 | 붙여넣은 원칙은 «이 저장소에서 개발하라»는 템플릿이지만 작업 줄이 비어 있으므로, G19 때와 같이 «원칙을 쿨한의 기본 원칙으로 설치(KB + 게이트 + 배선)»로 해석했다 | 사용자의 반복 패턴(원칙 붙여넣기 → 하네스 설치); 되돌릴 수 있고 아무것도 지우지 않음 |
| A-2 | `docs/PROGRESS.md`는 이 저장소 자체 개발의 원장이고, 엔진 런의 `_workspace/_backlog.md`(G8 completion-check)는 그대로 둔다 — 두 체계를 합치지 않았다 | 엔진·훅(G11)이 `_backlog.md`를 읽는다; 합치면 동작 변경 → 범위 밖 |
| A-3 | 동작 불변 스냅샷(§4-c, 라우트·응답·화면 바이트)은 도구로 만들지 않았다 — 이 저장소는 서버가 아니라 CLI·문서이고 «시험 전부» = C1 jest가 그 역할 | 쓰임이 없는 도구는 투기적 일반화; 필요한 프로젝트에서 첫 사용 때 추가 |
| A-4 | S2 문구 사전은 새 스크립트 3종에만 적용하고 기존 27개 스크립트의 인라인 문구 95건은 기준선으로 고정(증가 금지) | §4-d «새 코드부터, 기존은 손대는 파일만» |
| A-5 | 다른 세션이 남긴 미커밋 변경(`_workspace/_backlog.md`, `docs/DECISIONS.md`의 00Module_site 항목, `_workspace/_stop-guard-count.json`)은 건드리지 않고, 내 변경 파일만 스테이징한다. `docs/DECISIONS.md`는 같은 파일에 내 항목을 덧붙이므로 그 세션의 3줄이 함께 커밋된다 | §12 고치는 김에 다른 것을 바꾸지 않는다; 같은 저장소의 결정 기록이라 해롭지 않음 |
| A-6 | 사용자의 «적용하라»(마스터 프롬프트 파일 경로 지정)는 G19, G20과 같이 «쿨한의 기본 표준으로 설치: KB + 게이트 + 에이전트 배선»으로 해석했다. 원본 프롬프트는 음악 서비스에 묶인 부분(악기색, Suno, Cubase, 편곡자 폴더)을 `{{ }}` 슬롯으로 일반화하고 원문을 예시로 남겼다 | 되돌릴 수 있고 아무것도 지우지 않음; 원본 파일은 읽기만 했다 |
| A-7 | 목표 줄은 사용자가 바꾼다는 원칙(§9)에 따라, 사용자의 2026-11-11 명령을 근거로 목표 줄에 기획서 표준을 덧붙였다 | 사용자 명령이 있는 변경이라 §9 위반 아님; 기존 문구는 그대로 두고 덧붙임 |
| A-8 | 마스터 §2-4(일반 파일명 `services` 금지)와 G19(`services/ai`)의 충돌은 문서화된 예외로 처리: 프로젝트가 §2-4를 채택하면 `ai-arch-check --service-dirs`로 계층 이름만 바꾼다 | 계층 규칙은 유지하고 이름만 프로젝트가 정한다; 게이트 로직 변경 없음 |
| A-9 | 마스터 §8의 6줄 보고는 쿨한 전역 규칙의 5줄 상한에 따른다 | CLAUDE.md 규칙 3, 9가 우선 |
| A-10 | 사용자가 가리킨 파일(MASTER_PROMPT.md) 외에 `C:\sites\MUSIC_APP` 의 다른 문서에는 게이트를 돌리지 않았다 | 세션 격리 규칙; 검증은 자체 fixture로 |
| A-11 | 이 저장소는 공개 원격이므로 교훈은 일반화해 저장하고(프로젝트 이름 대신 P-번호, 고객·금액·인명 없음), 프로젝트별 증거 파일은 git 무시 폴더 `.coolhan-private/site-lessons/`에 둔다 | G18 때와 같은 결정; 다른 사업의 사고 내역을 공개하지 않는다 |
| A-12 | «각 에이전트를 이용하여 분석»은 분석 하위 에이전트 병렬 실행으로 수행했다(8개, 프로젝트 군별 1개, 읽기 전용) | 사용자가 에이전트 사용을 지시; 다른 프로젝트 폴더는 읽기만 |
| A-13 | 다른 프로젝트의 소스·모듈 명세 본문은 복사하지 않고, 카탈로그(이름·목적·성숙도·위치)만 만든다 | 범위 밖(다른 저장소 수정·복사 금지), 최소 소스 |
| A-14 | 범위 경계에 «G1–G21 판정 논리는 입력 추가 외에 바꾸지 않는다»고 적었으나, 교훈이 직접 요구한 강화 네 가지(빈 스캔 NOT_RUN, 번호 중복, 스캔 범위 축소, `[결정필요]` 기본값)는 수행했다 | 운영자 지시의 핵심이 «실패를 따라 하지 않는 방지 구현»; 각각 독립이고 되돌릴 수 있음; DECISIONS 2026-11-11 에 기록 |
| A-15 | 모듈 카탈로그는 별도 문서가 아니라 교훈 레지스트리의 `modules` 로 두고 같은 문서에 파생했다 | 최소 소스·단일 원천: 원천 하나, 생성 문서 하나 |
| A-16 | 교훈의 «관측» 수는 프로젝트 군(8개) 단위로 셌다 | 한 군 안의 복제 폴더·작업 트리를 따로 세면 부풀려진다 |
| A-17 | 운영자의 두 메시지(«매번 비슷한 명령을 한다», «00module 폴더의 모듈을 이용하자»)를 «반복 명령을 프로젝트 폴더가 처음부터 갖게 하고 모듈 저장소를 기획의 필수 입력으로 만든다»로 해석했다 | 구체 작업 줄이 없었다; G19~G22와 같은 «레지스트리 + 게이트 + 배선» 해석 |
| A-18 | 배포는 반복 빈도 2위지만 킷의 기본값은 `deploy: none`이고 프로젝트 설정으로만 `after-complete`가 된다 | 전역 규칙 «개발을 모두 마치기 전에는 배포하지 않는다»; 비용과 되돌리기 어려움 |
| A-19 | 단위 커밋은 묻지 않고 한다(경로 지정). push는 상시 지시에 넣지 않았다 | 커밋은 되돌릴 수 있고 push는 밖으로 나간다 |
| A-20 | 모듈 저장소는 읽기만 하고 킷은 묶음 표만 읽는다. 태그별 묶음 기본값(`bundle-tags.json`)은 초안이고 기획에서 바꾼다 | 저장소 폴더는 읽기 전용(운영자 전역 규칙); 기본값의 적중률은 아직 재지 않았다 |
| A-21 | 킷은 게이트와 훅을 복사하지 않고 런처가 본체에서 실행한다. 기기 종속 값은 `home` 하나다 | 최소 소스: 복사본은 어긋난다 |
| A-22 | 프로젝트 모드의 루프 무장은 이어가기 낱말에만 걸린다. 일회성 지시와 질문에는 걸리지 않는다 | 한 번 시킨 일이 백로그 전체를 돌리면 안 된다 |
| A-23 | 명령 통계의 원자료와 프로젝트 이름은 비공개 폴더에만 두고, 레지스트리에는 수치와 일반화한 문장만 둔다 | 공개 원격 (A-11과 같은 결정) |
| A-24 | 운영자의 «모든 명령에 쿨한의 기술력과 룰이 적용되어야 한다»를 근거로 이 기기의 사용자 지시 파일에 관리 블록을 바로 설치했다. 이전 파일은 옆에 보관했고 `--remove`로 되돌린다 | 운영자 지시가 있는 변경; 블록 하나, 되돌릴 수 있음 |
| A-25 | 전역에는 설정과 훅을 넣지 않았다. 루프 훅은 프로젝트별 설치 그대로다 | 모든 세션의 정지를 막는 훅은 개발이 아닌 세션까지 영향을 준다 |
| A-26 | 전역 블록에는 지시 18건 전부를 넣었다. 폴더의 `CLAUDE.md`에 같은 번호가 있으면 폴더 것이 우선한다 | 전역에는 프로젝트 태그가 없다 |
| A-27 | «이어서 진행하라»는 원장의 다음 단위(열린 결함 닫기)로 해석했고, 도중에 온 운영자 질문(전역 적용)을 같은 릴리스에 넣었다 | 원장 «현재 위치»가 열린 결함을 다음 단위로 적어 두었다 |
| A-28 | «이어서 진행하라»는 원장이 적어 둔 다음 단위 중 D-13의 기기 쪽 원인 찾기로 해석했다 | 나머지 셋은 다른 폴더나 운영자의 지시가 있어야 시작할 수 있다 |
| A-29 | 메모리 여유 기준은 1,024MB, 감독 프로세스의 대기는 60초씩 최대 10번이고 그 뒤에는 띄운다 | 잰 자식 크기 약 48MB의 20개분. 무중단이 목표라 대기 뒤에는 멈추지 않는다 |
| A-30 | 기기가 메모리를 주지 않는 순간에는 대화형 세션의 훅이 시작되지 못하고 그 순간의 정지 차단은 없다. 하네스 밖의 한계로 둔다 | 훅 프로세스가 시작되지 않으면 하네스 코드는 한 줄도 실행되지 않는다 |
| A-31 | 기기 전체의 메모리를 바닥내는 실험은 하지 않고 작업 개체 안에서만 재현했다 | 같은 기기의 다른 프로세스가 죽을 수 있다 |
| A-32 | «목표를 성공시켜라»는 원장이 남겨 둔 미측정 항목(킷으로 실제 사이트를 끝까지)으로 해석했다. 실증 사이트는 지어낸 빵집이고 이 저장소의 트랙 폴더 안에 둔다 | 다른 프로젝트 폴더를 건드리지 않고 킷의 모든 게이트를 실제로 지나가 보는 가장 작은 방법이다 |
| A-33 | 다른 폴더의 새 세션이 전역 지시를 지키는지는 관측하지 못했다. 헤드리스 클라이언트가 로그인되어 있지 않다 | 로그인은 운영자만 할 수 있다(자격 증명) |
| A-34 | 모듈 저장소에는 새 폴더 `modules/`만 더하고 그 경로만 커밋한다. 이전 형식과 다른 세션의 미커밋 변경은 건드리지 않는다. 다른 프로젝트 폴더는 읽기만 한다 | 운영자가 «모든 세션이 갖다 쓸 수 있어야 한다»고 했고, 새 폴더를 더하는 것은 기존 파일을 바꾸지 않는다 |
| A-35 | 추출 순서는 운영자가 원천을 지정한 것(관리자, 픽업, 정산, 구매대행)이 먼저, 그다음 회원, 그다음 나머지다. 대기열과 원천 이름은 비공개 폴더에 둔다 | 운영자의 말 순서와 «반복을 없애는 것이 목표»라는 말. 공개 원격에 프로젝트 이름을 늘리지 않는다 |
| A-36 | 원천 프로젝트에서 찾은 오류는 모듈에서만 고치고 원천 파일은 고치지 않는다. 목록은 비공개 폴더의 결함 목록에 둔다 | 그 폴더에서 다른 세션이 일한다(교훈 F-09) |
| A-37 | 30번(킷 실증)의 범위는 킷을 실제 사이트로 끝까지 지나가 보고 킷 결함을 고치는 것이다. 실증 사이트의 사람이 봐야 하는 접근성 28행은 그 사이트 원장의 열린 항목으로 두고 이 단위의 완료 조건에 넣지 않았다 | 화면 낭독기와 실제 기기 확인은 사람만 할 수 있다. 사이트의 고정 검증은 그 행들을 «확인 안 함»으로 계속 보여 준다 |
| A-38 | 릴리스의 npm 게시 실패는 릴리스를 막지 않는다 | 게시 토큰이 저장소 비밀값에 없다. 게시할지와 토큰 발급은 운영자가 정한다(HANDOFF §6) |
| A-39 | 우편번호 모듈의 조회처 8곳은 이용 조건을 확인하지 않은 채 모듈에 넣었다. 시험은 가짜 조회처만 쓴다 | 조건 확인과 상용 사용 결정은 운영자 몫이다. 모듈의 `docs/data-sources.md`에 목록이 있다 |
| A-40 | 회원 모듈의 나라별 주소 표 61줄과 우편번호 형식 일부는 출처가 없는 원천 값을 그대로 옮기고 «검증 안 됨»으로 표시했다 | 원천에 출처가 없다. 공식 자료와 대조하는 일은 대기열에 남긴다 |
| A-41 | 회원 모듈은 SQLite로만 실행했다. PostgreSQL에서의 실행과 추가 전용 트리거는 재지 않았다 | 이 기기에 PostgreSQL 실행 환경을 만들지 않았다. 그 DB를 쓰는 첫 프로젝트에서 잰다 |

## 결함 목록

| D-번호 | 발견한 검사 | 파일:줄 | 증상 | 상태 |
|---|---|---|---|---|
| D-1 | C3 | scripts/no-placeholder-check.js:6 | 플레이스홀더 검사가 `scripts` 디렉터리를 훑을 때 자기 자신의 패턴 표(TODO/FIXME 글자)를 결함으로 보고 → 고정 목록 C3를 `scripts` 전체로 돌릴 수 없었음. 자기 파일 제외 1줄로 수정, no-placeholder-check 시험 6/6 | 닫힘 |
| D-2 | C7 | scripts/agent-loop.js:106 외 7파일 | 같은 본문의 `get` 인자 도우미가 8개 스크립트에 복제됨 (S8 부재). `scripts/lib/cli.js` 신설; 기존 파일은 손대는 날 이행(§4-d), 기준선에 기록  2026-11-17: 8개 스크립트가 `lib/cli.js`의 `argValue`를 부르게 이행. | 닫힘 |
| D-3 | C7 | scripts/context-check.js:58, gates.js:137, ledger.js:74 | 같은 본문의 `parseFlags` 3곳 복제 — D-2와 같은 처방  2026-11-17: `parseFlags`를 `lib/cli.js`로 옮김. | 닫힘 |
| D-4 | C7 | scripts/ai-arch-check.js:73, self-growth.js:38 | 같은 본문의 `readText` 2곳 복제 — `lib/fs.js` 신설 시 이행  2026-11-17: `readText`를 `lib/fs.js`로 옮김(같은 일을 하던 세 번째 사본 포함). | 닫힘 |
| D-5 | C8 | scripts/progress-check.js:38 | 완료 증거 칸에 적은 checks-run 3수치 «확인 안 함 0»을 헤지(«확인 안 함»)로 오인 → 정직한 보고가 FAIL. «확인 안 함 0»만 제외하도록 1곳 수정, 시험 1건 추가(progress-check 11/11) | 닫힘 |
| D-6 | C7 | docs/furniture-research/ · docs/cafe24-product-structure/ | 다른 세션이 커밋한 연구 산출물 스크립트(docs/ 아래 JS·PY)가 단일 원천 래칫에 잡혀 hardcoded-sentence 95 → 2895, 중복 도우미 5쌍 증가로 C7 FAIL. 이것은 하네스 소스가 아니므로 게이트에 `--skip-dirs` 옵션을 추가하고 C7 명령을 `--skip-dirs docs`로 바꿨다. 기본 동작은 그대로, 시험 1건 추가(single-source 13/13) | 닫힘 |
| D-7 | C7 | scripts/plan-doc-check.js:62 외 2곳 | 새 게이트의 §4.2 항목 이름(범위 밖, 도메인 품질 관리 등)이 코드에 사람 언어 문자열로 들어가 래칫 95 → 98. 14개 라벨을 `scripts/messages` 키로 옮김. 같은 점검에서 게이트 메시지가 금지한 줄표를 스스로 쓰고 있던 것도 수정 | 닫힘 |
| D-8 | C12 | scripts/check-update.js:42 외 3곳 | 업데이트 확인 스크립트가 오류를 빈 catch 로 삼킨다(교훈 F-05 서명 4건). 기준선 `docs/FIELD_LESSONS_BASELINE.json` 에 기록, 손대는 날 실패 사유를 출력하도록 고친다  2026-11-17: 네 곳 모두 사유를 출력, 기준선 0. | 닫힘 |
| D-10 | C1 | scripts/field-lessons.js:109 | `list --owner <에이전트>` 가 태그를 주지 않으면 `all` 태그 교훈만 돌려줘, 교훈이 `deploy` 로 태그된 역할은 자기 목록을 거의 못 봤다(적대 검증 보고서를 쓰다 발견). 태그를 주지 않으면 거르지 않도록 수정하고 시험 단언 3줄 추가; 검사(check)와 기획서 의무는 종전대로 태그 기준 | 닫힘 |
| D-9 | C1 | scripts/plan-doc-check.js:66 | 셸 heredoc 으로 만든 패치가 정규식의 역슬래시를 먹어 게이트가 로드되지 않았다(교훈 F-33 을 작업 중에 재현). 파일 쓰기로 다시 만들어 수정, plan-doc-check 시험 통과 | 닫힘 |
| D-11 | C1 | .claude/hooks/run-armer.js:STRONG_RUN | 프로젝트 모드 무장 정규식이 «진행하라» 단독에도 걸려 일회성 지시(«이 버튼 색을 바꾸는 작업을 진행하라»)가 백로그 전체를 돌리게 됐다(시험을 쓰다 발견). 이어가기 낱말로 좁히고 시험에 그 문장을 넣었다 | 닫힘 |
| D-12 | C1 | knowledge_base/field-lessons.json (O-06) | 상시 지시가 가리킨 모듈 계획표 경로와 킷이 실제로 쓰는 경로(`docs/plan/MODULE_PLAN.md`)가 달랐다. 레지스트리를 고치고 문서를 다시 파생했다 | 닫힘 |
| D-13 | C1 | src/__tests__/ask-run-guards.test.js:52, project-kit.test.js:171 | 전체 시험이 두 번, 훅을 띄우는 시험에서 빈 출력으로 실패했다. CPU 포화 상태에서 잰 값: 한 번의 실행에서 1,200회 중 spawn 오류 37건과 시작 직후 죽은 자식 4건, 이어진 5,700회에서는 0건. 자식 프로세스가 시작되지 못한 것이고 훅 코드는 실행되지 않았다. `scripts/lib/spawn-node.js`의 `runNode`가 그 경우(spawn 오류, 종료 코드 없음, 출력이 전혀 없는 0 아닌 종료)만 최대 2회 다시 띄우고 매번 stderr에 적는다. 훅 시험 4곳이 이것을 쓴다. 원인(v2.11.1): 기기의 가상 메모리(커밋) 부족. 실패 실행 4/4가 운영체제의 메모리 부족 기록과 겹쳤고, 작업 개체 안에서 여유 약 48MB 아래로 재현했다(`_harness_test/track41-machine-headroom`). `memoryDenied`가 그 형태를 알아보고 `resource-check.js`가 여유를 잰다 | 닫힘 |
| D-14 | C1 | node_modules/jest/bin/jest.js | 전체 시험 한 번이 요약 줄 없이 종료 코드 127로 끝났다(2026-11-17 13:26, 출력 20줄). 직전과 직후의 메모리 여유는 PASS(6,299MB, 6,586MB)였고 운영체제의 메모리 부족 기록과 프로그램 오류 기록은 없었다. 바로 다시 돌린 실행은 370/370으로 통과했다. 원인은 모른다. 다시 나오면 종료 상태 전체(16진)와 마지막 출력, 기기 상태를 남긴다 좁힘(2026-11-22) [관찰]: 밖에서 강제 종료한 자식 프로세스는 이 셸에서 종료 코드 127로 보인다(내가 Stop-Process로 끝낸 서버가 127이었다). [추론]: 그 실행도 스스로 죽은 것이 아니라 밖에서 종료된 것이다. 누가 종료했는지는 모른다 | 열림 |
| D-15 | track42 | scripts/plan-doc-check.js, scripts/nonstop.js, scripts/field-lessons.js, scripts/parallel-plan.js, scripts/completion-check.js, knowledge_base/project-kit/coolhan.js | 킷으로 실제 사이트를 만들며 만난 본체 결함 7건(K-1, K-2, K-3, K-6, K-8, K-9, K-11: 기획 게이트가 산출물 없이 통과, 감독 프로세스가 미로그인을 알리지 못함, 프로젝트 폴더에서 교훈 도구 실패, 원장 틀에 통합 검토 없음, 모듈형 프로젝트에서 런처 실패, 병렬 계획이 고치는 파일을 보지 않음, 완료 게이트가 U-01 형식을 읽지 못함). 모두 고치고 시험을 붙였다(커밋 cce2fc7, 553f44d). 목록은 `_harness_test/track42-kit-e2e/findings.md` | 닫힘 |
