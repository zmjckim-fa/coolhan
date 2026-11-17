# Backlog: run_id run-mwk1rhe9 (모든 세션에 상시 지시 + 열린 결함 닫기)

목표: `_workspace/_goal.md`. 원장: `docs/PROGRESS.md` 작업 22~26.

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | 전역 설치 도구 + 이 기기 적용 | `scripts/install-global.js`, `knowledge_base/project-kit/GLOBAL.md.tpl`, `scripts/lib/template.js` | jest install-global · install-global --check | ✅ done (jest 13/13; 이 기기 --check exit 0) |
| U2 | 킷 어긋남 검사 + 설치 거부 | `scripts/new-project.js`, `knowledge_base/project-kit/CHECKS.md.tpl` | jest install-global (new-project --check) | ✅ done (jest 3/3) |
| U3 | 열린 결함 D-2, D-3, D-4, D-8 | `scripts/lib/`, 13개 스크립트, `scripts/check-update.js`, 기준선 2개 | single-source-check · field-lessons check | ✅ done (중복 도우미 0, F-05 0) |
| U4 | 배선 + 적대 검증 track40 | agents, SKILL.md, SDLC map, `_harness_test/track40-global-orders/` | prompt-modernization-check · run-track.js | ✅ done (lint clean 48 files; 시나리오 16/16) |
| U5 | 릴리스 v2.11.0 | 릴리스 문서 | jest 전체 · checks-run · CI | ⬜ todo |
