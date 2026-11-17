# Backlog: run_id run-g23-2026-11-17 (상시 지시 + 프로젝트 킷)

목표: `_workspace/_goal.md`. 원장: `docs/PROGRESS.md` 작업 17~21.

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | 운영자 명령 채굴 + 상시 지시 레지스트리 | `knowledge_base/field-lessons.json` (orders), `scripts/field-lessons.js`, 파생 문서 | field-lessons validate · render --check | ✅ done (validate PASS, 지시 18건; render --check exit 0) |
| U2 | 프로젝트 킷 + 런처 + 생성 인수인계 + 훅 프로젝트 모드 | `scripts/new-project.js`, `scripts/handoff-write.js`, `scripts/lib/template.js`, `knowledge_base/project-kit/`, `.claude/hooks/` | jest project-kit · ask-run-guards · stop-guard | ✅ done (jest project-kit 19/19) |
| U3 | 모듈 저장소 연결 | `scripts/plan-doc-check.js` (--modules), `knowledge_base/project-kit/MODULE_PLAN.md.tpl`, `bundle-tags.json` | jest plan-doc-check --modules 시험 | ✅ done (jest 3/3; 실제 저장소 26/26) |
| U4 | 배선 + 적대 검증 track39 | agents 5, SKILL.md, SDLC map, `_harness_test/track39-project-kit/` | prompt-modernization-check · run-track.js | ✅ done (lint clean 48 files; 시나리오 25/25, 0 false +/-) |
| U5 | 릴리스 v2.10.0 | 릴리스 문서 | jest 전체 · checks-run · CI | ✅ done (커밋 c9448a5, 태그 v2.10.0; jest 337/337; checks-run 통과 12 · 실패 0) |
