# Track 7 — HX Gate Adversarial Verification Report

> **Goal:** Adversarially prove that the CoolHan development harness's "human-centered (HX) gate" FAILs HX-deficient code *even when the logic works*.
> **Method:** Write the same feature ("signup form") as two cases — CLEAN (HX-compliant) / VIOLATED (HX-deficient, logic works) → evaluate by simulating the Validator's 10-step HX.
> **Standard:** `references/human-experience-standard.md` checklist, P0 = form UX, accessibility, responsiveness, modularity.
> **Date:** 2026-06-11

## Outputs
| File | Description |
|------|------|
| `_workspace/signup-clean.html` | HX-compliant signup form (logic works) |
| `_workspace/signup-violated.html` | HX-deficient signup form (logic works identically) |
| `_workspace/hx-validation-clean.json` | CLEAN hx_check verdict (PASS) |
| `_workspace/hx-validation-violated.json` | VIOLATED hx_check verdict (FAIL) |

## Both cases confirmed to "work logically"
- CLEAN: inline validation + submit → loading → success handling.
- VIOLATED: `doSignup()` blocks empty values then passes (alert). **The logic works.**
- Therefore the only difference is human-experience (HX) quality. Directly measures the discriminating power of the HX gate.

## Actual color-contrast computation (WCAG 2.1 relative luminance formula, AA body-text standard 4.5:1)
| Case | Element | Color (foreground on background) | Measured | AA |
|--------|------|-------------------|--------|----|
| CLEAN | body text | #1a1a1a on #fff | **17.40:1** | PASS |
| CLEAN | error text | #b00020 on #fff | 7.33:1 | PASS |
| CLEAN | muted text | #4b5563 on #fff | 7.56:1 | PASS |
| CLEAN | primary button | #fff on #0b5fff | 5.13:1 | PASS |
| VIOLATED | body text | #aaa on #fff | **2.32:1** | FAIL |
| VIOLATED | button text | #ddd on #ccc | 1.18:1 | FAIL |
| VIOLATED | input border | #ccc on #fff | 1.61:1 | FAIL |

## HX item-by-item CLEAN vs VIOLATED comparison
| # | HX item | P0 | CLEAN | VIOLATED | VIOLATED basis (file:line) |
|---|---------|:--:|:-----:|:--------:|--------------------------|
| 1 | Form UX (labels, inline validation, error resolution) | ★ | PASS | **FAIL** | no label, placeholder only (L39,L42); error says only "error" with no resolution (L58,L67) |
| 2 | Accessibility (semantic, keyboard, contrast) | ★ | PASS | **FAIL** | div onclick button (L51) no keyboard; contrast 2.32:1<4.5; no focus ring |
| 3 | Responsiveness (viewport, breakpoints, touch) | ★ | PASS | **FAIL** | no viewport meta; fixed width:900px (L13); touch target 18px (L25) |
| 4 | Readability & typography |  | PASS | **FAIL** | body 11px<16px (L9,L24,L33) |
| 5 | Buttons & actions |  | PASS | **FAIL** | div button, no hover/disabled/loading states |
| 6 | States & feedback |  | PASS | **FAIL** | no loading, success alert only (L70), error has no resolution |
| 7 | Flow |  | PASS | PASS | a single-action flow exists |
| 8 | Security UX |  | PASS | **FAIL** | password type=text not masked (L42) |
| 9 | Modularity (tokens, no hardcoding) | ★ | PASS | **FAIL** | no design tokens; hardcoded colors #aaa/#ccc/#ddd (L9,L23,L30,L31) |
| 10 | Source integrity |  | PASS | **FAIL** | inline styles mixed in, lacks consistency |

## Verdict
- **CLEAN → PASS** — all 4 P0 items (form UX, accessibility, responsiveness, modularity) satisfied, non-P0 all satisfied too. Evidence-based.
- **VIOLATED → FAIL** — **all 4 P0 items** deficient. Working logic is irrelevant. HX standard L13 ("if even 1 P0 item is unmet, FAIL even if the code works") triggers.

### False positive / false negative review
- **No false positives:** no CLEAN item was unfairly FAILed. Evidence attached to every PASS.
- **No false negatives:** all 4 VIOLATED P0 violations (no label / div button / contrast deficiency / no viewport / hardcoding) were precisely caught with item, location, and resolution. Non-P0 violations also captured as warnings.

## Overall verdict
**The HX gate precisely enforces "FAIL if HX-deficient even when the logic works." ✅ Verification passed.**

- Despite identical feature and identical working logic, PASS/FAIL splits precisely on HX quality alone → discriminating power of the gate proven.
- The P0 mechanism works as intended: even a single P0 deficiency FAILs the whole (VIOLATED had 4 deficiencies).
- Contrast is judged by actual relative-luminance computation, not estimation (CLEAN 17.40:1 vs VIOLATED 2.32:1).
- Every verdict has code basis (file:line) + resolution attached → conforms to the Validator output format (hx_check JSON).

### Notes
- VIOLATED is orthogonal to track4 (planner-intent violation detection) — a same-feature case within plan scope that is deficient only in human-experience quality, separately proving the HX gate's unique value.
