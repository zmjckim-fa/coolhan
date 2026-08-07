# Track 24 — Agent Loop / Feedback Loop / Long-Running Agent (G10) adversarial verification

Fixture: `flaky.js` — a real process that fails (exit 1) until a `fixed.marker` file exists
(simulates "Developer fixed the code between iterations"). All runs are real child processes
(C10 no-simulation); outputs captured in `_workspace/state.json` + `_workspace/ledger.jsonl`.

| Scenario | Steps | Expected | Actual | Match |
|---|---|---|---|---|
| A: iterate → fix → done | run(broken) ×2, create marker, run again (max 3) | ITERATE(1)→ITERATE(2)→DONE(3); exits 3,3,0; feedback tails recorded | exactly that; ledger FAIL,FAIL,PASS with iteration numbers | ✅ |
| B: never fixed → escalate | run(broken) ×2 with max 2 | ESCALATE at iteration 2, exit 1, never silent | "ESCALATE — 2 iterations exhausted; human/orchestrator decision required" | ✅ |
| C: escalated is terminal | re-run UX2 after escalation | no extra iteration granted; explicit "reset required" note | verdict ESCALATE, note "already escalated — reset required", iteration count unchanged | ✅ (fixed during track: first build silently granted iteration 3 — caught here, step() now treats `escalated` as terminal) |
| D: long-running resume | save state, reload in "new session", run again | resumes at iteration N+1 with prior feedback intact | unit test: session-2 sees session-1's feedback, iteration=2 | ✅ |
| E: unit tests | 9 cases (done/iterate/accumulate/escalate/resume/idempotent-done/independent-units/terminal-escalation/real-process capture) | 9/9 | jest 9/9 | ✅ |

0 false positives (a passing verify was never looped again; DONE is idempotent),
0 false negatives (no failure was ever recorded as pass; ESCALATE never silent).

**Verdict:** PASS — the iterate cycle is now mechanical, feedback is evidence (raw output tails,
ledgered per iteration), and loop state survives session boundaries.

**Honest bound:** DONE proves the verify command exited 0 on that iteration — not that the fix
is correct beyond what the verify covers (coverage adequacy stays with G2/G3). The loop drives
and records; fixing remains the Developer agent's job.
