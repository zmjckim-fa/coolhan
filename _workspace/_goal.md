# Goal (immutable)

run_id: 20260626-g1-execution
feature: Execution Substrate — actually run generated software (provision → install → test → observe) so verification uses real results, not "should run"
purpose_fit: |
  The biggest gap: the harness reasons about verification but has no guaranteed way to actually
  execute generated code. When the env isn't provisioned, Validator §8–9 / QA / Integration / E2E
  go NOT_RUN. G1 adds a stack-agnostic execution runner that provisions the env, installs deps,
  runs the app/tests, and captures real evidence (logs/exit codes) — turning "should pass" into
  "did pass". This is the #1 unlock for a closed plan→dev loop.
scope_boundary (P0):
  - G1 ONLY: an execution-runner script + an Execution Runner agent + wiring into the pipeline
    (Validator/QA consume its evidence) + adversarial verification. No G2–G6 this run.
  - Stack-agnostic (detect stack → matching install/test/run). Missing tool → NOT_RUN (honest),
    never simulated/faked (C10). Evidence = real captured output.
definition_of_done:
  - scripts/exec-runner.js: detect stack, run install/test/run commands in a target dir, capture
    stdout/stderr/exit + timing to an evidence JSON; timeouts; --json; never fabricate results
  - agents/execution-runner.md: role, entry gate, real-run protocol, NOT_RUN honesty, evidence schema
  - orchestrator: Validator §8–9 / QA reference the runner's real evidence (no simulation)
  - CLAUDE.md team + change history
  - tests: src/__tests__/exec-runner.test.js (runs a tiny passing + failing sample, asserts captured exit)
  - adversarial (track13): real passing app → PASS w/ evidence; failing tests → FAIL w/ real log;
    missing tool → NOT_RUN (not fake pass); 0 false +/-
