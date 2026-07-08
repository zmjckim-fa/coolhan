# Goal (immutable)

run_id: 20260707-g8-context-completion
feature: Mandatory context ingestion + 100%-completion enforcement (G8) — fix "stops early" and "acts on latest command only"
purpose_fit: |
  Two recurring, user-reported harness defects:
  (1) STOPS EARLY — "쿨한으로 작업하라" stops mid-work instead of running until 100% done. Root cause:
      the working-mode lists "context limit → baton" as a normal outcome, and there is no mechanical
      check that a "complete" claim actually means the whole backlog is done+validated. So the engine
      can declare/behave as done, or pause, before the work is finished.
  (2) ACTS ON LATEST COMMAND ONLY → wrong output. Root cause: Phase 0 "context check" only checks
      whether _workspace outputs EXIST; it never forces the orchestrator to actually READ and
      internalize the full spec + prior development (goal, backlog, spec docs, CLAUDE.md history,
      prior _workspace artifacts, relevant knowledge_base) before acting. So it works from the last
      message alone and drifts.
scope_boundary (P0):
  - G8 ONLY: two mechanical gates + their wiring into the orchestrator SKILL/agents + tests + adversarial.
    (A) Context Ingestion Gate: scripts/context-check.js verifies a per-run context digest
        (_workspace/_context-digest.json) exists and references the required source docs BEFORE any
        development task runs. SKILL Phase 0 rewritten from "check existence" to "read all + produce
        digest, or halt".
    (B) Completion Gate: scripts/completion-check.js parses the backlog and confirms 100%
        (every unit done AND validated) before a "✅ all complete" declaration is allowed; exit 1 if
        any unit is todo/in-progress/unvalidated. Working-mode reworded so the ONLY acceptable end
        states are (a) 100% complete, or (b) a genuine stop condition — a context-limit baton is a
        CONTINUATION, never a completion, and "pausing at a natural break" is banned.
  - Does NOT change what the gates downstream (G1-G7) verify; this is about starting fully-informed and
    not ending early.
  - Honesty: these gates enforce "read the declared sources" and "backlog is 100% done", not that the
    digest was deeply understood or that the backlog itself is correct/complete (that is G3/human).
definition_of_done:
  - scripts/context-check.js: given a digest file + a list of required source keys, verify the digest
    exists, is fresh (matches current run_id), and references every required source (goal, backlog,
    spec, history, prior_artifacts); exit 1 + name missing sources otherwise; --json.
  - scripts/completion-check.js: given a backlog file, parse unit rows + statuses; ok only if every
    unit is done AND validated (a done-but-unvalidated or todo/in-progress unit → not ok); report
    remaining units; exit 1 if not 100%; --json.
  - SKILL.md: Phase 0 rewritten as a Context Ingestion Gate (mandatory full read → _context-digest.json
    → only then proceed); working-mode "Non-Stop"/"Completion" reworded (baton ≠ done; ban early stop;
    completion-check must pass before "all complete").
  - agents: intent-analyzer (or orchestrator note) reads full context first; a short note in
    self-auditor that completion-check gates the "done" claim.
  - CLAUDE.md change-history entry.
  - tests: src/__tests__/context-check.test.js + src/__tests__/completion-check.test.js
  - adversarial (track20): digest missing a required source → context gate FAIL(named); complete digest
    → PASS; backlog with any non-done/unvalidated unit → completion FAIL(remaining named); all
    done+validated → PASS; stale digest (wrong run_id) → FAIL; 0 false +/-
