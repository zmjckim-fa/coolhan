# Scientific Verification Standards — Verification Domain KB

> **Purpose:** Structurally prevent CoolHan's green light (tests pass / deploy ready) from being misread as "the hypothesis is true."
> Audit conclusion: engineering pass is a **precondition** for a scientific verdict, not a **substitute** for it.

## 0. Two Kinds of Validity — Never Conflate

| | Engineering Validity | Scientific Validity |
|---|---|---|
| Guaranteed proposition | "Code is implemented per spec, passes tests, and is committed reproducibly" | "The hypothesis matches reality" |
| CoolHan can judge | ✅ Yes (validator/qa/e2e) | ❌ No |
| Meaning of green light | "The pipeline works as specified" | (no meaning — separate responsibility) |
| Responsible party | The harness | Researcher + auditor |

**Forbidden expressions (P0):** Do not label an engine pass as "proven / established-grade / STRONG+ / match 0.95 = true." This is the tautology trap.
**Allowed expression:** "Engine pass = you may now **trust and interpret** this result (reproducible, traceable)." Interpretation/judgment is a separate step.

## 1. Scientific Acceptance Criteria (Acceptance Criteria as Code) — Write These Literally Into the Spec

The acceptance criteria of a hypothesis-validation spec must be **implemented as code, executed, and produce output files** to PASS. If they exist only as prose, they are unmet.

1. **Competing hypotheses scored simultaneously (Competing generators)**
   - No scoring the main hypothesis alone. Score at least 2 alternative/null hypotheses simultaneously on the **same metrics and same data**.
   - Output: per-hypothesis score table + relative comparison. The main hypothesis must be significantly superior to alternatives to be meaningful.
2. **Pre-registered falsification**
   - **Before** measuring, fix in a file (timestamp/commit) the threshold/direction such that "if this value appears, the hypothesis is rejected." No changing the criteria after measurement (blocks p-hacking).
3. **Negative control + shuffle + held-out**
   - Confirm the effect **disappears** on label/order-shuffled data (if it survives, it's an artifact).
   - Confirm the same result reproduces with some data removed (held-out).
4. **Multiple-comparison correction**
   - When running many tests, a correction function (Bonferroni/FDR, etc.) must exist and be applied. Output both pre- and post-correction values.
5. **End-to-end provenance (data→code→output)**
   - Every number must trace from raw data → computation code → output file. **No narrative numbers (numbers produced by prose).**
   - Record the input hash + code commit + random seed in the output file.
6. **Tautology/circularity ban**
   - No structure where the acceptance criterion is always true by definition (e.g., scoring a generator built from the hypothesis with that same hypothesis). Use independent metrics.

## 2. Verification Spec Template — Write One per Hypothesis

```yaml
verification_spec_id: {id}
hypothesis: "{proposition to verify — in falsifiable form}"
competing_hypotheses:
  - null: "{null hypothesis}"
  - alt1: "{competing hypothesis 1}"
  - alt2: "{competing hypothesis 2}"
metrics:
  - name: "{metric}"
    independent_of_hypothesis: true   # proves it is not a tautology
falsification:                         # fixed before measurement
  - condition: "{reject if this value/direction}"
    registered_at: "{commit/time}"
controls:
  negative_control: "{shuffle/random-label procedure}"
  held_out: "{split ratio / procedure}"
multiple_comparison: "bonferroni | fdr | none(reason)"
provenance:
  raw_data: "{path + hash}"
  code: "{script path}"
  outputs: "{output file path}"
  seed: {random seed}
acceptance:                            # CoolHan only enforces "whether it was implemented/executed"
  - "Competing-hypotheses scoring code executed + score table output"
  - "Falsification-condition pre-registration file exists"
  - "Shuffle/held-out function executed + results output"
  - "Multiple-comparison correction applied + pre/post output"
  - "Every number traced data→code→output (0 narrative numbers)"
interpretation_owner: "researcher + auditor"   # not CoolHan
```

## 3. How to Use It in the CoolHan Harness

- **CoolHan = plumbing, not authority.** If the above acceptance criteria are put in the spec, validator/qa only enforce "whether they were implemented, executed, and committed."
- The validator / research orchestrator must output the verdict in **two separate layers**:
  - `engineering_status`: PASS/FAIL (code = spec, reproducible)
  - `scientific_interpretation`: "interpretation deferred — researcher/auditor judgment" (the harness must not assert true/false)
- The **scientific validity of the acceptance criteria themselves** is the responsibility of the researcher + auditor. The harness does not guarantee that validity (state this in the document).

## 4. Scope of Application
- coolhan-research-orchestrator (hypothesis-validator) — uses this standard as a first-class driving document.
- Development harness validator/e2e — enforce an "engineering PASS ≠ scientific truth" caption on research-grade deliverables.
