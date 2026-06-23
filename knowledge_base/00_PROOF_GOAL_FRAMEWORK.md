# Proof Goal Framework

## Core Principle

> **You must not forget the purpose of a proof while in the middle of proving it.**
>
> Before beginning hypothesis validation, the proof goal must be explicitly declared.
> Every subsequent analysis step must be validated for soundness against this goal.

---

## Phase 0: Proof Goal Declaration

**No analysis may begin without this step.**

### 0.1 The 4 Elements of a Proof Goal (Mandatory — All 4 Required)

```
PROOF GOAL DECLARATION
══════════════════════════════════════════════════════════

[1] What to Prove:
    → In one sentence, specific and measurable

[2] Acceptance Criteria:
    → What value/pattern counts as proven?
    → Criteria MUST be set before analysis (no post-hoc setting)

[3] Rejection Criteria:
    → What result causes the hypothesis to be rejected?
    → Must be falsifiable

[4] Out of Scope:
    → Even an interesting thing discovered by chance during analysis,
      if unrelated to this goal → split off into a separate study

══════════════════════════════════════════════════════════
```

### 0.2 Worked Example

```
PROOF GOAL: PG-001
Declaration Date: 2026-06-01
Declared by: Research Team

[1] What to Prove:
    "The token statistics of the Voynich Manuscript (TTR, entropy, word-final
    patterns) are closer to a classificatory reference corpus (catalogs,
    taxonomies) than to natural-language prose, demonstrated by 5 or more
    independent metrics."

[2] Acceptance Criteria (MUST meet ALL):
    □ TTR: Voynich > natural language, Voynich ≤ catalogs
    □ Entropy (H2): Voynich within 0.5 bits of catalogs
    □ word-final ratio: >90% (natural language is ~31%)
    □ Section vocabulary divergence: ≥20% (natural language is single-domain)
    □ Token family clustering: >7% (a simple cipher is ~0%)
    → All 5 met: "PARTIALLY SUPPORTED"
    → 2 or more additional met: "SUPPORTED"

[3] Rejection Criteria (ANY ONE triggers rejection):
    □ Voynich TTR statistically identical to natural language (p > 0.05)
    □ Entropy indistinguishable from randomly generated text
    □ Cross-section vocabulary divergence below 10%
    → If any one occurs: revise or reject the hypothesis

[4] Out of Scope (split off into separate studies):
    ✗ Interpreting the 'meaning' of the Voynich text
    ✗ Identifying it with a specific language (Arabic, Latin, etc.)
    ✗ Inferring the scribe's intent
    ✗ Semantic links between illustrations and text
    ✗ Estimating the date of production (rely on existing research)
```

---

## Phase 0.5: Goal Persistence Gate

**Must run before the start of every analysis step.**

