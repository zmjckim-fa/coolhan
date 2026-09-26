# Track 32 — Companion skills install + presence probe (G16) verification

User request: install the skills.sh top coding/design skills into CoolHan's base functionality.

| Check | Result |
|---|---|
| 11 skills vendored into `.claude/skills/` (real dirs, each with SKILL.md) | grill-me, codebase-design, implement, diagnosing-bugs, code-review, resolving-merge-conflicts, frontend-design, web-design-guidelines, react-best-practices, redesign-skill, taste-skill — all copied from `~/.claude/skills` (verifiable files, not fabricated) |
| install.js ships them | ✅ Step 6 already copies `.claude/skills/` → target `~/.claude/skills` on install |
| secret-scan on 96 vendored files | ✅ clean |
| Agent wiring (only-if-present, C3) | ux-design-lead (frontend-design/web-design-guidelines/taste/redesign), developer (codebase-design/implement/react-best-practices/diagnosing-bugs/resolving-merge-conflicts/frontend-design), plan-reviewer (grill-me/code-review), validator (code-review/web-design-guidelines) |
| G16 `scripts/companion-skills-check.js` | reports shipped (repo) vs global (env) per skill; a dir without SKILL.md is ABSENT, never a false present |
| Tests | `companion-skills-check.test.js` 5/5 |

**Verdict:** PASS — the skills are genuinely part of CoolHan's base (shipped + agent-wired), with a
mechanical presence probe. Invocation is only-if-present (C3): agents never fabricate having used a
skill that isn't installed.

**Honest bound:** these are third-party skills vendored with their own licenses retained; skill
advice improves the maker side but is never accepted as gate evidence (C10 — only captured
execution results pass). Update by re-copying from upstream registries.
