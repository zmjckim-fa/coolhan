# Track 19 — G7 Gate Orchestrator Adversarial Verification

Real `node scripts/gates.js` invocations against real node-app fixtures (each with an actual
`npm test` that exits 0 or 1). All exit codes/verdicts below are captured from real runs, not simulated.

## Fixtures
- `pass-app/` — package.json with `test` exiting 0
- `fail-app/` — package.json with `test` exiting 1
- `env-app/` — passing app + `.env.example` declaring `REQUIRED_SECRET` (intentionally unset)
- `trace-pass.json` (R1→T1 pass), `current-pass.json` (T1 pass), `baseline.json` (T1 pass),
  `current-regress.json` (T1 fail — a regression vs baseline)

## Cases

| # | Case | Expected | Actual | Verdict |
|---|------|----------|--------|---------|
| 1 | Happy path (all gates satisfiable) | verdict PASS, exit 0, all 4 gates PASSED, ledger has 4 PASS | verdict=PASS, exit=0, provision/exec/trace/regression all PASSED, led1.jsonl = 4 PASS lines | PASS |
| 2 | exec FAILED (test exits 1) | verdict FAIL, exit 1, trace+regression SKIPPED (not run, not faked) | verdict=FAIL, exit=1, exec=FAILED("test: exit 1"), trace=SKIPPED, regression=SKIPPED; ledger has only provision+exec (no trace/regression) | PASS |
| 3 | provision missing env (REQUIRED_SECRET unset) | verdict NOT_RUN, exit 2, all downstream SKIPPED | verdict=NOT_RUN, exit=2, provision=NOT_RUN("missing required env: REQUIRED_SECRET"), exec/trace/regression all SKIPPED | PASS |
| 4 | real regression (baseline T1 pass, current T1 fail) | verdict FAIL, exit 1, regression names T1 | verdict=FAIL, exit=1, provision/exec/trace PASSED, regression=FAILED("regression: T1") | PASS |

## Invariant checks
- **Honest short-circuit:** in cases 2 & 3 every gate downstream of the tripping gate is SKIPPED —
  confirmed reported as SKIPPED, never PASSED.
- **No SKIPPED-as-PASS in the ledger:** grepped all `led*.jsonl` for "SKIPPED" → zero matches; SKIPPED
  gates are never recorded at all (only concrete PASS/FAIL/NOT_RUN outcomes are appended). This is the
  key composition-safety property: a downstream gate can never fabricate a pass on untrustworthy
  upstream evidence because it is never reached.
- **Module reuse:** gates.js requires provision-check/exec-runner/trace-check/regression-check/
  plan-check/ledger and calls their exported functions — no gate logic is reimplemented (verified by
  reading scripts/gates.js: each step delegates to the module's evaluate/run).
- **Exit-code contract:** 0=PASS, 1=FAIL, 2=NOT_RUN — all four cases matched exactly.

## Tally
False positives: 0 / False negatives: 0 (4/4 cases correct; short-circuit + no-SKIPPED-as-PASS confirmed)

**Overall: PASS.**
