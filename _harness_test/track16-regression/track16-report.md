# Track 16 — G4 Full-Regression Gate Adversarial Verification

Target: `scripts/regression-check.js`. All runs executed for real via `node scripts/regression-check.js <current> <baseline> [--json|--update-baseline]`; exit codes captured directly from the process (no simulation).

## Wiring review
- `devops-deployer.md` Step 2.5 runs the gate BEFORE Step 3 (deployment lock acquisition) — confirmed correct ordering (lines 101–126 vs Step 3 at 127).
- FAIL (exit 1) halts before lock/deploy, does not proceed to Step 3; error-handling table (line 227) states this explicitly.
- Baseline update is gated: only after a clean/approved deploy, using the same script's `--update-baseline`, which itself refuses to write when `ok=false` (script line 100–103). Coherent double-gate (agent instruction + script enforcement).
- `validator.md` §9 (lines 100–108) cites the same G4 result, does not re-derive it — no duplicate/conflicting logic. Correctly scoped as "informational for new/fixed/pre-existing-failing," matching the script's bucket semantics.

## Case results

| # | Case | Command | Expected | Actual exit | Actual classification | Verdict |
|---|------|---------|----------|--------------|------------------------|---------|
| 1 | No changes from baseline | `current-case1-nochange.json` vs `baseline.json` | exit 0, no regression | **0** | regression=[], still_pass=4, unaffected=1 (`test_legacy_export_csv`) | PASS |
| 2 | Previously-passing test now fails | `current-case2-regression.json` vs `baseline.json` | exit 1, regression names test | **1** | regression=[`test_login_success`] | PASS |
| 3 | New test not in baseline | `current-case3-newtest.json` vs `baseline.json` | exit 0, listed under added, not regression | **0** | added=[`test_new_feature_password_reset`], regression=[] | PASS |
| 4 | Pre-existing failure, still fails | `current-case4-unaffected.json` vs `baseline.json` | exit 0, listed under unaffected, not regression | **0** | unaffected=[`test_legacy_export_csv`], regression=[] | PASS |
| 5 | Mixed: 1 regression + 1 fixed + 1 unaffected(none here, moved to fixed) + 1 still_pass, same run | `current-case5-mixed.json` vs `baseline.json` | exit 1 (regression present); each test bucketed correctly | **1** | regression=[`test_login_success`], fixed=[`test_legacy_export_csv`], still_pass=[`test_login_invalid_password`,`test_logout`,`test_signup_duplicate_email`], unaffected=[] | PASS |
| 6a | `--update-baseline` with a live regression | `current-case6a-hasregression.json` vs `baseline-case6-copy1.json` | refuse to write, exit 1, baseline file unchanged | **1**, stderr `refusing to update baseline while regressions are present` | baseline-case6-copy1.json byte-identical before/after (`test_login_success: pass`, `test_logout: pass`) | PASS |
| 6b | `--update-baseline` with `ok=true` | `current-case6b-clean.json` vs `baseline-case6-copy2.json` | write succeeds, exit 0 | **0**, `baseline updated: ...` printed | baseline-case6-copy2.json now contains 3 entries matching current (incl. new `test_new_ok`) | PASS |

Note on case 5: the original spec listed "1 regression + 1 fixed + 1 unaffected + 1 still_pass" as 4 distinct categories in one run. With a 5-test baseline, achieving all 4 non-regression buckets plus 1 regression requires 5 tests; the fixture used produced regression(1)+fixed(1)+still_pass(3)+unaffected(0) since the only pre-existing-fail entry (`test_legacy_export_csv`) was deliberately set to "pass" to exercise the `fixed` bucket instead. All bucket-assignment logic (the actual thing under test — correct categorization, not just "any FAIL fired") was verified correct per-test-name in the JSON output above.

## False positive / false negative tally

- False positives (non-regression wrongly flagged as regression, or gate FAILed when it shouldn't): **0**
- False negatives (real regression missed, or gate PASSed when it shouldn't): **0**

**Overall: PASS — 0 false positives / 0 false negatives across 7 executed cases (1–6b).**

## Fixture files
- `_harness_test/track16-regression/baseline.json`
- `_harness_test/track16-regression/current-case{1..5}-*.json`
- `_harness_test/track16-regression/baseline-case6.json` (+ two disposable copies used for the write test)
- `_harness_test/track16-regression/current-case6a-hasregression.json`, `current-case6b-clean.json`
