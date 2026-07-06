# Goal (immutable)

run_id: 20260706-g6-provision
feature: Environment/secret provisioning check as a first-class pre-execution stage (G6)
purpose_fit: |
  G1 (exec-runner) runs install/test/run and honestly reports NOT_RUN when a TOOL is missing — but it
  has no concept of missing ENVIRONMENT (required env vars/config undeclared or unset). A stack can
  have every tool installed and still fail for a reason the harness currently reports as a generic
  install/test FAILED, indistinguishable from a real code defect. This misleads Validator/devops into
  treating an environment gap as a code bug. G6 adds a provisioning check that runs before G1: it reads
  the project's declared required env vars (from a .env.example/.env.sample convention), checks which
  are present in the environment, and reports missing ones by NAME ONLY — never their value. This also
  hardens the P3 least-privilege/secret baseline: no evidence, ledger entry, or log line produced by
  this or any gate may ever contain an actual secret value.
scope_boundary (P0):
  - G6 ONLY: scripts/provision-check.js (declared-vs-present env var check, name-only reporting) +
    wiring into execution-runner.md as a pre-flight step before G1's install/test/run + adversarial
    verify. Does NOT provision infrastructure (no cloud resource creation, no DB spin-up, no secret
    generation) — that remains a human/ops responsibility. This is a READINESS CHECK, not a provisioner.
  - Convention: a project declares required env vars via `.env.example` (or `.env.sample`) — each
    non-comment `KEY=` line names a required var. No such file → nothing required, check passes
    trivially (not an error).
  - Honesty: "missing env var" is a distinct, named reason from "tool not installed" (G1) or "code
    defect" (Validator) — never conflate them. Never print or log an actual env var VALUE anywhere in
    this feature's output, evidence, or ledger entries — name and presence boolean only.
definition_of_done:
  - scripts/provision-check.js: given a directory, find `.env.example`/`.env.sample`, extract required
    key names, check `process.env` (or a supplied env object, for testability) for presence of each
    (empty string counts as missing), report {required: [...], present: [...], missing: [...], ok}.
    Exit 1 if any required key missing; exit 0 if all present or no example file found; --json.
    NEVER include a value in any output field — enforced by construction (only key names collected).
  - Wired: execution-runner.md runs provision-check before exec-runner's install/test/run phases;
    missing required env → NOT_RUN with reason "missing required env: KEY1, KEY2" (distinct from G1's
    "tool not installed" NOT_RUN reason) — not a fabricated FAILED, not silently skipped.
  - CLAUDE.md team/change-history entries.
  - tests: src/__tests__/provision-check.test.js
  - adversarial (track18): all required vars present → PASS; one missing → FAIL naming only the key
    (never the value of vars that ARE present); no .env.example present → PASS (nothing required,
    not an error); a var present but set to empty string → treated as missing; confirm no secret
    VALUE ever appears in any script output across all cases; 0 false +/-
