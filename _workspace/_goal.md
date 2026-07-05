# Goal (immutable)

run_id: 20260626-g3-planquality
feature: Plan/Spec quality gate BEFORE coding + backlog-decomposition validation
purpose_fit: |
  Self-Auditor checks alignment DURING dev; Validator checks code vs spec AFTER. Nothing gates the
  PLAN itself for feasibility/completeness/testability/contradiction before dev starts, nor validates
  the goal→backlog decomposition (missing units, wrong order, hidden deps). G3 catches bad plans
  before wasting units — the last of the "closed plan→dev loop" prerequisites alongside G1/G2.
scope_boundary (P0):
  - G3 ONLY: a Spec/Plan Reviewer agent (pre-dev gate) + a backlog-decomposition validator script
    (dependency graph, completeness, each unit independently verifiable) + wiring + adversarial verify.
  - Honesty: a passing plan gate means the plan is coherent/testable/decomposed — not that the
    requirements are what the user ultimately wanted (that remains human judgment).
definition_of_done:
  - scripts/plan-check.js: validate a backlog file (units[] {id, deps[], verifies}) — every unit has a
    verification, dependency graph is acyclic + all deps exist, ordering respects deps, requirement
    coverage (each requirement mapped to ≥1 unit); exit 1 on any violation; --json
  - agents/plan-reviewer.md: pre-dev gate — reviews spec+plan for feasibility, completeness,
    testability, internal contradiction, decomposition quality; two-layer (structural pass vs open risks)
  - orchestrator: run plan-check + Plan Reviewer BEFORE Task 3 (dev); block on FAIL
  - CLAUDE.md team + change history
  - tests: src/__tests__/plan-check.test.js
  - adversarial (track15): good plan → PASS; cyclic deps → FAIL; a unit with no verification → FAIL;
    a requirement not covered by any unit → FAIL; 0 false +/-
