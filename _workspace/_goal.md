# Goal (immutable)

run_id: 20260625-self-audit
feature: Continuous Self-Audit — concurrent plan-vs-work alignment check during non-stop development
purpose_fit: |
  Non-stop (unattended) development risks drifting away from the planning/spec docs
  over many units. Add a self-audit that runs CONCURRENTLY inside the continuous-
  development engine loop: between units it re-reads the planning docs (_goal /
  requirements / spec / _backlog) and the work done, and self-checks that
  development is still proceeding correctly and on-plan — catching drift, scope
  creep, fake completion, and coverage gaps mid-run, not only at final validation.
scope_boundary (P0):
  - A read-only, evidence-based audit agent + its weave into the engine loop + docs.
  - It does NOT replace Validator (per-unit code-vs-spec PASS gate); it is the
    cross-cutting "are we building the right thing, on track" check.
  - No new product features; harness self-improvement only.
definition_of_done:
  - agents/self-auditor.md (role, checks, output schema, verdict, collaboration)
  - orchestrator: Self-Audit woven into continuous-engine loop + working-mode line
  - CLAUDE.md: team table + change history
  - adversarial verification: on-track → ALIGNED(continue); drifted → DRIFT(correct/pause), 0 false +/-
