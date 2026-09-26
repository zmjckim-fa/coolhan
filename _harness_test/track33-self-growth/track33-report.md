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

---
## v2.4.1 — precision fix found by dogfooding (self-analysis)

Running G17 on CoolHan itself (the very "use the harness on the harness" the self-growth engine is
for) exposed a false-positive: `fromDecisions()` flagged DECISIONS.md's format-template line
(`**Reversible:** yes/no — how to change it later if wrong`) and the `**Reversible:** yes — … later`
field as "deferred decisions". A self-growth backlog that lists noise makes the loop chase
non-work — a correctness bug in the growth engine itself.

Fix (precision-tuned): a candidate now requires (1) an actionable field line — Decision/Update/Next
(not Reversible, not the template), (2) no template/placeholder noise (`yes/no`, the template
phrase, `<…>`/`{…}`), and (3) a word-bounded genuine deferral token. Real deferrals still surface.

| Case | Before | After |
|---|---|---|
| `**Decision:** … Defer (b) to a track` | flagged ✓ | flagged ✓ |
| `**Update:** … deferred to track22` | flagged ✓ | flagged ✓ |
| `**Reversible:** yes/no — how to change it later` (template) | ❌ flagged (noise) | ✅ not flagged |
| `**Reversible:** yes — (b) can be run later` | ❌ flagged (noise) | ✅ not flagged |
| plain prose mentioning "later", no field | (matched `:`) | ✅ not flagged |

Repo re-mine after fix: DECISIONS candidates dropped from 4 (2 real + 2 template-noise... net all
4 were the loose `:`-matched Reversible/Decision lines) to only the genuinely-deferred ones. Tests
updated (self-growth 8/8, the decisions case now asserts 2 real / 3 noise). This is self-growth
working as intended: the harness analyzing itself found and fixed its own defect.
