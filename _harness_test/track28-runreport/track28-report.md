# Track 28 — Run Observability Report (G12) adversarial verification

The Foundation/Observability box of the agent-loop roadmap: G5 ledger, G10 loop state, G8-B
backlog, proposals, and design history each recorded their slice, but nothing composed them into
one readable picture of a run. `run-report.js` aggregates them; it observes only — it never
changes a verdict and never blocks.

| Scenario | Input | Expected | Actual | Match |
|---|---|---|---|---|
| A: realistic mid-run state | 3-unit backlog (1 done, 1 todo, 1 in-progress) + 5 ledger entries (1 from another run) + escalated U2 with 2 failure tails + 1 proposal | backlog incomplete with U2/U3 named; run-id filter keeps 4/5 entries; recurring lesson (G10 ITERATE ×2) surfaced; U2 escalation + last failure tail shown; 1 pending proposal | exactly that (artifacts: `_workspace/{run-report-r28.md, report-r28.json}`) | ✅ |
| B: proposals count precision | header + separator + 1 entry row | count 1 (header/separator never counted) | 1 (fixed during track — first build counted the separator row; regex tightened) | ✅ |
| C: empty workspace | no artifacts at all | honest "nothing recorded — not proof of completion" report, exit 0 | rendered with that exact caveat | ✅ |
| D: unit tests | 6 cases (empty-honesty, partial-vs-complete backlog, per-gate aggregation + run-id filter, recurring lessons, loop/escalation summary, markdown render) | 6/6 | jest 6/6 | ✅ |

0 false positives (another run's ledger entries never leaked into a filtered report; header rows
not counted as proposals), 0 false negatives (incomplete backlog, escalation, and the recurring
lesson all surfaced).

**Verdict:** PASS — a run's full state (completion, gates, loop iterations, lessons, proposals)
is now one artifact a human can read mid-run or post-run.

**Honest bound:** the report shows what the gate artifacts recorded — it cannot show work that
bypassed the gates, and a green report is only as trustworthy as G1–G11 that fed it.
