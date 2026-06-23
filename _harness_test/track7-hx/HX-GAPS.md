# HX Harness — Deeper Considerations (Remaining Gaps)

## Fundamental problem: "passing the checklist ≠ what a human perceives as perfect"

The current HX gate only catches what is measurable (contrast ratio, semantic tags, presence of breakpoints).
But "is this screen easy to use / intuitive / beautiful" is not a measured value.
Even if every box is checked, it can still feel awkward in practice → risk of **checklist theater**.
Moreover, the judging entity is still the AI. The user's very thesis is "AI's 'perfect' ≠ a human's 'perfect'," yet the verification is again done by an AI.

## 8 identified gaps

| # | Gap | Why it is a problem | Proposal |
|---|------|-------------|------|
| G1 | **No actual rendering** | track7 only "read" the HTML and computed contrast; it never rendered in a real browser. Responsiveness/cross-browser/"actually visible" can only be known by rendering. Same kind as track4 GAP-1 (claiming without running) | Screenshots at 3 breakpoints via Claude Preview/Playwright → **vision-model visual critique** as evidence |
| G2 | **No real human feedback loop** | Everything is AI self-judgment. "A human actually uses it and judges" is missing | A human views the live preview, gives a rating/comment → record in `_hx-feedback.md` → iterate until approval |
| G3 | **Web bias** | Button colors, responsiveness, browsers assume web. Desktop/mobile-native/CLI have different HX | Make the HX standard platform-specific (stack-agnostic HX) |
| G4 | **i18n/RTL/locale/culture missing** | Cultural meaning of color, RTL, CJK fonts, translation-length breakage not reflected | Add multilingual/RTL/locale-accuracy items to HX |
| G5 | **Cross-screen consistency not enforced** | HX is per-feature → button styles can differ screen to screen | Project-level design-system consistency check (global) |
| G6 | **Perceived performance missing** | Loading speed/INP/CLS (layout shift) are also part of usability | Add a performance budget (perf budget) to HX |
| G7 | **Weak evidence for subjective items** | Readability/intuitiveness are easy to fake a PASS | Nielsen 10 heuristics evaluation + comparison baseline (A/B) + vision critique as evidence |
| G8 | **Vague P0 boundary** | Good UX needs auxiliary screens not in the spec (error/empty/confirm), which conflicts with P0 unauthorized addition | Rule: required HX auxiliary states are allowed; only new "features" are blocked — codify the boundary |

## Priority (most essential first)

1st **G1 actual rendering + G2 human feedback loop** — the heart of the user's thesis. Without these two, "human-centered" remains a slogan.
   - render → screenshot → (a) vision-model critique (b) human approval. Both adopted as evidence; human approval is final.
2nd G7 (heuristics+comparison), G5 (global consistency), G6 (performance).
3rd G3 (per-platform), G4 (i18n/RTL), G8 (boundary codification).

## Core conclusion
A checklist only guarantees the **floor**; it cannot create the **ceiling (a truly good experience)**.
The ceiling is reached only when (1) actual rendering is (2) viewed with vision, (3) a human makes the final judgment, and (4) it iterates until satisfaction.
The next upgrade should be an "HX Preview & Human-in-the-loop" loop.