```
┌─────────────────────────────────────────────────────┐
│  PROOF GOAL CHECK (mandatory at start of each step)  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Q1: Does this analysis contribute to the goal?     │
│      YES → continue                                 │
│      NO  → STOP. Go below.                           │
│                                                     │
│  Q2 (if NO): Why is this analysis needed?           │
│      a) Premise data for reaching the goal → allow  │
│      b) Interesting incidental find → split to file │
│      c) Following an external researcher's           │
│         conclusion → forbidden                       │
│                                                     │
│  Q3: Has the current proof goal changed?            │
│      YES → return to Phase 0 and re-declare         │
│             (keep prior results, reset goal only)    │
│      NO  → return to the original goal              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Drift Warning Signs

If any of the following occurs, **immediately run the Proof Goal Check**:

| Sign | Description |
|------|------|
| 🔴 3 analyses in a row with no mention of the goal | Goal-detached analysis is accumulating |
| 🔴 "This is interesting too" appears | Signal that scope expansion is starting |
| 🔴 Citing an external researcher's conclusion as "fact" | Hypothesis contamination is starting |
| 🔴 "Maybe this text is actually X" | Signal that the proof target is changing |
| 🟡 Adding a new comparison corpus | Justification check needed |
| 🟡 When analysis scope grows beyond the original | Re-review needed |

---

## Phases 1–5 Integration: Mandatory Goal Reference

In the existing Phase 1–5 analysis, **each step must explicitly record** the following:

```
[PROOF GOAL REFERENCE: PG-001]
This analysis's contribution to the proof goal: High / Medium / Low / Out of Scope
Mode of contribution: TTR measurement to verify acceptance criterion [2]
Effect of result on acceptance criteria: □ Met / □ Not met / □ Partially met
```

---

## Drift Prevention Rules

### Rule 1: Goal Declaration First
No analysis may begin without a Proof Goal Declaration (PG).

### Rule 2: Per-Step Reference Obligation
Every analysis result document must include a `PROOF GOAL REFERENCE`.

### Rule 3: Out-of-Scope Separation
Out-of-scope findings are not deleted; they are **preserved in a separate file (side-findings.md)**.
These findings may become the Proof Goal of the next study.

### Rule 4: Goal-Change Protocol
When a situation arises requiring the goal to change:
1. **Finalize** the analysis under the existing goal (reach a conclusion)
2. Declare a new Proof Goal with a new ID (PG-002, PG-003...)
3. Existing analysis results may be **used as data** in the new PG

### Rule 5: Handling External Research
Do not allow an external researcher's conclusions to change our Proof Goal.
→ External research is used only as a **comparison baseline, counterexample search, or methodology reference**.

---

## Goal Persistence Checklist (Mandatory at Each Analysis Stage)

```
Before starting analysis:
  □ Is the current Proof Goal ID stated in the document?
  □ Does this analysis directly verify one of the acceptance/rejection criteria?
  □ Does it avoid encroaching on out-of-scope items?
  □ Is it not taking an external researcher's conclusion as a premise?

After completing analysis:
  □ How did the result contribute to the proof goal? (explicit record)
  □ How many acceptance criteria are met/unmet?
  □ Does the next analysis step contribute to the same goal?
  □ Did any drift signals occur?
```

---

## Proof Goal Status Dashboard

Update after each analysis cycle completes:

```
PROOF GOAL STATUS: PG-001
══════════════════════════════════

Goal: Demonstrate via 5+ metrics that the Voynich structure is more similar to a reference corpus
Current state: CANDIDATE → PARTIALLY SUPPORTED → SUPPORTED → REJECTED

Acceptance criteria progress:
  □ TTR comparison:            [incomplete]
  □ Entropy (H2) comparison:   [incomplete]
  □ word-final ratio:          ✅ PASS (96.6%)
  □ Section vocabulary divergence: ✅ PASS (23%)
  □ Token family clustering:   [incomplete]

Rejection criteria triggered:
  → None (may continue)

Goal-drift warnings:
  → None

Next required analyses:
  → TTR measurement and corpus comparison (acceptance criterion 1)
  → Entropy measurement and corpus comparison (acceptance criterion 2)

══════════════════════════════════
```

---

## Where This Framework Fits

```
Full analysis process flow:

Phase 0:   Proof Goal Declaration                  ← this document
           ↓ [cannot proceed without a goal]
Phase 0.5: Goal Persistence Gate (repeat each step) ← this document
           ↓ [check every step]
Phase 1:   Hypothesis clarification → 00_HYPOTHESIS_VALIDATION_PROCEDURE.md
Phase 2:   Evidence collection      → 00_HYPOTHESIS_VALIDATION_PROCEDURE.md
Phase 3:   Statistical validation   → 00_HYPOTHESIS_VALIDATION_PROCEDURE.md
Phase 4:   Evidence evaluation      → 00_HYPOTHESIS_VALIDATION_PROCEDURE.md
Phase 5:   Conclusion               → 00_HYPOTHESIS_VALIDATION_PROCEDURE.md
```

**This framework runs before Phases 1–5 and oversees all of Phases 1–5.**

---

## Summary: How Not to Forget the Purpose of a Proof

1. **Write the goal as 4 elements up front** — what, when it succeeds, when it fails, what you will not do
2. **Reference the goal at every analysis step** — "Does this contribute to the goal?"
3. **Recognize drift signals** — interesting finds, external research conclusions, scope expansion
4. **Don't delete out-of-scope findings; separate them** — seeds for the next study
5. **If the goal must change, declare a new PG** — keep existing results

> **Principle: The proof goal drives the analysis. The analysis must not change the goal.**
