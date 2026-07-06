# Goal (immutable)

run_id: 20260706-g4-regression
feature: Full regression + integration gate BEFORE deploy (G4)
purpose_fit: |
  G1 (execution-runner) runs a unit's own tests for real. G2 (trace-check) proves each requirement has
  a passing bound test. Neither guarantees the CHANGE didn't silently break something that was already
  passing elsewhere in the suite — no gate re-runs the FULL test suite and diffs against a prior-known-
  good baseline before deploy. G4 closes that: a regression gate that runs the whole suite (via G1's
  stack-agnostic exec-runner), compares against a stored baseline, and blocks deploy if a previously-
  passing test now fails.
scope_boundary (P0):
  - G4 ONLY: scripts/regression-check.js (baseline compare: newly-failing = regression = FAIL; new
    tests with no baseline entry = informational, not a regression; pre-existing failures unaffected =
    not a regression) + baseline storage (_workspace/_test-baseline.json) + wiring into the pre-deploy
    step (devops-deployer / validator) + adversarial verify.
  - Reuses G1's exec-runner for the actual full-suite run — does not reimplement test execution.
  - Honesty: this gate proves "nothing that passed before now fails" — it does NOT prove test coverage
    is adequate (that's G2/QA) or that the plan was sound (G3).
definition_of_done:
  - scripts/regression-check.js: given a current full-suite result (from exec-runner, real evidence)
    and a baseline JSON {test_name: pass|fail}, classify each test as regression (was pass, now fail),
    new (not in baseline), fixed (was fail, now pass), unaffected (fail before, fail now), still_pass.
    Exit 1 if any regression found; exit 0 otherwise; --json; --update-baseline writes current results
    as the new baseline (only after a clean/approved run).
  - Wired as a pre-deploy gate: devops-deployer.md (and/or validator.md) runs regression-check before
    Task 6 deploy proceeds; FAIL blocks deploy, returns to Developer.
  - CLAUDE.md team/change-history entries.
  - tests: src/__tests__/regression-check.test.js
  - adversarial (track16): baseline all-pass + current all-pass (no changes) → PASS/no regression;
    one previously-passing test now fails → FAIL (regression flagged, named); a new test not in
    baseline → passes through as "new", not a regression; a test that was already failing and still
    fails → "unaffected", not a regression; 0 false +/-
