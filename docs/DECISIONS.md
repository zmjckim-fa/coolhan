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
