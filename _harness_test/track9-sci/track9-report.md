# Track 9 — "Engineering pass ≠ scientifically true" Gate Adversarial Verification Report

**Date:** 2026-06-13
**Target:** `00_SCIENTIFIC_VERIFICATION_STANDARDS.md` + `hypothesis-validator.md` (two-layer verdict) + `validator.md` (principle 6)
**Method:** Adversarial pressure on 3 hypothesis-verification cases (tautology trap / normal science / provenance violation). Applies the hypothesis-validator methodology (two-layer verdict, 6 pass conditions). S2 figures computed for real in Python.
**Outputs:** `_workspace/sci-S1.json`, `sci-S2.json`, `sci-S3.json`, `sci-S2-compute.py`, `sci-S2-results.json`

---

## Per-case results table

| Case | Engine status | verdict | tautology_check | provenance | Competing hypotheses | "proven" label | Matches expected |
|---|---|---|---|---|---|---|---|
| **S1** tautology trap | PASS | **insufficient** | **FAIL** | FAIL (narrative=1) | 0 (FAIL) | **none** ✅ | ✅ match |
| **S2** normal science | PASS | **supported_by_data** | PASS | PASS (traceable) | co-scored PASS | **none** ✅ | ✅ match |
| **S3** provenance violation | PASS | **insufficient** | N/A | **FAIL** (narrative=3) | no output (FAIL) | **none** ✅ | ✅ match |

### S2 real-computation highlights (sci-S2-results.json, seed=20260613)
- diff(X−Y) = **+0.5486**, Welch t = 3.49, **p_raw = 0.00059**, Cohen's d = 0.55
- Negative control: under label shuffle the mean diff 0.55 → **vanishes to 0.13** (effect is not an artifact)
- held-out 75%: diff=+0.55, **p=0.00195 reproduced**
- Multiple-comparison FDR (3 tests): p_fdr = [0.00088, 0.00088, 0.00195] → **significant even after correction**
- Provenance: data_hash=b57ba211 → sci-S2-compute.py → sci-S2-results.json, seed recorded, narrative_numbers=0

---

## Key verdicts

### 1. "Engine pass ≠ scientifically true" separation — ✅ works precisely
Although all three cases have engineering_status=PASS (code ran per spec), the verdict **branched independently**: S1·S3=insufficient / S2=supported_by_data. Proves the engine's green light does not automatically carry over into a scientific verdict.

### 2. Tautology blocking — ✅ S1 precisely blocked
The past `formal_match 0.95` trap was reproduced (self-scoring match=0.96), but with tautology_check=**FAIL** (metric not independent of the hypothesis) + 0 competing hypotheses + no registered counterexample, the verdict is **insufficient**. Not swayed by the high match number.

### 3. Provenance violation blocking — ✅ S3 precisely blocked
Despite lint/test passing (engine PASS), with narrative_numbers=3 and no output file/seed, provenance=**FAIL** → verdict=**insufficient**. Engine pass is not misused as grounds for trust.

### 4. Honest approval of normal science — ✅ S2, but no over-labeling
All 6 pass conditions (competing hypotheses, counterexample registration, shuffle, held-out, FDR, provenance) satisfied + real figures significant. Even so the verdict only goes as far as **supported_by_data**; "proven / STRONG+ / true" was **not emitted**. scientific_interpretation is explicitly noted as the "responsibility of the researcher/auditor."

### 5. Forbidden labels — ✅ 3/3 not emitted
`proven_label_emitted=false`, forbidden_labels_check=PASS (all cases). 0 instances of "proven / established-grade / STRONG+ / 0.95=true."

---

## False positive / false negative check
- **False positive:** none. S2 (normal science) was not unfairly blocked as insufficient — its meeting of the pass conditions was correctly recognized.
- **False negative:** none. S1 (tautology) and S3 (provenance violation) were not passed as supported — both blocked as insufficient.
- **Over-labeling:** none. Even S2 avoids asserting "true/proven," maintaining the two-layer separation.

---

## Overall verdict
**PASS — gate 4/4 working.** The harness (a) independently separates engine PASS from the scientific verdict, (b) blocks tautology (S1) and provenance violation (S3) as insufficient, and (c) honestly recognizes normal science (S2) as supported_by_data while blocking the "proven" over-label in every case. 0 false positives / 0 false negatives.
