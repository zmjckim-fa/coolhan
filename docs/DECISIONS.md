# Decisions Log (Auto-Pilot Mode)

> When a spec detail is underspecified and a reasonable default exists, an agent picks the
> default that best fits the current code structure and industry norms, logs it here, and
> **keeps working — it does not wait for an answer.** Only the 4 conditions in
> `CLAUDE.md` § Global Output Rules (real credentials/payment/irreversible prod deletion/
> mutually-incompatible requirements) justify pausing to ask.

## Format

```markdown
## {date} — {short title}
**Context:** what was underspecified
**Decision:** what was chosen
**Rationale:** why this fits the existing code/industry norm
**Reversible:** yes/no — how to change it later if wrong
```

## Log

## 2026-07-19 — Auto-Pilot task-state vocabulary
**Context:** The user-supplied completion discipline names 5 task states in Korean
(미착수/진행 중/구현 완료/검증 완료/차단됨) with no specified file format.
**Decision:** Standardized on a markdown table (`TASKS.md`, columns ID/Task/Status/Verifies)
parsed by `scripts/tasks-check.js`, accepting both the Korean labels and their English
equivalents (not-started/in-progress/implemented/verified/blocked).
**Rationale:** Matches the existing `_backlog.md` table convention already used by
`scripts/plan-check.js`/`scripts/completion-check.js`, so agents don't learn two formats.
**Reversible:** yes — `tasks-check.js`'s `STATUS_MAP` can be extended without changing callers.

## 2026-07-31 — npm publish blocked, needs user credential (not auto-resolved)
**Context:** `publish.yml` fails at the "Publish to npm" step on every push that changes
package.json/install*/.claude/**/knowledge_base/** (`coolhan-builder` has never appeared on
the npm registry — confirmed via `registry.npmjs.org/coolhan-builder` → "Not found" — so this
is the first-ever publish attempt, which needs a valid `NPM_TOKEN` repo secret with publish
scope).
**Decision:** Not auto-resolved. This is condition 1 of the CLAUDE.md question gate (a real
credential is genuinely required and none exists/works) — flagged for the user to add/fix
`NPM_TOKEN` in GitHub repo Settings → Secrets → Actions, rather than guessed at.
**Rationale:** No token value can be fabricated or inferred; publishing is also a
side-effectful action on a shared registry, out of scope for unattended auto-fix.
**Reversible:** n/a — informational gate, not a code decision.

## 2026-08-07 — Model-modernization scope: calibration + reference map, not a 25-agent prompt rewrite
**Context:** "Upgrade the harness to match the new Claude models" is open-ended. Two candidate
scopes: (a) update the mechanically-stale artifacts (context-budget table built for the 200K era,
missing model map) and document the behavior shifts that affect agent wording; (b) additionally
re-tune all 25 agent .md prompts line-by-line for literal-instruction-following models.
**Decision:** Ship (a) now (v1.3.1). Defer (b) — a full prompt audit of 25 agents is a separate
unit of work that needs adversarial re-verification per agent (tracks), and doing it untested in
one pass risks regressing gates that currently verify 0-false-positive/negative.
**Rationale:** (a) is provably stale (no current Claude model has a 100K or 32–64K context;
1M-class models were mis-budgeted at 3 units/session). (b) changes behavior of verified gates and
must go through the same track-based adversarial verification as every prior harness change.
**Reversible:** yes — (b) can be run later as a dedicated prompt-audit track using
`references/model-capability-map.md` §2–5 as the checklist.
**Update 2026-08-07 (v1.4.0):** (b) executed as track22. The audit found the 25 agent files
already clean (prior Token-Efficiency/C1–C19 passes had normalized wording); 12 findings in
skill/reference files were fixed or classified (P0-tagged/allowlisted). Enforcement is now
mechanical: `scripts/prompt-modernization-check.js` (10/10 tests, track22 adversarial 3/3).

## 2026-09-26 — Companion skills (v2.3.0) + Self-Growth Engine scope (v2.4.0)
**Context:** (1) User: install the skills.sh top coding/design skills into CoolHan's base. (2) User:
"analyze ALL conversations/MDs/skills/DB/sources across all sessions & applied sites; make CoolHan
self-growing (자기성장형) for agent-driven + loop solution development."
**Decision (1):** Vendor 11 real skill dirs from ~/.claude/skills into CoolHan `.claude/skills/`
(shipped by install.js) + wire agents to invoke them only-if-present (C3) + G16 presence probe.
**Decision (2):** "Read every session across every account" is not feasible/verifiable in-session
(no cross-account transcript access) — fabricating it would violate C10. Instead build the
mechanical, honest core of self-growth: G17 Self-Growth Engine that mines CoolHan's OWN durable
evidence already on disk (G5 ledger lessons, docs/DECISIONS, run-reports, _harness_test track
outcomes, and an operator-pointed sites root for applied-site outcomes) and emits a prioritized
`_workspace/_self-growth-backlog.md` that feeds the non-stop loop — CoolHan proposing its own next
enhancements, gated by G1–G16.
**Rationale:** delivers "self-developing" as a repeatable mechanism, not a one-off unverifiable claim.
**Reversible:** yes — evidence-source list is configurable; backlog is advisory input to the loop.

## 2026-10-11 — Model-generation upgrade (v2.5.0): effort tiers by role, both ID families current, no pricing, no direct-API guard
**Context:** User: "클로드 모델들이 업그레이드 되고있다. 이에 맞게 쿨한 하네스의 소스와 방식을 고도화해야한다."
Two facts had to be reconciled without stopping to ask: the claude-api reference (cached 2026-06-24) names
`claude-fable-5 / claude-opus-5 / claude-sonnet-5 / claude-haiku-4-5`, while the live Claude Code session
names `claude-fable-5-1 / claude-opus-5-5 / claude-sonnet-5-5 / claude-haiku-5-5`.
**Decision:** (1) Record BOTH ID families as current in the map and the lint; dispatch stays by tier alias,
never by dated ID. (2) Assign the Agent-tool `effort` per role — xhigh for agentic/coding roles, high for
judgment/spec roles, medium for marketing-lead, max reserved for a C11-flagged unit — written into every
agent footer so it survives cold-start delegation. (3) Do not record pricing in the map. (4) Keep Haiku 5.5 at
the 200K relay tier until its window is verified via the Models API (observed only in a session prompt).
(5) Enforce the API-surface removals (budget_tokens/sampling/prefill/refusal/fallbacks) as lint rules and a
reference checklist, not as a runtime guard — the harness runs inside Claude Code and makes no direct
Messages API call today.
**Rationale:** (1) a lint that flags the session's own model ID as "stale" would be wrong on day one;
(2) adaptive thinking leaves effort as the only calibration knob, and footers are the one place every agent
is guaranteed to read; (3) prices change faster than this file and a stale number gets used as true;
(4) C12/C10 — an unverified window must not widen a budget; (5) a guard with nothing to guard is dead code.
**Reversible:** yes — tiers are one footer line per agent; the ID list and Haiku tier are table rows;
a direct-API guard can be added the day a script calls the API.
