# PROGRESS — 진행 원장 (이 저장소, §9 `knowledge_base/00_MINIMAL_SOURCE_PRINCIPLES.md`)

> 대화가 아니라 이 파일이 진실이다. 세션 시작·«이어서»·«계속»은 이 파일을 읽는 것으로 시작한다.
> 형식 검사: `node scripts/progress-check.js docs/PROGRESS.md` (C8). 고정 검증: `node scripts/checks-run.js`.

목표: 사용자가 지정한 표준 원칙을 쿨한 하네스의 기본 원칙으로 설치하고 기계 검사 가능한 부분을 게이트로 집행한다. 개발 원칙(최소 소스 · 단일 원천 S1–S8 · 진행 원장 · 고정 검증, G20)에 더해 2026-11-11 사용자 지시로 기획서 제작 표준(마스터 프롬프트, G21)을 포함한다. 같은 날 사용자 지시로 C:sites 전 프로젝트의 성공 방법과 실패 사례를 흡수해(현장 교훈, G22) 앞으로 만들 사이트에 적용하고 실패를 기계로 막는 일을 포함한다.

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

## 현재 위치
16번 완료 — 목표의 작업 16개 모두 완료. 다음 단위는 사용자가 목표 줄을 바꾸거나 열린 결함(D-2~D-4, D-8)을 지정할 때, 또는 새 프로젝트·사고의 교훈을 레지스트리에 더할 때 시작한다.

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

## 결함 목록

| D-번호 | 발견한 검사 | 파일:줄 | 증상 | 상태 |
|---|---|---|---|---|
| D-1 | C3 | scripts/no-placeholder-check.js:6 | 플레이스홀더 검사가 `scripts` 디렉터리를 훑을 때 자기 자신의 패턴 표(TODO/FIXME 글자)를 결함으로 보고 → 고정 목록 C3를 `scripts` 전체로 돌릴 수 없었음. 자기 파일 제외 1줄로 수정, no-placeholder-check 시험 6/6 | 닫힘 |
| D-2 | C7 | scripts/agent-loop.js:106 외 7파일 | 같은 본문의 `get` 인자 도우미가 8개 스크립트에 복제됨 (S8 부재). `scripts/lib/cli.js` 신설; 기존 파일은 손대는 날 이행(§4-d), 기준선에 기록 | 열림 |
| D-3 | C7 | scripts/context-check.js:58, gates.js:137, ledger.js:74 | 같은 본문의 `parseFlags` 3곳 복제 — D-2와 같은 처방 | 열림 |
| D-4 | C7 | scripts/ai-arch-check.js:73, self-growth.js:38 | 같은 본문의 `readText` 2곳 복제 — `lib/fs.js` 신설 시 이행 | 열림 |
| D-5 | C8 | scripts/progress-check.js:38 | 완료 증거 칸에 적은 checks-run 3수치 «확인 안 함 0»을 헤지(«확인 안 함»)로 오인 → 정직한 보고가 FAIL. «확인 안 함 0»만 제외하도록 1곳 수정, 시험 1건 추가(progress-check 11/11) | 닫힘 |
| D-6 | C7 | docs/furniture-research/ · docs/cafe24-product-structure/ | 다른 세션이 커밋한 연구 산출물 스크립트(docs/ 아래 JS·PY)가 단일 원천 래칫에 잡혀 hardcoded-sentence 95 → 2895, 중복 도우미 5쌍 증가로 C7 FAIL. 이것은 하네스 소스가 아니므로 게이트에 `--skip-dirs` 옵션을 추가하고 C7 명령을 `--skip-dirs docs`로 바꿨다. 기본 동작은 그대로, 시험 1건 추가(single-source 13/13) | 닫힘 |
| D-7 | C7 | scripts/plan-doc-check.js:62 외 2곳 | 새 게이트의 §4.2 항목 이름(범위 밖, 도메인 품질 관리 등)이 코드에 사람 언어 문자열로 들어가 래칫 95 → 98. 14개 라벨을 `scripts/messages` 키로 옮김. 같은 점검에서 게이트 메시지가 금지한 줄표를 스스로 쓰고 있던 것도 수정 | 닫힘 |
| D-8 | C12 | scripts/check-update.js:42 외 3곳 | 업데이트 확인 스크립트가 오류를 빈 catch 로 삼킨다(교훈 F-05 서명 4건). 기준선 `docs/FIELD_LESSONS_BASELINE.json` 에 기록, 손대는 날 실패 사유를 출력하도록 고친다 | 열림 |
| D-10 | C1 | scripts/field-lessons.js:109 | `list --owner <에이전트>` 가 태그를 주지 않으면 `all` 태그 교훈만 돌려줘, 교훈이 `deploy` 로 태그된 역할은 자기 목록을 거의 못 봤다(적대 검증 보고서를 쓰다 발견). 태그를 주지 않으면 거르지 않도록 수정하고 시험 단언 3줄 추가; 검사(check)와 기획서 의무는 종전대로 태그 기준 | 닫힘 |
| D-9 | C1 | scripts/plan-doc-check.js:66 | 셸 heredoc 으로 만든 패치가 정규식의 역슬래시를 먹어 게이트가 로드되지 않았다(교훈 F-33 을 작업 중에 재현). 파일 쓰기로 다시 만들어 수정, plan-doc-check 시험 통과 | 닫힘 |
