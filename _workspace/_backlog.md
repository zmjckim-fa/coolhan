# Backlog — run_id 20260706-g6-provision

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | Provision-check script | scripts/provision-check.js | node --check + all-present→exit0, missing→exit1(named,no values), no-example-file→exit0, empty-string→treated missing, --json | ✅ done |
| U2 | Tests | src/__tests__/provision-check.test.js | jest provision-check pass | ✅ done (7/7) |
| U3 | Wiring | agents/execution-runner.md | pre-flight before install/test/run; missing env -> NOT_RUN distinct reason from tool-missing | ✅ done |
| U4 | Docs | CLAUDE.md (team + history) | history entry | ✅ done |
| U5 | Adversarial verify | _harness_test/track18-provision/ | all-present->PASS, missing->FAIL(named,no leak), no-file->PASS, empty-string->missing, 0 FP/FN | ✅ done (4 cases, 0 FP/FN, 0 leaks, verified directly) |

next: (backlog empty — G6 complete)
