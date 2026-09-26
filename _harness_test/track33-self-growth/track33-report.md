# Track 33 — Self-Growth Engine (G17) adversarial verification

User goal: CoolHan must become 자기성장형/자기개발형 — analyze its own accumulated work and grow, so
agent-driven + loop development produces correct results. `scripts/self-growth.js` mines CoolHan's
OWN durable evidence and emits a ranked self-improvement backlog that feeds the non-stop loop.

| Scenario | Input | Expected | Actual | Match |
|---|---|---|---|---|
| A: ledger recurrence | 2× same (gate,reason) FAIL + 1 one-off + 1 PASS | 1 candidate (the 2× cluster), one-off/PASS ignored | 1 item, G2-trace, "2× FAIL" | ✅ |
| B: deferred decisions | DECISIONS.md with "deferred to a later track" | surfaced as a revisit candidate | ≥1 decisions item | ✅ |
| C: run-report | ESCALATED + done-but-unvalidated lines | both high-priority | [high, high] | ✅ |
| D: proposals | proposal row + header row | proposal row only (header ignored) | 1 item, header skipped | ✅ |
| E: applied site | coolhanx.com verdict with BLOCKED/FAIL/NOT_RUN | high-priority gap candidate naming the site | site:coolhanx.com, high (3 rows) | ✅ |
| F: honesty | no sites dir; empty evidence | no site items / no crash; "nothing to mine yet" render | [] / honest render | ✅ |
| G: ranking+sources | mixed high+medium | high ranked first; sources_scanned accurate | high first; ledger=false, decisions=true | ✅ |
| H: unit tests | 8 cases | 8/8 | (see suite) | ✅ |

0 false positives (single-occurrence FAILs, PASS rows, header rows, absent sources never became
candidates), 0 false negatives (every recurring/blocking signal surfaced).

**Verdict:** PASS — self-growth is a repeatable mechanism: the more CoolHan runs, the richer its
ledger/decisions/reports/site-verdicts, and this engine turns that accumulated evidence into the
next self-improvement backlog for the loop to execute (gated by G1–G16, per-feature ritual).

**Honest bound (C10):** it proposes from RECORDED on-disk evidence — NOT from "all conversations
across all sessions/accounts" (not accessible/verifiable). Cross-session growth accrues because
every run appends to the artifacts it reads; `--sites <dir>` folds applied-project verdicts in. It
is advisory: a human/orchestrator sets scope, and it never edits the harness itself.
