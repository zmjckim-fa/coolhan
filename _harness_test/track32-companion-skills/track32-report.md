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

---
## v2.5.1 addendum — 12th companion skill: `web-clone`

User: "쿨한에도 설치해" (web-clone was only in `~/.claude/skills`, i.e. this machine/account only).
Vendored `web-clone` (Jane/xiaoer, MIT, upstream v1.6.0 @0269e0e) into `.claude/skills/web-clone`
(SKILL.md + LICENSE + README + references/ + scripts/; the upstream `.git` and the WeChat QR image
are not shipped). Wiring: G16 `EXPECTED` +1, lint `SKIP_DIRS` +1 (third-party, not hand-edited),
install.js message 11→12, companion-skills.md row + attribution, SDLC-map row, Site Analyzer
only-if-present section (reverse R1 — real-source recon is C10-admissible evidence; P0 scope +
no third-party content/asset copying).

| Check | Expected | Actual |
|---|---|---|
| G16 `companion-skills-check` | 12/12 shipped, exit 0 | see run log below |
| G16 synthetic repo lacking web-clone | shipped=false (no false present) | covered by existing "shipped vs global" test |
| lint over `.claude/skills` | web-clone skipped (third-party), repo clean | see run log |
| jest companion-skills suite | 5/5 | see run log |
