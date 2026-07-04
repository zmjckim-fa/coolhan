# Track 13 — Execution Substrate Adversarial Verification

**Target:** `scripts/exec-runner.js` + `.claude/agents/execution-runner.md`
**Claim under test:** the runner actually RUNS code and reports honest status —
passing app → PASSED (real exit 0), failing tests → FAILED (real log, never faked),
missing tool / no stack → NOT_RUN (never a fabricated pass).
**Method:** built 3 real sample apps, executed each via
`node scripts/exec-runner.js <dir> --phase test --json`, captured real JSON.
**Date:** 2026-07-04

---

## Sample apps

| Sample | Dir | Design |
|--------|-----|--------|
| S1 pass | `_workspace/app-pass/` | `sum.js` = `a+b` (correct); `npm test` asserts `sum(2,3)===5` |
| S2 fail | `_workspace/app-fail/` | `sum.js` = `a-b` (wrong); same assertion → `process.exit(1)` |
| S3 no-stack | `_workspace/app-nostack/` | only `README.md`, no `package.json`/stack signal |

## Results

| Sample | Expected status | Actual status | Real exit captured? | Runner exit | False +/− |
|--------|-----------------|---------------|---------------------|-------------|-----------|
| S1 pass | PASSED | **PASSED** | Yes — `exit=0`, stdout `ok: 2+3=5` | 0 | none |
| S2 fail | FAILED | **FAILED** | Yes — `exit=1`, stderr `FAIL: expected 5, got -1` | 1 | none |
| S3 no-stack | NOT_RUN | **NOT_RUN** | N/A — `stack=null`, `results=[]`, reason `no recognized stack signal` | 0 | none |

Evidence files: `_workspace/ev-pass.json`, `_workspace/ev-fail.json`, `_workspace/ev-nostack.json`.

## Confirmations

- **PASS → PASSED (exit 0):** S1 returned `status=PASSED`, `results[0].exit=0`, real stdout tail `ok: 2+3=5`, `ms=823`. Backed by an actual `npm test` run.
- **FAIL → FAILED (exit 1, real log, never faked):** S2 returned `status=FAILED`, `results[0].exit=1`, real stderr tail `FAIL: expected 5, got -1` (the genuine assertion output from the wrong `a-b`). The runner did **not** massage the nonzero exit into a pass. This is the fatal-case check — it held.
- **Missing / no stack → NOT_RUN:** S3 returned `status=NOT_RUN`, `stack=null`, `reason="no recognized stack signal"`, `results=[]`. NOT_RUN is the **honest** outcome — nothing executed, and it was **not** reported as a pass. (Tool-missing per-phase NOT_RUN is handled by the same `toolAvailable()` gate; the no-stack case exercises the top-level gate.)

## No-simulation honesty

Every PASSED/FAILED verdict is backed by a real captured exit code and real stdout/stderr
from `spawnSync` — not a narrative. When nothing could run (no stack), the runner emitted
NOT_RUN rather than fabricating a pass. This matches the agent contract in
`execution-runner.md` §"No simulation (P0, C10)": *"Missing tool / unprovisionable env → NOT_RUN …
a fake PASS is a violation."* Process-level exit codes corroborate: 0 (S1), 1 (S2), 0 (S3, NOT_RUN
does not fail).

## Overall judgment

**PASS.** The Execution Substrate runs code for real and reports honest status across all three
adversarial cases. 0 false positives, 0 false negatives. No fabricated pass in the failing case;
NOT_RUN correctly distinguished from PASSED in the no-stack case.
