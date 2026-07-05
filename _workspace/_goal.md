# Goal (immutable)

run_id: 20260626-g2-traceability
feature: Requirements Traceability + acceptance-test-first — bind each requirement ↔ test ↔ code, gate "done" on per-requirement passing tests
purpose_fit: |
  Today "coverage" is asserted, not proven per requirement. G2 makes every requirement traceable
  to at least one acceptance test and to code, and gates completion on each requirement having a
  passing bound test. Combined with G1 (real execution), this turns "built to spec" into
  "every requirement demonstrably satisfied by a real test".
scope_boundary (P0):
  - G2 ONLY: a traceability schema + a trace-check gate script + spec-writer/qa wiring +
    validator gate + adversarial verification. No G3–G6 this run.
  - Honesty: full traceability proves each requirement has a passing test — not that the
    requirements themselves are complete or correct (that's the plan-quality gate, G3).
definition_of_done:
  - scripts/trace-check.js: read a traceability file (requirements[] {id, text, tests[], code[]})
    + test results; verify every requirement has ≥1 bound test and status=pass; report uncovered/failing;
    exit 1 if any requirement uncovered or its bound test failing; --json
  - references/requirements-traceability.md: matrix schema + acceptance-test-first rule (write a
    failing acceptance test per requirement BEFORE coding) + gate definition
  - spec-writer.md (emit requirement IDs) + qa-tester.md (bind tests to requirement IDs) reference it
  - validator.md: "done" gate requires trace-check pass (every requirement → passing test)
  - CLAUDE.md change history
  - tests: src/__tests__/trace-check.test.js
  - adversarial (track14): fully-covered+passing → PASS; a requirement with no test → FAIL(uncovered);
    a requirement whose test failed → FAIL; 0 false +/-
