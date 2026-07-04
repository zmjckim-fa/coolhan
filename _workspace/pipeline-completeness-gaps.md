# What's still missing for "planning → development" to run perfectly non-stop

> Honest premise: "perfect" is unreachable — residual risk and unknown cases always remain.
> These are the structural gaps that most limit a truly closed, autonomous plan→dev loop today.

## Current state (already built)
Intent → UX(Task1.5) → Spec → Developer(HX from line1) → Validator(10-stage: planner-intent §0,
security §6, HX §10) → QA(negative) → Security Reviewer → DevOps; + Integration/E2E/HX-vision;
Self-Auditor (drift); reverse (analyze/modularize/adapt); continuous engine + relay + non-stop;
stack-agnostic; evidence-required; security P1–P3.

## The decisive gaps (ranked)

### G1 — Execution substrate (BIGGEST) ★
The harness *reasons about* verification but has no guaranteed way to **actually run** the generated
software: provision env, install deps, migrate DB, seed data, start the server, run the test suite,
observe. When the env isn't there, stages go NOT_RUN (we saw playwright NOT_RUN). Without real
execution, "spec-compliant on paper" is as far as it can close.
→ Build: a sandbox/provisioning step (per detected stack) + real run/test/observe, feeding Validator
   §8–9, QA, Integration, E2E, HX render with actual results. This is the #1 unlock.

### G2 — Requirements traceability + acceptance-test generation ★
Spec has acceptance criteria and QA writes tests, but nothing **binds each requirement ↔ test ↔ code**.
"Coverage" is asserted, not proven per-requirement.
→ Build: a traceability matrix (requirement → acceptance test → code symbol), auto-generate a failing
   acceptance test per requirement first (spec-first/TDD), and gate "done" on every requirement having
   a passing bound test.

### G3 — Plan/Spec quality gate BEFORE coding
Self-Auditor checks alignment *during* dev; Validator checks code *vs* spec. Nothing gates the **plan
itself** for feasibility, completeness, testability, and internal contradiction before dev starts, nor
validates the goal→backlog **decomposition** (missing units, wrong order, hidden deps).
→ Build: a Spec/Plan Reviewer (pre-dev gate) + backlog-decomposition validator (dependency graph,
   completeness, each unit independently verifiable).

### G4 — Full regression + integration gate
Units are verified in isolation; QA is incremental. No enforced **full regression** + cross-unit
**integration** run before declaring the whole goal done.
→ Build: a regression/integration gate at backlog completion (all tests, all units together).

### G5 — Run ledger + lessons feedback loop
Reports say "done"; Self-Auditor checks completion integrity. But there's no persistent **run ledger**
(what passed, coverage trend, timings) nor a **post-mortem/lessons** capture that improves future runs.
→ Build: `_workspace/_ledger.jsonl` + a lessons file fed back to the KB (the reverse harness feeds
   modules; the forward harness should feed failures/lessons).

### G6 — Environment/data/config/secret provisioning as a first-class step
DB migrations/seed/config/secret setup for the running app is implicit in DevOps, not a gated step.
→ Build: an explicit provisioning stage (env vars, secrets from store, migrations, seed) with evidence.

## Recommended order (each a non-stop goal)
1. **G1 execution substrate** (unlocks real verification everywhere) — highest leverage.
2. **G2 traceability + acceptance-test-first** (proves coverage per requirement).
3. **G3 plan/spec quality gate** (catch bad plans before wasting units).
4. G4 regression/integration gate → G5 ledger/lessons → G6 provisioning.

## Honest bound
Even with all six, the harness guarantees **engineering validity** (built-to-spec, tested, reproducible),
not that the spec is what the user ultimately wanted, nor absence of unknown defects. Human judgment on
"is this the right thing" remains outside the loop (same lesson as engineering≠scientific, and
checks≠secure).
