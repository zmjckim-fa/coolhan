# Backlog — run_id 20260626-g2-traceability

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | Traceability gate script | scripts/trace-check.js | covered→exit0, uncovered→exit1, failing→exit1, --json | ✅ done |
| U2 | Tests | src/__tests__/trace-check.test.js | jest 6/6 | ✅ done |
| U3 | Schema + acceptance-test-first + wiring | references/requirements-traceability.md + spec-writer.md + qa-tester.md | doc + agent refs | ✅ done |
| U4 | Validator gate + docs | validator.md §8 + CLAUDE.md | done-gate runs trace-check; team/history | ✅ done |
| U5 | Adversarial verify | _harness_test/track14-trace/ | covered→PASS, uncovered→FAIL, real-failing→FAIL (from real exec), 0 FP/FN | ✅ done |

All units done. Backlog empty → engine complete. Full jest 41/41.
