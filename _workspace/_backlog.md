# Backlog — run_id 20260626-g3-planquality

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | Plan-check script | scripts/plan-check.js | node --check + good→exit0, cyclic→exit1, unit-no-verify→exit1, uncovered-req→exit1, --json | ✅ done |
| U2 | Tests | src/__tests__/plan-check.test.js | jest plan-check pass | ✅ done (9/9) |
| U3 | Plan Reviewer agent | .claude/agents/plan-reviewer.md | pre-dev gate: feasibility/completeness/testability/contradiction/decomposition, two-layer | ✅ done |
| U4 | Orchestrator wiring + docs | SKILL.md (plan gate before Task 3) + CLAUDE.md | gate before dev; team/history | ✅ done |
| U5 | Adversarial verify | _harness_test/track15-plan/ | good→PASS, cyclic→FAIL, no-verify→FAIL, uncovered→FAIL, 0 FP/FN | ✅ done (6 cases, 0 FP/FN) |

next: (backlog empty — G3 complete)
