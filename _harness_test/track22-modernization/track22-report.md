# Track 22 — Prompt-modernization lint adversarial verification

| Scenario | Input | Expected | Actual | Match |
|---|---|---|---|---|
| A: deliberately dated agent | `dated-agent.md` (CRITICAL/MUST, budget_tokens, step-by-step scratchpad, double-check, severity filter, claude-3-5 ref) | FAIL (exit 1), every rule family named | exit 1; findings: pressure-language, dated-thinking ×2, over-verification, severity-filter, stale-model-ref | ✅ |
| B: modern clean agent | `clean-agent.md` (plain triggering language, coverage-first review wording, P0 line using NEVER) | PASS (exit 0), P0 emphasis NOT flagged | exit 0, 0 findings | ✅ |
| C: repo-wide run after cleanup | `.claude/agents` + `.claude/skills` (44 files) | PASS after 12 pre-existing findings were fixed/classified | exit 0 — 12 findings resolved: 2 quoted-example lines allowlisted, 2 SKILL.md MUSTs reworded (enforcement is mechanical), 7 Locked-Mode NEVER rules tagged (P0) (deliberate hard gates keep emphasis), 1 spec-first MUST reworded | ✅ |

0 false positives (B and the P0/C10 exemptions did not fire), 0 false negatives (every dated
pattern family in A was caught). Real script output captured in `_workspace/{dated,clean}-result.json`.

**Verdict:** PASS — the lint distinguishes dated pressure/scaffold/filter language from
deliberate P0-gate emphasis, and the live agent/skill surface is now clean under it.

**Honest bound:** a textual lint. It proves "no known dated prompting pattern remains in the
.md text" — not that agent behavior is optimal on current models (behavior remains the job of
the per-track adversarial verifications), and its pattern list is a snapshot that must grow as
future model generations deprecate more idioms (see model-capability-map.md C12 rule).
