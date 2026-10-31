# PROGRESS — 진행 원장 (이 저장소, §9 `knowledge_base/00_MINIMAL_SOURCE_PRINCIPLES.md`)

> 대화가 아니라 이 파일이 진실이다. 세션 시작·«이어서»·«계속»은 이 파일을 읽는 것으로 시작한다.
> 형식 검사: `node scripts/progress-check.js docs/PROGRESS.md` (C8). 고정 검증: `node scripts/checks-run.js`.

목표: 사용자가 지정한 표준 개발 원칙(최소 소스 · 단일 원천 S1–S8 · 진행 원장 · 고정 검증)을 쿨한 하네스의 기본 원칙으로 설치하고, 기계 검사 가능한 부분을 게이트(G20)로 집행한다.

## 작업 목록

| 번호 | 이름 | 상태 | 완료 증거 | 남은 항목 |
|---|---|---|---|---|
| 1 | G20 게이트 3종 (progress-check · checks-run · single-source-check) + S8 `scripts/lib` + S2 `scripts/messages` | 완료 | jest 신규 29/29 (3 suites) | - |
| 2 | 원칙 KB 문서 + 에이전트·SKILL·SDLC 지도 배선 (developer · validator · self-auditor · spec-writer · Phase 0 · UNIT PREAMBLE) | 완료 | prompt-modernization-check clean 48 files | - |
| 3 | 이 저장소 자기 적용: `docs/CHECKS.md` · `docs/SINGLE_SOURCE_MAP.md` · 기준선 · 이 원장 | 완료 | single-source ratchet PASS {dup 3, sentences 95}; no-placeholder clean 36 files | - |
| 4 | 적대 검증 track36 (적합 PASS / 위반 FAIL 명명 / 원장 거짓 FAIL / 고정 목록 3수치 / 래칫 증가·감소 / 자기 실행) | 완료 | 시나리오 7/7 일치, 0 false +/- (`_harness_test/track36-minimal-source/run-log.txt`); 전체 jest 279/279 (31 suites) | - |
| 5 | 릴리스 v2.7.0 (CHANGELOG · CLAUDE.md 행 · HANDOFF · DECISIONS · 전체 jest · secret-scan · 커밋·태그·푸시 · CI 녹색) | 진행 중 | | 커밋·태그·푸시 · CI 녹색 확인 · 이 행 갱신 |

## 현재 위치
5번 — 문서 갱신 끝, 커밋·태그·푸시 → CI 확인 단계. (이 단위가 목표에 속하는가: 예 — 설치의 배포가 목표의 마지막 조건.)

## 가정 목록

| 번호 | 가정 (묻지 않고 고른 기본값) | 이유 |
|---|---|---|
| A-1 | 붙여넣은 원칙은 «이 저장소에서 개발하라»는 템플릿이지만 작업 줄이 비어 있으므로, G19 때와 같이 «원칙을 쿨한의 기본 원칙으로 설치(KB + 게이트 + 배선)»로 해석했다 | 사용자의 반복 패턴(원칙 붙여넣기 → 하네스 설치); 되돌릴 수 있고 아무것도 지우지 않음 |
| A-2 | `docs/PROGRESS.md`는 이 저장소 자체 개발의 원장이고, 엔진 런의 `_workspace/_backlog.md`(G8 completion-check)는 그대로 둔다 — 두 체계를 합치지 않았다 | 엔진·훅(G11)이 `_backlog.md`를 읽는다; 합치면 동작 변경 → 범위 밖 |
| A-3 | 동작 불변 스냅샷(§4-c, 라우트·응답·화면 바이트)은 도구로 만들지 않았다 — 이 저장소는 서버가 아니라 CLI·문서이고 «시험 전부» = C1 jest가 그 역할 | 쓰임이 없는 도구는 투기적 일반화; 필요한 프로젝트에서 첫 사용 때 추가 |
| A-4 | S2 문구 사전은 새 스크립트 3종에만 적용하고 기존 27개 스크립트의 인라인 문구 95건은 기준선으로 고정(증가 금지) | §4-d «새 코드부터, 기존은 손대는 파일만» |
| A-5 | 다른 세션이 남긴 미커밋 변경(`_workspace/_backlog.md`, `docs/DECISIONS.md`의 00Module_site 항목, `_workspace/_stop-guard-count.json`)은 건드리지 않고, 내 변경 파일만 스테이징한다. `docs/DECISIONS.md`는 같은 파일에 내 항목을 덧붙이므로 그 세션의 3줄이 함께 커밋된다 | §12 고치는 김에 다른 것을 바꾸지 않는다; 같은 저장소의 결정 기록이라 해롭지 않음 |

## 결함 목록

| D-번호 | 발견한 검사 | 파일:줄 | 증상 | 상태 |
|---|---|---|---|---|
| D-1 | C3 | scripts/no-placeholder-check.js:6 | 플레이스홀더 검사가 `scripts` 디렉터리를 훑을 때 자기 자신의 패턴 표(TODO/FIXME 글자)를 결함으로 보고 → 고정 목록 C3를 `scripts` 전체로 돌릴 수 없었음. 자기 파일 제외 1줄로 수정, no-placeholder-check 시험 6/6 | 닫힘 |
| D-2 | C7 | scripts/agent-loop.js:106 외 7파일 | 같은 본문의 `get` 인자 도우미가 8개 스크립트에 복제됨 (S8 부재). `scripts/lib/cli.js` 신설; 기존 파일은 손대는 날 이행(§4-d), 기준선에 기록 | 열림 |
| D-3 | C7 | scripts/context-check.js:58, gates.js:137, ledger.js:74 | 같은 본문의 `parseFlags` 3곳 복제 — D-2와 같은 처방 | 열림 |
| D-4 | C7 | scripts/ai-arch-check.js:73, self-growth.js:38 | 같은 본문의 `readText` 2곳 복제 — `lib/fs.js` 신설 시 이행 | 열림 |
