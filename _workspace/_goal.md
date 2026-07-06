# Goal (immutable)

run_id: 20260706-g5-ledger
feature: Run ledger + failure-lesson feedback (G5)
purpose_fit: |
  Every gate (Validator, Security Reviewer, Plan Reviewer, regression-check, trace-check) produces a
  verdict, but nothing persists it across runs. Each new run starts blind — if the same mistake (e.g. a
  recurring security anti-pattern, a recurring plan contradiction, a recurring flaky test) was already
  caught and fixed once, the harness has no memory of it and can repeat the same failure cycle. G5
  closes this: an append-only ledger of gate outcomes across runs, plus a "lessons" query that surfaces
  recurring failure signatures (same gate + same reason appearing ≥2 times) so upstream agents
  (Plan Reviewer pre-dev, Security Reviewer pre-deploy) can warn before repeating a known mistake.
scope_boundary (P0):
  - G5 ONLY: scripts/ledger.js (append/query/lessons) + wiring so Validator/Security
    Reviewer/Plan Reviewer read lessons before their gate and write their outcome after + adversarial
    verify. Does not change any gate's pass/fail logic — the ledger is advisory (surfaces a WARNING,
    never auto-blocks); a recurring pattern is a prompt for extra scrutiny, not a new hard gate.
  - Storage: append-only JSONL at _workspace/_ledger.jsonl (one JSON object per line, never rewritten
    except by explicit prune, so historical evidence is never silently lost).
  - Honesty: a "lesson" is a correlation (same gate+reason recurred N times) — not a proven root cause;
    label it as a pattern to watch, not a diagnosis.
definition_of_done:
  - scripts/ledger.js: append(entry) writes one JSONL line {run_id, unit, gate, status, reason,
    timestamp}; query(filter) reads and filters by gate/status/unit substring; lessons(minCount=2)
    groups by (gate, reason) and returns signatures recurring at or above minCount, sorted by count
    desc; CLI: `node scripts/ledger.js append '<json>'`, `node scripts/ledger.js query --gate X
    --status FAIL`, `node scripts/ledger.js lessons [--min N] [--json]`.
  - Wired: Validator/Security Reviewer/Plan Reviewer append their gate outcome after running; Plan
    Reviewer and Security Reviewer additionally query lessons() before running and surface any
    recurring pattern matching their gate name as an advisory warning (not a block).
  - CLAUDE.md team/change-history entries.
  - tests: src/__tests__/ledger.test.js
  - adversarial (track17): append N entries with a repeated (gate,reason) pair ≥2 times → lessons()
    surfaces it; a (gate,reason) appearing only once → not surfaced; query filters correctly by
    gate/status/unit; ledger file is append-only (existing lines never mutated by a new append);
    0 false +/-
