# Track 25 — Design Excellence gate adversarial verification

The exact user-reported failure modes, made mechanical: (1) always the same style,
(2) always washed-out pastel colors, (3) text-only pages with no imagery.

| Scenario | Input | Expected | Actual | Match |
|---|---|---|---|---|
| A: pastel default + text-wall | `tokens-pastel.json` (#C9BFD8 accent, sat 24%, no muted declaration) + `page-textwall.html` (0 visual elements) | FAIL both rules, named | exit 1: [washed-out-palette] sat 24% < 50%, [text-wall] zero visual elements | ✅ |
| B: bold palette but house-style repeat | `tokens-bold.json` sharing palette_family+display_font with the last history entry (1/3 axes differ) | FAIL house-style-repeat | exit 1: "differs in only 1/3 axes — must differ in ≥2" | ✅ |
| C: intentional muted + distinct + visual page | `tokens-muted-ok.json` (declared `"muted":"intentional"` + rationale, 3/3 axes differ) + `page-visual.html` (svg+img) | PASS — muted-with-reason is legitimate, not banned | exit 0 clean | ✅ |
| D: unit tests | 12 cases (HSL math, pastel flag, vivid pass, muted-intentional pass, missing accent, repeat fail, 2-axis pass, 3-entry window, text-wall, inline-SVG counts, background-image counts, declared text-only exempt) | 12/12 | jest 12/12 | ✅ |

0 false positives (bold/distinct/intentional-muted/visual all passed; declared text-only exempt),
0 false negatives (pastel-by-default, 1-axis repeat, and imageless page all caught and named).

**Verdict:** PASS — sameness, blandness-by-default, and text-walls are now mechanically
detectable; deliberate muted palettes and declared text-only pages are not punished.

**Honest bound:** the gate catches the three *measurable* failure modes. It cannot judge beauty
or fit — the 4-direction proposal + human pick (design-excellence-standard Rule 2) is where
aesthetic judgment lives, and the HX standard remains the usability floor.
