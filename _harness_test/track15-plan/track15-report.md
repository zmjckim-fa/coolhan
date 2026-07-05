# Track 15 — G3 Plan-Check Gate Adversarial Verification

Command: `node scripts/plan-check.js _harness_test/track15-plan/<file>.json` (real execution, not simulated).

| Case | File | Expected exit | Actual exit | Key output line | Verdict |
|---|---|---|---|---|---|
| Good plan | good.json | 0 | 0 | "plan is structurally sound" | PASS |
| Dependency cycle | cyclic.json | 1 | 1 | "dependency cycle: U1 → U2 → U1" | PASS |
| Missing `verifies` | no-verify.json | 1 | 1 | "units without verification: U1" | PASS |
| Uncovered requirement | uncovered.json | 1 | 1 | "uncovered requirements: R3" | PASS |
| Missing dependency (non-existent unit id) | missing-dep.json | 1 | 1 | "missing dependencies: U1→U99" | PASS |
| Ordering violation (dep listed after dependent, no cycle) | order-violation.json | 1 | 1 | "ordering violations (dep after unit): U2 before U1" | PASS |

## Notes on distinguishing missing-dep / ordering-violation / cycle

Source review of `scripts/plan-check.js` (`evaluate()`, lines 60-100) confirms these are three
separate, independently reported checks:
- `missing_deps`: dep id not present in the unit id set at all (`U1→U99`).
- `order_violations`: dep exists but appears **later** in the `units[]` array than the unit that
  depends on it (checked via a `seen` set populated in array order) — this is an ordering/listing
  problem, not a graph cycle.
- `cycle`: detected separately via DFS with white/grey/black coloring in `findCycle()`.

First attempt at an "ordering violation" fixture (U1 depends on U2, U2 depends on U1, U2 listed
last) actually created a real 2-node cycle, so `plan-check.js` correctly reported **both**
`order_violations` and `cycle` for `cyclic.json` (see table row 2) — this is correct overlapping
behavior, not a bug: a cycle by definition also violates topological listing order.

A clean, cycle-free ordering-violation fixture was built instead (`order-violation.json`): U2 is
listed first and depends on U1, which is listed second (no cycle, since U1 has no deps back to
U2). This isolated the ordering-violation path exit 1 without a cycle being reported.

## Tally

- False positives (gate failed a structurally sound plan): **0**
- False negatives (gate passed a structurally unsound plan): **0**
- 6/6 cases matched expected exit code and expected violation reported.

## plan-reviewer.md sanity check

`.claude/agents/plan-reviewer.md` exists (108 lines). Confirmed coherent two-layer verdict
structure:
- `structural_status` = mechanical, exit-code driven from `plan-check.js`, explicitly stated as
  "non-negotiable... no override by judgment" (Core Principles #2, Verdict/Gate section).
- `open_risks` = softer judgment calls (feasibility/completeness/testability/contradiction/
  decomposition), explicitly advisory except when a risk is P0-severity contradiction, which also
  forces `gate = FAIL`.
- Verdict/Gate section explicitly states `gate = FAIL if structural_status.ok === false` with no
  escape hatch — judgment cannot override a structural FAIL, matching the two-layer design
  requirement.
- Output JSON schema and entry gate (NOT_RUN if no spec/backlog) are both present and consistent
  with the rest of the CoolHan harness pattern (Self-Auditor / Validator two-layer precedents).

No structural defects found in the agent definition.

## Overall Verdict

**PASS** — the G3 plan-check gate correctly distinguishes and reports all 4 violation classes
(cycle, no-verify, uncovered requirement, missing dependency) plus ordering violations, with
correct exit codes in every case. 0 false positives / 0 false negatives.
