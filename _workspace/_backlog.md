# Backlog — run_id run-mwcmunb7 (field lessons: C:\sites 전 프로젝트 → 쿨한 고도화)

목표: `_workspace/_goal.md`. 원장: `docs/PROGRESS.md` 작업 10~16.

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | 전 프로젝트 분석 (분석 에이전트 8개, 읽기 전용, 증거 인용) | `.coolhan-private/site-lessons/*.md` (비공개) | 8개 파일 존재 + 각 파일 coverage 줄 + WIN/FAIL 표 | ✅ done (파일 8/8) |
| U2 | 교훈 레지스트리(단일 원천) + 파생 KB 문서 | `knowledge_base/field-lessons.json`, `knowledge_base/00_FIELD_LESSONS.md`, `scripts/field-lessons.js` | jest field-lessons + 파생 문서 재생성 diff 0 | ✅ done (validate PASS 64건, render --check 0) |
| U3 | 탐지 가능한 실패 패턴 게이트 | `scripts/field-lessons.js` (check 모드), `src/__tests__/field-lessons.test.js` | jest: 규칙별 위반 FAIL · 적합 PASS | ✅ done (jest field-lessons 15/15) |
| U4 | 기획 단계 집행: 기획서가 해당 실패 패턴마다 방지책을 적었는지 | `scripts/plan-doc-check.js` (`--lessons`), 시험 | jest plan-doc-check: 대응표 없음 FAIL · 있음 PASS | ✅ done (jest plan-doc-check 17/17) |
| U5 | 현장 모듈 카탈로그 + 에이전트·SKILL 배선 | `knowledge_base/field-lessons.json` (modules) → 같은 파생 문서, agents, SKILL.md, SDLC map | prompt-modernization-check clean | ✅ done (배선 17/17, lint clean) |
| U6 | 적대 검증 track38 | `_harness_test/track38-field-lessons/` | 시나리오 전부 일치, 0 false +/- | ✅ done (시나리오 19/19, 0 false +/-) |
| U7 | 릴리스 (CHANGELOG · CLAUDE.md · HANDOFF · DECISIONS · 원장 · 전체 jest · checks-run · 커밋·태그·푸시 · CI) | 릴리스 문서 | jest 전체 green · checks-run 실패 0 · CI green | ✅ done (커밋 5c7ea8f, 태그 v2.9.0, jest 317/317, checks-run 실패 0, CI green) |
