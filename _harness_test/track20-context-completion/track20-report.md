# Track 20 — G8 Context-Ingestion + 100%-Completion Adversarial Verification

Real `node scripts/context-check.js` / `scripts/completion-check.js` invocations. All exit codes captured from real runs.

## Context Ingestion Gate (G8-A) — context-check.js

| # | Case | Expected | Actual | Verdict |
|---|------|----------|--------|---------|
| C1 | Digest covers all 5 sources, run_id matches | exit 0 | exit=0 | PASS |
| C2 | Digest with `spec:""` (a required source not read) | exit 1, missing=["spec"] | exit=1, `missing=["spec"]` | PASS |
| C3 | Digest run_id=OLDRUN vs --run-id RUN1 (stale — context not re-read for this command) | exit 1 | exit=1 (stale flagged) | PASS |

## Completion Gate (G8-B) — completion-check.js

| # | Case | Expected | Actual | Verdict |
|---|------|----------|--------|---------|
| C4 | Backlog with a todo + an in-progress unit | exit 1, remaining names them | exit=1, `remaining=["U2","U3"]` | PASS |
| C5 | Backlog: every unit done + validation named | exit 0 | exit=0 | PASS |
| C6 | Backlog: unit done but Verification cell empty (fake completion) | exit 1 | exit=1 (unvalidated) | PASS |

## What these two gates fix (the user's two complaints)
1. **"Stops early"** → C4/C6: the run cannot mechanically be treated as complete while any unit is
   todo/in-progress or done-without-a-named-validation. Combined with the working-mode rewrite (a
   context-limit baton is a CONTINUATION, not a completion; "natural pause" banned), the engine loop
   exits only when completion-check exits 0 or a real stop condition fires.
2. **"Acts on the latest command only → wrong output"** → C1/C2/C3: development may not proceed until a
   fresh `_context-digest.json` records that the full spec + prior development (goal, backlog, spec,
   CLAUDE.md history, prior artifacts) were read. A missing source or a stale run_id blocks the start.

## Honest bound
context-check proves the declared sources were **recorded as read**, not that they were deeply
understood. completion-check proves the backlog is **100% done + each unit names a validation**, not
that the backlog is the right/complete decomposition (that is G3 / human judgment).

## Tally
False positives: 0 / False negatives: 0 (6/6 cases correct; named outputs verified for the two FAIL cases)

**Overall: PASS.**
