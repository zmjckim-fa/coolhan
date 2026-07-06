# Goal (immutable)

run_id: 20260707-g7-gaterunner
feature: Gate orchestrator — run G1–G6 in order end-to-end with honest short-circuiting (G7)
purpose_fit: |
  G1–G6 each exist as an isolated script (provision-check, exec-runner, trace-check, regression-check,
  ledger, plan-check) proven in its own track. But nothing runs them together in the correct dependency
  order against one app with one honest aggregate verdict. Today the ordering lives only as prose in
  agent .md files — a human/LLM must chain them by hand, and there is no verified guarantee that an
  upstream NOT_RUN/FAILED correctly stops downstream (instead of a downstream gate fabricating a pass on
  absent evidence). G7 closes the composition gap: a single orchestrator that runs the pre-deploy gate
  sequence, short-circuits honestly, records each outcome to the ledger, and emits one verdict.
scope_boundary (P0):
  - G7 ONLY: scripts/gates.js (orchestrate existing gate modules in dependency order) + a test suite +
    adversarial verify + docs. It REUSES the existing scripts as libraries (require their exported
    evaluate/run functions) — it must NOT reimplement any gate's logic.
  - Order (pre-deploy sequence): provision-check → exec-runner → trace-check → regression-check, with
    each result appended to the ledger (G5). plan-check (G3) is a PRE-dev gate on a plan file, not part
    of the per-build run sequence, so it is invoked only when a plan file is supplied (separate phase),
    not inline in the build sequence.
  - Honest short-circuit (P0): if provision NOT_RUN → stop, downstream = SKIPPED (never run, never
    faked). If exec FAILED/NOT_RUN → trace + regression = SKIPPED (their evidence would be
    untrustworthy). A SKIPPED gate is reported as SKIPPED, never as PASS. Aggregate verdict is FAIL if
    any gate FAILED, NOT_RUN if the sequence couldn't start, else PASS.
  - No new verification semantics: gates.js decides ordering and aggregation only; each gate's own
    pass/fail logic is unchanged and owned by its module.
definition_of_done:
  - scripts/gates.js: run(targetDir, opts) executes the sequence, returns
    {gates: [{name, status, reason}], verdict, ledger_written}; honest short-circuit as above; appends
    each concrete (non-skipped) gate outcome to the ledger via scripts/ledger.js; CLI
    `node scripts/gates.js <dir> [--plan plan.json] [--json] [--ledger path]`; exit 0 PASS, 1 FAIL,
    2 NOT_RUN/usage.
  - Reuses provision-check, exec-runner, trace-check, regression-check, ledger, plan-check as modules
    (require), not reimplemented.
  - CLAUDE.md change-history entry; brief note in the orchestrator SKILL that gates.js is the single
    executable entry point for the gate sequence.
  - tests: src/__tests__/gates.test.js
  - adversarial (track19): full happy path (all gates pass) → verdict PASS + each gate PASS in ledger;
    provision missing → verdict NOT_RUN/FAIL + downstream SKIPPED (not faked); exec FAILED → trace +
    regression SKIPPED (not faked) + verdict FAIL; a real regression → verdict FAIL named; confirm no
    SKIPPED gate is ever recorded as PASS; 0 false +/-
