# Goal (immutable)

run_id: 20260719-autopilot
feature: Full-Completion Auto-Pilot Mode — operationalize the "senior full-stack dev, never stop, never ask, never fake-complete" discipline as first-class CoolHan artifacts/gates
purpose_fit: |
  The user pasted a long external prompt pattern (Claude Code Auto mode + /goal + a strict
  completion-discipline system prompt) and wants CoolHan upgraded so its own agents embody it,
  regardless of which CLI wrapper (Auto mode/--continue/--resume) is used. Claude Code's Auto
  mode/`/goal`/`--continue` are CLI-level features outside CoolHan's control (CoolHan is a
  project-level harness); what CoolHan CAN and should do is give its agents the exact artifacts
  and gates the prompt describes: TASKS.md (5-state), docs/DECISIONS.md, an enriched resume
  checkpoint (the PROGRESS.md-equivalent), a narrow 4-condition question gate, a no-dead-code
  scan (TODO/placeholder/coming-soon), and explicit absolute-prohibitions — reusing G1-G8
  (execution/traceability/plan/regression/ledger/provision/gates/completion) rather than
  duplicating them.
scope_boundary (P0):
  - THIS RUN ONLY: scripts/tasks-check.js + scripts/no-placeholder-check.js + docs/DECISIONS.md
    convention + _checkpoint.md field enrichment (PROGRESS.md-equivalent) + tightened 4-condition
    question gate + absolute-prohibitions list, wired into CLAUDE.md/SKILL.md/developer.md/
    validator.md, tests, adversarial verification. Does not modify G1-G8 internals or _backlog.md
    format; TASKS.md is an additional, optional artifact alongside the existing backlog.
  - Honest bound (unchanged): these gates prove artifacts exist and units are verified/scanned —
    not that the underlying implementation is correct or is what the user ultimately wanted.
definition_of_done:
  - scripts/tasks-check.js: parses TASKS.md units with 5 states (not-started/in-progress/
    implemented/verified/blocked); ok only if 0 units are not-started/in-progress/blocked
    (implemented-but-not-verified also fails); reports remaining/blocked by name; --json.
  - scripts/no-placeholder-check.js: scans given paths for TODO/FIXME/XXX/"coming soon"/
    "준비 중"/placeholder markers; exit 1 + name file:line if any found; --json.
  - docs/DECISIONS.md seeded with the convention + one real example.
  - CLAUDE.md: 4-condition question gate (credentials/payment/irreversible-prod-deletion/
    mutually-incompatible-requirements) + absolute-prohibitions list (no partial-as-complete,
    no "time constraints/later" excuses, no scope reduction for volume, no TODO/placeholder left).
  - SKILL.md: _checkpoint.md template enriched with the exact requested fields (goal/completed/
    current/remaining/key decisions/how-to-run/test results/next action); resume wording tightened
    to "don't explain or ask, resume immediately from the last incomplete task."
  - agents: developer.md references DECISIONS.md + no-placeholder-check; validator.md references
    tasks-check.js as an additional completion source when TASKS.md exists.
  - tests: src/__tests__/(tasks-check, no-placeholder-check).test.js
  - adversarial (track21): all-verified TASKS.md → PASS; a blocked/not-started unit → FAIL(named);
    a file with a TODO claimed verified → FAIL(named, location); 0 false +/-
