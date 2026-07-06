# Backlog — run_id 20260707-g7-gaterunner

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | Gate orchestrator | scripts/gates.js | node --check + reuses modules (require), provision→exec→trace→regression order, honest short-circuit, ledger append, aggregate verdict, --json/--plan/--ledger | ✅ done |
| U2 | Tests | src/__tests__/gates.test.js | jest gates pass | ✅ done (9/9) |
| U3 | Docs | CLAUDE.md (history) + SKILL note | history entry + single-entry-point note | ✅ done |
| U4 | Adversarial verify | _harness_test/track19-gates/ | happy→PASS, provision-missing→downstream SKIPPED, exec-fail→trace/regression SKIPPED, regression→FAIL named, no SKIPPED==PASS, 0 FP/FN | ✅ done (4 cases, real fixtures, exit 0/1/2/1, 0 FP/FN) |

next: (backlog empty — G7 complete)
