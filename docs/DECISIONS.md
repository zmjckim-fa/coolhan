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
