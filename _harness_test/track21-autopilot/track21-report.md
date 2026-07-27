# Track 21 — Full-Completion Auto-Pilot Mode adversarial verification

| Scenario | Input | Expected | Actual | Match |
|---|---|---|---|---|
| A: all-verified TASKS.md | `_workspace/TASKS-good.md` (2 units, both `verified`) | PASS (exit 0) | `tasks-check` → 2/2 verified, exit 0 | ✅ |
| B: blocked + not-started | `_workspace/TASKS-blocked.md` (T2=차단됨, T3=미착수) | FAIL, T2/T3 named | exit 1, `blocked: T2`, `not-started/in-progress: T3` | ✅ |
| C: TODO left in code | `src_sample/checkout.js` (`// TODO: wire real payment`) | FAIL, file:line named | exit 1, `src_sample\checkout.js:2 [TODO]` | ✅ |

0 false positives (A did not fail), 0 false negatives (B/C did not silently pass).
Real script output captured as evidence in `_workspace/{tc-good,tc-blocked,nph-dirty}.json`.

**Verdict:** PASS — the 5-state task gate distinguishes verified from merely-implemented,
blocked/not-started units are named (never silently dropped), and the placeholder scanner
catches a leftover TODO in code that would otherwise be claimed "done".

**Honest bound:** these are textual/structural gates. They prove the *artifacts* say what the
discipline requires (states named, no known placeholder markers) — not that the underlying
feature is correct or complete beyond what G1/G2 (real execution + traceability) already verify.
