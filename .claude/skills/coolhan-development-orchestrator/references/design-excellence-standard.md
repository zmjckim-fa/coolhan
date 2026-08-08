# Design Excellence Standard — breaking the AI house style (v1.7.0)

> Driving doc for UX Design Lead (Task 1.5), Developer, and HX Vision Critic on any UI work.
> Companion to `human-experience-standard.md` (usability floor) and
> `knowledge_base/00_DESIGN_PARAMETERIZATION_SYSTEM.md` (token profiles). This file addresses a
> different failure: **every AI-designed page looking the same, and pages made of text only.**

## Why AI output converges on one style (the honest diagnosis)

1. Models have a **default house style** (safe fonts like Inter/Roboto/system, one or two
   signature palettes, hero-then-three-cards layouts). Generic instructions ("make it clean",
   "don't use purple") shift it to a *different fixed style* — they do not produce variety.
2. **Text is free, images are work** — generating prose costs nothing, while imagery needs
   assets, sourcing, or drawing. Left unguided, the model fills every section with text.
3. One-shot generation has no comparison step, so the first (default) direction always wins.

The countermeasures below turn each cause into a rule. They are behavioral rules for agents,
plus one mechanical gate (`scripts/design-quality-check.js`) that makes two of them checkable.

## Rule 1 — Never the house style (banned defaults)

- Banned unless the 기획서 explicitly requires them: Inter/Roboto/Arial/system-font-only stacks;
  purple-gradient-on-white or dark hero; the "centered hero → 3 feature cards → CTA" template
  applied reflexively; identical border-radius/shadow language on every project.
- Typography must be chosen ON PURPOSE: a display face + a body face named in the tokens, with a
  one-line rationale tied to the brief's industry/audience.

## Rule 1b — No washed-out default palettes (color energy is a decision)

The second signature of AI design: **every palette drifts to low-saturation pastel / grayish
tones** — safe, and uniformly bland. Countermeasures:

- The accent color of a chosen direction must be a REAL accent: saturation ≥ 50% (HSL) and
  clearly distinct from the background — OR the tokens must declare `"muted": "intentional"`
  with a rationale tied to the brief (e.g. a bereavement service reasonably stays soft).
  Mechanically checked (design-quality-check.js flags `washed-out-palette`).
- Of the 4 proposed directions (Rule 2), **at least one must be bold**: high-saturation accent,
  strong contrast, decisive color blocking — the human should always see a vivid option next to
  the calm ones, not four shades of beige.
- Color choices carry the same rationale duty as typography: name the palette's energy level
  (vivid / balanced / muted) and WHY it fits the industry + audience. "Pastel because default"
  is the banned answer.

## Rule 2 — Propose 4 directions, then commit to one (variety by construction)

Before building any UI, UX Design Lead produces **4 distinct visual directions** tailored to the
brief — each a compact card:

```
direction: {name}
palette: bg {hex} / surface {hex} / accent {hex} (contrast AA verified)
type: display {face} + body {face}
layout_archetype: {e.g. split-screen editorial / dense dashboard / airy single-column / asymmetric grid}
imagery_plan: {photo-led / illustration-led / icon+data-led / typographic}
rationale: one line, tied to industry + audience from requirements-{id}.md
```

Selection: attended → the human picks (approval gate); unattended → HX Vision Critic picks with
recorded rationale in `_workspace/_design-history.md`. The 3 unchosen directions stay in the
artifact — they are reusable proposals, not waste.

## Rule 3 — Design-diversity ledger (no repeats across projects)

Every committed direction is appended to `_workspace/_design-history.md` (and its token JSON to
the project). A new project's chosen direction must differ from the last 3 entries in at least
2 of {palette family, display typeface, layout_archetype}. Mechanically checked:
`node scripts/design-quality-check.js --tokens <tokens.json> --history <_design-history.json>`.

## Rule 4 — Imagery is a requirement, not a decoration (no text-walls)

- Every screen section gets an explicit imagery decision in the UX artifact: photo / illustration
  / inline SVG icon set / data visualization / CSS-drawn graphic / deliberate whitespace — and
  **"none" must be justified**, not silent.
- A UI page that renders with **zero visual elements** (no `<img>`, `<svg>`, `<picture>`, `<video>`,
  `<canvas>`, CSS `background-image`, or chart canvas) FAILS the design gate unless the spec
  declares the page text-only (e.g. terms of service). Mechanically checked by
  design-quality-check.js `--html <files>`.
- Asset honesty (C10): never fabricate "final" photos. Use, in order of preference:
  (1) real project assets from the 기획서/brand kit; (2) inline SVG icons/illustrations the
  Developer draws (always allowed, zero external deps); (3) clearly-marked dev placeholders
  (e.g. picsum.photos) with a `PLACEHOLDER-IMAGE` note in the spec's asset list for human
  replacement before production deploy — devops-deployer treats an unreplaced production
  placeholder as a deploy blocker.

## Rule 5 — Human-convenient beats impressive

Variety never overrides the HX floor: contrast AA, touch targets, keyboard/semantic access,
readable line lengths (45–75 chars), scannable hierarchy (one H1, purposeful H2s), visible
states (loading/empty/error/success). A striking direction that fails HX P0 is a FAIL —
`human-experience-standard.md` remains the gate; this standard adds distinctiveness ON TOP.

## Honest bound

These rules make sameness and text-walls detectable and force deliberate choices; they cannot
prove a design is *beautiful* — final aesthetic judgment stays with the human at the approval
gate (or HX Vision Critic as proxy), which is exactly where it belongs.
