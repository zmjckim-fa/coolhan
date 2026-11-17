# Backlog: run_id run-mwko7ihj (D-13 기기 쪽 원인과 대응)

목표: `_workspace/_goal.md`. 원장: `docs/PROGRESS.md` 작업 27~29.

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | 원인 측정과 격리 재현 | `_harness_test/track41-machine-headroom/` | run-track.js | ✅ done (시나리오 11/11; 재현 120건 판정 120/120) |
| U2 | 탐침 + 판정 + checks-run · nonstop 연결 + 교훈 F-41 | `scripts/resource-check.js`, `scripts/lib/spawn-node.js`, `scripts/checks-run.js`, `scripts/nonstop.js`, `knowledge_base/field-lessons.json` | jest resource-check · nonstop · field-lessons validate | ✅ done (jest 13/13, 13/13; validate PASS) |
| U3 | 릴리스 v2.11.1 | 릴리스 문서 | jest 전체 · checks-run · CI | ⬜ todo |
