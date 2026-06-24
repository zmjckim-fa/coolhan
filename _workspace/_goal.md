# Goal (immutable)

run_id: 20260624-doctor
feature: CoolHan Doctor — post-install verification CLI
purpose_fit: |
  CoolHan is an npm-installable spec-driven dev framework that copies the .claude/
  agent harness + knowledge_base into a user's project. Users (developers who run
  `npx coolhan-install`) currently have no way to confirm the install is complete
  and healthy. "Doctor" verifies a CoolHan installation and reports issues + fixes,
  embodying CoolHan's own evidence/validation philosophy. Directly serves users.
scope_boundary (P0 — no arbitrary additions):
  - ONLY a read-only install health-check CLI (doctor.js) + bin entry + tests + docs.
  - No changes to agent behavior, no new agents, no network calls, no writes to user files.
definition_of_done:
  - doctor.js: checks (CLAUDE.md pointer, core agents, orchestrator skills, KB modules, node engine), per-check pass/warn/fail, summary, exit 0/1, fix hints.
  - package.json bin `coolhan-doctor` + files[] include doctor.js.
  - __tests__/doctor.test.js green (jest).
  - README + QUICK_START + CHANGELOG mention.
  - full `npx jest` passes; commit + push (English message).
