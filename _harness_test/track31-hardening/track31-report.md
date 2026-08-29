# Track 31 — Production Hardening Probe (G15) adversarial verification

Turns 5 real user-reported production holes into a repeatable gate, measured over real HTTP.
Both scenarios run against real local HTTP servers (a deliberately vulnerable origin and a
hardened one); artifacts in `_workspace/`.

| Hole | Check | Vulnerable origin | Hardened origin |
|---|---|---|---|
| 1 AI agent bypass (allowlist-before-blocklist lets ChatGPT-User/Claude-User/PerplexityBot through) | H1 | ❌ FAIL — named the 3 agent UAs served 200 HTML | ✅ PASS (403) |
| 2 X-Powered-By / x-nextjs-cache leak | H2 | ❌ FAIL — both headers named | ✅ PASS |
| 3 Express "Cannot GET /api/…" leak | H3 | ❌ FAIL — leaked body quoted | ✅ PASS (neutral 404) |
| 4 UA-only spoof (claims Chrome, no sec-ch-ua/sec-fetch-mode) | H4 | ❌ FAIL — served 200 | ✅ PASS (403) |
| 5 robots.txt allows AI answer/agents | H5 | ❌ FAIL — unblocked crawlers named | ✅ PASS (10/10 disallowed) |

| Scenario | Verdict | Match |
|---|---|---|
| A: vulnerable origin (all 5 open) | FAIL, every hole named | ✅ (`vuln-result.json`, `vuln-report.md`) |
| B: hardened origin (all 5 closed) | PASS | ✅ (`hardened-result.json`) |
| C: unit tests | 10/10 (each check PASS+FAIL, robots-404, unreachable→NOT_RUN) | ✅ |

0 false positives (the hardened origin passed every check), 0 false negatives (all 5 holes
detected and named on the vulnerable origin). An unreachable origin returns NOT_RUN, never a
false PASS.

**Verdict:** PASS — the 5 holes are now a mechanical, re-runnable gate
(`node scripts/hardening-check.js <base_url>`), so a fixed hole stays fixed (the probe IS the
regression guard).

**Honest bound:** proves these 5 known holes are closed on the probed origin now — not that the
site is secure. A FAIL is a measurement: read the middleware/robots/nginx source to confirm which
side is wrong before fixing (G14 discipline). New bot UAs, new leak headers, and logic bugs
behind auth are out of scope; the auditor extends the UA/header lists as new ones appear.
