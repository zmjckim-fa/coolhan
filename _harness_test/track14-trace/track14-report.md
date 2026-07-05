# Track 14 — Requirements Traceability Gate (G2) Adversarial Verification

**Date:** 2026-07-05
**Under test:** `scripts/trace-check.js` (G2) integrated with `scripts/exec-runner.js` (G1)
**Method:** A tiny real Node app (`_workspace/app/`) with 2 requirements (R1 `add(2,3)===5`, R2 `sub(5,3)===2`) and one acceptance test per requirement. The `npm test` runner emits machine-readable `T-add:*` / `T-sub:*` lines and exits nonzero on any failure. `test_results` in every traceability JSON was **parsed from exec-runner's captured stdout** (`_workspace/build-trace.js`), never hand-written.

## Results

| Scenario | exec-runner result | trace-check ok | exit | uncovered / failing | expected-match | false +/- |
|----------|-------------------|----------------|------|---------------------|----------------|-----------|
| S1 — correct impl, both bound | test PASSED (exit 0) | `true` | 0 | — | ✅ match | none |
| S2 — correct impl, R2 has no bound test | (reuses S1 real run) | `false` | 1 | uncovered=`["R2"]` | ✅ match | none |
| S3 — sub() broken (returns a+b) | test FAILED (exit 1) | `false` | 1 | failing=`["R2"]` | ✅ match | none |

## Real-execution provenance (quoted from exec-runner output)

- **S1** (`_workspace/exec-S1.json`): `stdout_tail` = `... T-add:pass\nT-sub:pass`, exec status **PASSED**, exit 0.
  → parsed `test_results = {"T-add":"pass","T-sub":"pass"}`.
- **S2**: same correct impl; traceability file `trace-S2.json` binds `T-add`→R1 and leaves R2 `tests: []` (no acceptance test written). Coverage failure detected structurally, independent of test results.
- **S3** (`_workspace/exec-S3.json`): `stdout_tail` = `... T-add:pass\nT-sub:fail`, exec status **FAILED**, exit 1.
  → parsed `test_results = {"T-add":"pass","T-sub":"fail"}`. The `T-sub:fail` line is a REAL failure from running the broken `sub()`.

No status was authored by hand; each came from `node scripts/exec-runner.js <dir> --phase test --json`.

## Confirmations

- **Fully-covered + passing → PASS.** S1: both requirements bound to passing acceptance tests → `ok=true`, exit 0.
- **Uncovered requirement → FAIL.** S2: R2 has no bound test → `ok=false`, `uncovered=["R2"]`, exit 1. Even though the underlying code is correct, an unbound requirement cannot be "done."
- **Real failing bound test → FAIL.** S3: R2's bound test `T-sub` actually failed under real execution → `ok=false`, `failing=["R2"]`, exit 1. The gate never passed a requirement whose test failed.
- **G1↔G2 integration honest.** trace-check consumed statuses that originated from exec-runner's real run; the failing case propagates end-to-end (real test fail → exec FAILED exit 1 → trace-check FAILING exit 1).

## Overall judgment

**PASS — gate behaves correctly on all three scenarios, 0 false positives / 0 false negatives.**
The traceability gate correctly distinguishes covered+passing (PASS) from uncovered (FAIL) and from real-failing (FAIL), and it derives test status from real execution rather than narrative. Honesty boundary intact: G2 proves each requirement has a passing bound test, not that the requirement set is complete/correct.

## Artifacts (`_workspace/`)
- `app/` — index.js (sub() left in the S3 broken state as the last recorded fixture), test.js, package.json
- `build-trace.js` — parses exec-runner output → traceability JSON (guards against hand-writing)
- `exec-S1.json`, `exec-S3.json` — real exec-runner evidence
- `trace-S1.json`, `trace-S2.json`, `trace-S3.json` — traceability inputs
- `tc-S1.json`, `tc-S2.json`, `tc-S3.json` — trace-check outputs
