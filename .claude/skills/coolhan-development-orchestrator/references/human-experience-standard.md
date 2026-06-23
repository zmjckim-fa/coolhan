# Human-Experience (HX) Standard — Human-Centered Completeness Criteria

> **Core premise:** "The source runs well ≠ it is perfect for people to use." Programs are used by people.
> Reflect this standard as a first-class requirement from the very first line of code. Inject it into early design and implementation, not as post-hoc verification.
> Linked with the existing `knowledge_base/00_DESIGN_PARAMETERIZATION_SYSTEM.md` (design profiles/colors/typography).

## Scope
- Referenced throughout all forward-development stages (intent→spec→dev→validate→e2e).
- HX is mandatory for features with a UI. For pure API/batch, the applicable items (error messages, security, modularity, integrity) still apply.

## HX Checklist (gate criteria)

Each item is proven satisfied with **evidence** (file:line / screenshot / measured value). Without evidence, it is unsatisfied. If even one P0 item (marked ★ below) is unsatisfied, **FAIL even if the code works**.

### 1. Input & Forms (Form UX) ★
- Input fields: only what is truly needed, with logical grouping.
- Order & placement: natural progression order (top→bottom, left→right), related items adjacent.
- Input method: controls suited to the type (date=date picker, single choice=select/radio, multiple=checkbox).
- Validation: inline real-time validation + validation before submit. Required markers (*) clear.
- **Error notification + resolution ★**: pair the problem with the solution, e.g. "The email format is invalid → enter it in the name@example.com format." Errors appear next to the relevant field.
- Autocomplete/placeholder/labels: labels always visible (do not substitute placeholders for labels).

### 2. Accessibility (WCAG 2.1 AA) ★
- Semantic markup: `<button>`, `<label for>`, `<nav>`, `<main>`, heading hierarchy (h1→h2…).
- Keyboard-only operation possible, focus indication (focus ring) maintained.
- Color contrast: body text 4.5:1, large text 3:1 or higher.
- Image alt, form label association, aria attributes (when needed).
- Do not convey information by color alone (pair color with icon/text).

### 3. Responsive ★
- Breakpoints: mobile (~640) / tablet (~1024) / desktop (1025~).
- No horizontal scroll, touch targets ≥44px, viewport meta.
- No breakage across various browsers (Chrome/Firefox/Safari/Edge).
- **Verification method (important):** "shrinking the PC browser window" differs from a real mobile device (engine WebKit≠Blink, DPR·UA·touch·scrollbar width·iOS 100vh). Always verify with **device emulation** — `scripts/hx_render.py` renders with WebKit(iOS)+Chromium(Android) engines + real device profiles (UA/DPR/touch).
  - Honesty about limits: emulation is not 100% the real device either. For high-risk/commercial pre-release, a real device or a cloud device farm (BrowserStack, etc.) is recommended — in that case mark it `confidence: emulated`.

### 4. Readability & Typography (Readability)
- Font size: body text ≥16px, hierarchy (title>subtitle>body>caption) clear.
- Line spacing 1.4~1.6, appropriate line length (45~75 characters), consistent placement & spacing.
- Sufficient color/background contrast, emphasis follows consistent weight/color rules.

### 5. Buttons & Actions (Affordance)
- Distinguish button types: primary (one main action)/secondary/destructive (dangerous=red+confirm).
- States: visual distinction for hover/active/disabled/loading.
- Labels are verb+object ("Save", "Cancel order") — avoid the ambiguous "OK".

### 6. States & Feedback (States)
- Loading state (spinner/skeleton), empty state (empty: guidance+next action), error state (resolution), success feedback (toast).
- Irreversible actions have a confirmation step.

### 7. Progression & Flow (Flow)
- Systematic steps (multi-step uses a progress indicator/stepper), back-navigation & exit protection.
- User journey reaches the goal in minimal clicks.

### 8. Security UX (Security)
- Mask sensitive information, password-strength guidance, auto-logout notice.
- Do not expose internal information in error messages (hide stack/queries), unauthorized-action blocking UX.
- (Code) input validation/escaping (XSS/SQLi), HTTPS, CSRF.

### 9. Feature Modularity (Modularity) ★
- Single responsibility for components/functions, separate reusable units, design tokens (color/font/spacing) parameterized (no hardcoding).
- Separation of screen-logic-data layers.

### 10. Source Integrity (Integrity)
- No dead code/console logs/leftover TODOs, consistent naming/formatting, type safety.
- No missing error handling (no empty catch).

## Design Tokens (linked with parameterization)
Define color/font/spacing/radius/shadow as tokens → make them swappable with the profiles (Elegant/Fresh/Trustworthy/Vibrant) in `00_DESIGN_PARAMETERIZATION_SYSTEM.md`. No hardcoded color values.

## HX Verdict Format (for validator/e2e)
```json
{
  "hx_check": {
    "form_ux": {"pass": true, "evidence": "..."},
    "accessibility": {"pass": false, "evidence": "contrast 3.2:1 < 4.5", "fix": "..."},
    "responsive": {"pass": true, "evidence": "640/1024/1025 captures"},
    "readability": {"pass": true},
    "buttons": {"pass": true},
    "states": {"pass": true},
    "flow": {"pass": true},
    "security_ux": {"pass": true},
    "modularity": {"pass": true},
    "integrity": {"pass": true}
  },
  "p0_items": ["form_ux","accessibility","responsive","modularity"],
  "verdict": "FAIL",
  "reason": "accessibility(P0) unsatisfied — FAIL even though the code works"
}
```
> A P0 item (★) unsatisfied = overall FAIL. A non-P0 item unsatisfied = warning (remedy in the next unit).
