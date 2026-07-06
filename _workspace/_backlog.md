# Backlog — run_id 20260706-g4-regression

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | Regression-check script | scripts/regression-check.js | node --check + no-change→exit0, new-fail→exit1(regression named), new-test→pass-through, pre-existing-fail→unaffected, --json, --update-baseline | ✅ done |
| U2 | Tests | src/__tests__/regression-check.test.js | jest regression-check pass | ✅ done (8/8) |
| U3 | Pre-deploy wiring | agents/devops-deployer.md + agents/validator.md | regression-check runs before Task 6 deploy, FAIL blocks | ✅ done |
| U4 | Docs | CLAUDE.md (team + history) | history entry | ✅ done |
| U5 | Adversarial verify | _harness_test/track16-regression/ | no-change→PASS, regression→FAIL(named), new-test→pass-through, pre-existing-fail→unaffected, 0 FP/FN | ✅ done (7 cases, 0 FP/FN) |

next: (backlog empty — G4 complete)
