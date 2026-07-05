# Requirements Traceability + Acceptance-Test-First (G2)

> Bind **every requirement ↔ acceptance test ↔ code**, and gate "done" on each requirement having a
> **passing** bound test. Coverage stops being asserted and becomes demonstrable per requirement.
> Pairs with G1 (execution substrate): test STATUS comes from real execution, not narrative.

## The rule (acceptance-test-first)
1. Intent/Spec assigns each requirement a stable **ID** (R1, R2, …) with falsifiable text.
2. For each requirement, write a **failing acceptance test first** (bound to the ID) — before the code.
3. Developer implements until each bound test passes (via the Execution Runner's real results).
4. **Done gate:** `scripts/trace-check.js` must pass — every requirement has ≥1 bound test AND all
   its bound tests passed (from real execution). Uncovered / failing / not_run requirement → gate FAIL.

## Traceability file (`_workspace/traceability-{id}.json`)
```json
{
  "feature": "user login",
  "requirements": [
    { "id": "R1", "text": "valid credentials return a token", "tests": ["T-login-ok"], "code": ["src/routes/auth.py:60"] },
    { "id": "R2", "text": "invalid credentials are rejected (401)", "tests": ["T-login-bad"], "code": ["src/routes/auth.py:66"] }
  ],
  "test_results": { "T-login-ok": "pass", "T-login-bad": "pass" }   // filled from exec-runner evidence
}
```
- `test_results` values: `pass` | `fail` | `not_run`. Populate from the Execution Runner's captured
  evidence — never hand-write a `pass` (that reintroduces simulation).

## Gate semantics (`trace-check.js`)
- ok (exit 0) ⇔ requirements non-empty AND 0 uncovered AND 0 failing AND 0 not_run.
- Reports per-requirement status + lists uncovered / failing / not_run.

## Honesty
Full traceability proves each requirement has a passing test. It does **not** prove the requirements
themselves are complete or correct — that is the plan-quality gate (G3), and ultimately human judgment.

## Who does what
- **Spec Writer:** emits requirement IDs + falsifiable text; seeds the traceability file's `requirements`.
- **QA Tester:** writes acceptance tests bound to requirement IDs; never marks a requirement's test
  `pass` without the Execution Runner's real result.
- **Validator:** runs `trace-check.js` as part of the done gate (every requirement → passing test).
