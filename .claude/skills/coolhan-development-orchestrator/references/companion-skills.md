# Companion Skills — best-in-class skills wired into CoolHan (v2.3.0)

CoolHan now **ships** these third-party Claude Code skills in `.claude/skills/` (so `install.js`
copies them into every project that installs CoolHan) and its agents **invoke** them at the right
step. They are not a replacement for CoolHan's own gates (G1–G15) — they raise the quality of the
*work product* while the gates keep it honest.

## Installed set (source-credited)

| Skill | Source | CoolHan agent that invokes it | When |
|---|---|---|---|
| `grill-me` | Matt Pocock | Intent Analyzer / Plan Reviewer | before coding — interrogate requirements to prevent mis-builds |
| `codebase-design` | Matt Pocock | Developer, Spec Writer | designing module seams / deep interfaces |
| `implement` | Matt Pocock | Developer | the implementation-discipline pass while writing a unit |
| `diagnosing-bugs` | Matt Pocock | Developer (on G10 ITERATE), QA Tester | a failing test/loop iteration → structured diagnosis |
| `code-review` | Matt Pocock | Validator, Plan Reviewer | reviewing a completed unit for correctness before PASS |
| `resolving-merge-conflicts` | Matt Pocock | Developer (G9 parallel merge) | when parallel-wave outputs conflict |
| `frontend-design` | Anthropic | UX Design Lead, Developer | any UI — distinctive, intentional visual design |
| `web-design-guidelines` | Vercel Labs | Validator (stage 10), E2E Tester | audit UI against the Web Interface Guidelines |
| `react-best-practices` | Vercel Labs | Developer | React/Next.js performance patterns |
| `redesign-skill` | community | UX Design Lead | upgrading an existing site's design (reverse/reuse) |
| `taste-skill` | community | UX Design Lead, HX Vision Critic | high-end visual-design taste calibration |

## Invocation rule (C3 — never pretend a skill is present)

Agents call a companion skill via the Skill tool **only when it is actually available**. If a skill
is not installed in the running environment, the agent proceeds with CoolHan's own standard
(design-excellence-standard.md, security KB, etc.) and notes the skill was absent — it never
fabricates having used it. `node scripts/companion-skills-check.js` reports which are present.

## How they compose with CoolHan's gates (division of labor)

- Companion skills improve the **maker** side (better requirements grilling, better design, better
  React, better implementation, better diagnosis).
- CoolHan gates remain the **checker** side (G1 real execution, G2 traceability, G3 plan, G4
  regression, design-quality-check, hardening-check, commercial-gate) — a skill's advice is never
  accepted as evidence; only captured execution results pass a gate (C10).
- Overlap is intentional: `web-design-guidelines`/`frontend-design`/`taste-skill` feed the same
  UI that `design-quality-check.js` then measures mechanically (house-style/palette/imagery).

## Attribution & licensing

These skills are authored by Anthropic, Vercel Labs, Matt Pocock, and the community; they are
vendored here for CoolHan's own use with their own licenses retained where present (e.g.
`frontend-design/LICENSE.txt`). Update them by re-copying from their upstream registries; do not
hand-edit vendored skill files (treat as third-party).
