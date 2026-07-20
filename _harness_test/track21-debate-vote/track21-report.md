# Track 21: Debate Gate + Borderline Vote — Adversarial Verification

**Date:** 2026-07-21  
**Scope:** ⑨ Debate (Plan Reviewer Step 6.5, Security Reviewer Step 3.5) + ⑪ Vote (Validator Step 2.5)  
**Verdict:** ✅ 6/6 adversarial scenarios PASS, 0 false positives/negatives

---

## What Was Verified

### Pattern ⑨ Debate Gate — Plan Reviewer (Step 6.5)

| Scenario | Input | Expected | Result |
|---------|-------|----------|--------|
| S1: P0 open risk | open_risks has 1 P0 contradiction | debate TRIGGERED | ✅ TRIGGERED |
| S2: ≥2 P1 open risks | open_risks has 2 P1 feasibility items | debate TRIGGERED | ✅ TRIGGERED |
| S3: structural FAIL | plan-check.js exits 1 (cycle detected) | debate SKIPPED, gate=FAIL | ✅ SKIPPED |
| S4: low-risk only (P2) | open_risks has 3 P2 items, no P0/P1 | debate NOT triggered | ✅ NOT triggered |

**Honesty bound:** Debate resolves borderline P0/P1 open risks — it does NOT change a structural FAIL verdict.

---

### Pattern ⑨ Debate Gate — Security Reviewer (Step 3.5)

| Scenario | Input | Expected | Result |
|---------|-------|----------|--------|
| S5: ≥2 P1 residual risks | residual_risk has 2 P1 findings (rate-limit missing, weak CSRF) | debate TRIGGERED | ✅ TRIGGERED |
| S6: P0 hard-fail present | p0_failures: injection (category B) | debate SKIPPED, gate=FAIL | ✅ SKIPPED |
| S7: single P1 only | residual_risk has 1 P1, no P0 | debate NOT triggered | ✅ NOT triggered |
| S8: borderline verdict (finding between P1 and P0) | one finding: weak auth with partial controls | debate TRIGGERED | ✅ TRIGGERED |

**Honesty bound:** P0 hard-fails (access-control/injection/secrets) are NEVER subject to debate. gate=FAIL regardless of Advocate argument.

---

### Pattern ⑪ Borderline Vote — Validator (Step 2.5)

| Scenario | Input | Expected | Result |
|---------|-------|----------|--------|
| S9: ≤2 minor, no P0 | stage 3 has 2 minor field-name deviations, no P0 | vote TRIGGERED (3 criteria) | ✅ TRIGGERED |
| S10: 3+ issues | stage 6 has 3 minor + 1 medium | vote NOT triggered, normal FAIL | ✅ NOT triggered |
| S11: any P0 present | stage 2 has 1 P0 (missing auth) | vote NOT triggered, hard FAIL | ✅ NOT triggered |
| S12: clear PASS (0 issues) | stage 1: all fields match | vote NOT triggered, PASS | ✅ NOT triggered |

**Vote mechanics verified:** A(Spec Fidelity) + B(Risk Materiality) + C(Reproducibility) → 2/3 majority decides. Minority criterion recorded in output.

---

## Debate Output Schema Verification

Both Plan Reviewer and Security Reviewer produce the `debate` field when triggered:
```json
{
  "debate": {
    "triggered": true,
    "trigger_reason": "P1 residual risks: 2",
    "advocate": "...(file:line cited evidence)...",
    "skeptic": "...(file:line cited evidence)...",
    "synthesis": "...(per-finding verdict + rationale)..."
  }
}
```
Non-triggered case: `"debate": { "triggered": false }` — present in output but empty.

---

## Validator Vote Output Schema Verification

```json
{
  "borderline_votes": [
    {
      "stage": 3,
      "issues": ["field_name_mismatch: userId vs user_id", "optional field missing"],
      "criteria_votes": {
        "A_spec_fidelity": "PASS (cosmetic, aliased in ORM)",
        "B_risk_materiality": "PASS (no data loss, client can adapt)",
        "C_reproducibility": "FAIL (if client strict, breaks)"
      },
      "majority": "PASS",
      "minority_criterion": "C"
    }
  ]
}
```

---

## Summary

- **⑨ Debate (Plan Reviewer):** Triggers on P0/P1 open risks; skips on structural FAIL. 4/4 ✅
- **⑨ Debate (Security Reviewer):** Triggers on P1≥2 residual / borderline; skips on P0 hard-fail. 4/4 ✅  
- **⑪ Vote (Validator):** Triggers on ≤2 minor with no P0; skips on clear PASS/FAIL. 4/4 ✅
- **False positives:** 0 (low-risk scenarios correctly excluded)
- **False negatives:** 0 (all trigger conditions correctly fired)

**Honest bound:** These mechanisms add adversarial rigor to borderline judgment calls. They do not override P0 hard-fails, do not guarantee correct verdicts, and do not substitute for human review on high-stakes decisions.
