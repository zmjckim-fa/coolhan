# 가설 검증 절차 (Hypothesis Validation Framework)

## 개요
AI 기반 데이터 분석에서 가설을 체계적으로 검증하기 위한 5단계 프레임워크.

---

## Phase 1: 가설 명확화 (Hypothesis Specification)

### 1.1 명시적 가설 진술
가설은 다음을 만족해야 함:
1. **검증 가능성** (Testability): 거짓일 수 있어야 함
2. **명확성** (Clarity): 용어가 정의되어야 함  
3. **측정 가능성** (Measurability): 수치로 표현 가능해야 함

**나쁜 예:**
```
❌ "Voynich is mysterious"
❌ "The text is meaningful"
❌ "The manuscript is organized"
```

**좋은 예:**
```
✅ "Voynich token word-final characters are constrained to {y,r,l,n,s,o,m,k}
    with >95% consistency across folios"
    
✅ "Token distribution differs significantly between Botanical and Herbal 
    sections (p < 0.05)"
    
✅ "Token family clustering (edit distance ≤2) accounts for >70% of 
    repeated tokens"
```

### 1.2 예측 가능한 결과 정의
각 가설에 대해 다음을 정의:

```
HYPOTHESIS: H1
Claim: "Voynich encodes taxonomic/reference system"

Prediction 1: Token families should show systematic variation
  If TRUE: Same token root + different suffixes (qo-, qok-, qoke-)
  If FALSE: No systematic family structure

Prediction 2: Section-specific vocabulary should be strong
  If TRUE: Botanical section has unique high-frequency tokens
  If FALSE: Token distribution uniform across sections

Prediction 3: Label-like structure (short, repeated tokens)
  If TRUE: Average token length 4-6 chars, low TTR
  If FALSE: Variable length, natural language TTR

Prediction 4: Comparison with catalogs should show similarity
  If TRUE: Voynich metrics closer to catalog than English
  If FALSE: Voynich closer to natural language
```

### 1.3 검증 불가능성 확인
다음은 **검증 불가능**하므로 제거:
```
❌ "The author intended X"           → 의도는 검증 불가능
❌ "This means Y"                    → 의미는 추가 증거 필요
❌ "It could be Z"                   → "could" = 말그대로 추측일 뿐
❌ "Someone knows the answer"        → 외부 지식에 의존
```

---

## Phase 2: 증거 수집 (Evidence Collection)

### 2.1 데이터 획득
```
Required Data:
  □ EVA transcription (from authoritative source)
  □ Folio metadata (section, Currier A/B, scribe hand)
  □ Image metadata (Yale Beinecke image URLs, resolution)
  □ Image-folio mapping (2002046_1.jpg ↔ f1r verification)
  □ Comparison corpora (English, botanical, catalog, cipher)

Source Quality:
  ⭐⭐⭐⭐⭐ Primary: Takahashi EVA, Yale Beinecke MS 408
  ⭐⭐⭐⭐  Secondary: Landini-Stolfi interlinear file
  ⭐⭐⭐   Tertiary: Published research summaries
  ⭐⭐    Quaternary: Blog posts, unpublished notes
```

### 2.2 표본 크기 및 신뢰도
```
For Voynich corpus:
  Sample: 112 folios (f1r-f112v) ~ all known surviving folios
  Confidence: 95% (population = full original manuscript)
  
For token frequency:
  Total tokens: 7,063
  Top-10 tokens: 172, 116, 92, 75, ... 
  Min occurrence for "frequent": 5+ folios
  
For statistical tests:
  Large sample (n>30): Use parametric tests
  Expected frequency >5: Use χ² test
  If violated: Use Fisher exact test

Power analysis:
  Minimum detectable effect size (Cohen's d):
  Token frequency difference: 0.5 SD
  Power: 0.80 (80% probability of detecting effect if real)
```

### 2.3 방법론 투명성
```
Document everything:
  ☐ Data source (URL, date accessed, version)
  ☐ Preprocessing steps (filtering, normalization)
  ☐ Missing data handling (how to treat damaged folios?)
  ☐ Statistical tests used (and why that specific test)
  ☐ Multiple comparison correction (Bonferroni? FDR?)
  ☐ Sensitivity analysis (results change if threshold changes?)
  ☐ Code version (Git commit hash for reproducibility)
```

---

## Phase 3: 통계적 검증 (Statistical Validation)

### 3.1 기술 통계 (Descriptive Statistics)

```
REQUIRED FOR EVERY ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Central Tendency
   Metric: Mean, Median, Mode
   Example: "Mean token length = 5.2 (SD=1.8, Median=5)"

2. Dispersion
   Metric: Std Dev, IQR, Range
   Example: "Token frequency: min=1, max=172, IQR=8-21"

3. Distribution Shape
   Metric: Skewness, Kurtosis
   Test: Shapiro-Wilk (normality)
   Example: "Token frequency is right-skewed (γ₁=2.3, not normal)"

4. Frequency Distribution
   Visualize: Histogram, Q-Q plot
   Fit test: Does Zipfian fit apply?
```

### 3.2 가설 검정 (Hypothesis Testing)

**Critical Rule:** 선택 방식을 명시해야 함.

```
Choosing Statistical Test:
═════════════════════════════════════════════

Question: Do token frequencies differ between sections?

Step 1: Check assumptions
  □ Independence? Yes (tokens in different sections)
  □ Sample size? Yes (n=7,063)
  □ Normality? No (frequency distribution is skewed)
  
Step 2: Select appropriate test
  Not normal → Use non-parametric test
  Multiple groups (6 sections) → Use Kruskal-Wallis test
  (not t-test, not ANOVA)
  
Step 3: Run test
  H0: Token frequencies are equal across sections
  H1: Token frequencies differ across sections
  
  Result: H = 234.5, p < 0.001
  
Step 4: Report effect size
  χ² = 156.2 (not just p-value!)
  Cramér's V = 0.18 (small effect size)
  
Interpretation: "Statistically significant differences exist (p<0.001)
                but effect size is small (V=0.18)"
```

### 3.3 신뢰도 평가 (Confidence Assessment)

```
For each finding, assign:

CONFIDENCE LEVEL:
  ⭐⭐⭐⭐⭐ Very High: 
    - Large effect (d>0.8)
    - p < 0.001
    - Multiple independent replications
    - Robust to sensitivity tests
    
  ⭐⭐⭐⭐ High:
    - Moderate effect (0.5 < d < 0.8)
    - p < 0.01
    - Cross-validated
    
  ⭐⭐⭐ Medium:
    - Small effect (0.2 < d < 0.5)
    - p < 0.05
    - Single analysis
    
  ⭐⭐ Low:
    - Very small effect (d < 0.2)
    - p < 0.10
    - Requires replication
    
  ⭐ Very Low / Candidate:
    - p > 0.10
    - Preliminary observation only
    - Needs larger sample

Example:
  Finding: "daiin appears in 33 folios (95.2% of Botanical)"
  Confidence: ⭐⭐⭐⭐⭐ (clear, replicable, large effect)
  
  Finding: "Word-final y probability is 3% higher in Botanical"
  Confidence: ⭐⭐ (small effect, requires validation)
```

---

## Phase 4: 증거 평가 (Evidence Assessment)

### 4.1 지지 증거 목록화 (Supporting Evidence)

**구조:** 증거 → 해석 → 한계

```
EVIDENCE SET 1: Word-Final Character Constraint
═══════════════════════════════════════════════════

Raw Data:
  - 6,892 tokens analyzed
  - 6,643 end with {y, r, l, n, s, o, m, k} (96.4%)
  - 249 end with other characters (3.6%)

Statistical Test:
  χ² = 4521.3, p < 0.001
  This constraint is significantly stronger than English (75%)

Interpretation:
  ✓ SUPPORTS hypothesis of rule-based system
  ✓ Inconsistent with natural language
  ✓ CONSISTENT WITH (but not PROVES) taxonomic system
  
  ? Could also indicate: artificial language, cipher, 
    formatting convention

Limitations:
  • Physical line vs EVA segment ambiguity (avg len 1.0)
  • May reflect transcription convention, not original manuscript
  • Comparison corpus shows similar constraint (catalog: 89%)
    → Constraint alone doesn't distinguish hypothesis

Confidence: ⭐⭐⭐⭐ (High)
  Clear effect, replicable, consistent
  But: Alternative explanations not ruled out
```

### 4.2 반박 증거 목록화 (Contradictory Evidence)

```
EVIDENCE SET 2: Type-Token Ratio (TTR)
════════════════════════════════════════

Raw Data:
  - Voynich Botanical: 1,850 unique / 3,200 total = 57.8%
  - English corpus: 42% (vocabulary repeated more)
  - Catalog corpus: 72% (vocabulary less repeated)

Statistical Test:
  Voynich TTR significantly higher than English (p<0.01)
  But lower than catalog (p<0.01)

Interpretation:
  ✗ CONTRADICTS "simple catalog" hypothesis
  ✗ Would expect TTR ~70% if pure catalog
  ✓ CONSISTENT WITH "mixed" or "narrative + reference" system
  
  ? Could indicate: Natural language with restricted vocabulary,
    or catalog with labels

Implication:
  Hypothesis must be refined:
  "Not simple catalog" vs "Complex taxonomy with descriptions"

Confidence: ⭐⭐⭐ (Medium)
  Clear evidence but compatible with multiple hypotheses
```

### 4.3 증거 통합 (Evidence Integration)

```
OVERALL HYPOTHESIS STATUS:
═════════════════════════

Hypothesis: "Voynich = Reference/Taxonomic System"

Support Score:
  Pattern 1 (Word-final constraint):        +3 points ⭐⭐⭐
  Pattern 2 (Token families):               +2 points ⭐⭐
  Pattern 3 (Section divergence):           +2 points ⭐⭐
  Pattern 4 (Similar to catalog corpus):    +1 point  ⭐
  
  Contradiction 1 (TTR too high):           -1 point
  Contradiction 2 (Marker concentration):   -0.5 points
  
  Alternative explanation score:            -1 point
  (cipher or artificial language could also explain this)

Total Evidence Score: +5.5 / 10 points = MODERATE SUPPORT

Verdict: ✓ Hypothesis is CONSISTENT WITH DATA
         ⚠ But NOT UNIQUELY DETERMINED by data
         → Requires further evidence to rule out alternatives
         → Additional experiments recommended

Status: CANDIDATE HYPOTHESIS (not confirmed)
```

---

## Phase 5: 결론 및 한계 (Conclusion & Limitations)

### 5.1 가설 수용/기각/수정

```
DECISION TREE:
═════════════

Question 1: Is evidence consistent with hypothesis?
  Yes → Continue to Q2
  No → REJECT or SUBSTANTIALLY MODIFY hypothesis

Question 2: Is evidence strong enough to exclude alternatives?
  Yes → TENTATIVELY ACCEPT hypothesis
  No → Continue to Q3

Question 3: Is evidence preliminary but promising?
  Yes → Label as CANDIDATE HYPOTHESIS
  No → Mark as INSUFFICIENT EVIDENCE

Question 4: Can hypothesis explain confounding variables?
  Yes → Proceed with caution
  No → Note as limitation, propose control experiment
```

**Voynich Example:**
```
Q1: Consistent? YES (word-final pattern strong)
Q2: Excludes alternatives? PARTIALLY (TTR contradicts simple catalog)
Q3: Preliminary but promising? YES
Q4: Confounding variables? YES (EVA segmentation ambiguity)

→ Classification: CANDIDATE HYPOTHESIS
  Status: PARTIALLY VALIDATED
  Next step: Resolve EVA segmentation ambiguity
```

### 5.2 방법론적 한계 (Methodological Limitations)

```
For each limitation, specify:

1. LIMITATION NAME
2. DESCRIPTION
3. IMPACT ON CONCLUSION
4. MITIGATION STRATEGY
5. FUTURE RESEARCH

EXAMPLE:
────────────────────────────────────────────

Limitation: EVA Transcription-Based Analysis Only

Description:
  Analysis uses transcribed EVA characters, not original manuscript.
  Transcriber interpretation may introduce bias.
  Color/ink/layout information not included.

Impact:
  - Cannot verify structural constraints from physical manuscript
  - Color analysis might reveal different patterns
  - Damage/deterioration might explain some anomalies
  - Physical line structure might differ from EVA segmentation

Severity: MODERATE
  Affects: Interpretation of word-final constraint
  Why: Transcriber might enforce conventions not in original

Mitigation:
  1. Compare multiple transcription sources (Takahashi vs Landini)
  2. Manually verify 10% of transcription against images
  3. Note discrepancies in rule candidate table
  4. Commission new high-resolution imaging

Future Research:
  1. Obtain color/ink analysis of original
  2. Physical manuscript inspection by paleographer
  3. Document actual damage/deterioration
  4. Create transcription confidence map
```

### 5.3 대안적 해석 (Alternative Interpretations)

```
Finding: "Token 'daiin' appears 8.2% in Botanical section"

Interpretation A (Our hypothesis):
  → daiin = taxonomic marker or reference label
  → Concentration indicates functional significance
  
Interpretation B (Natural language):
  → daiin = common word in this section
  → Subject-specific terminology (like "plant" in botany text)
  
Interpretation C (Cipher):
  → daiin = encrypted value for common letter
  → Frequency matches encrypted natural language
  
Interpretation D (Artifact):
  → daiin = transcription error or manuscript damage
  → Apparent frequency illusory
  → Needs verification against images

How to distinguish?
  ✓ Compare with English word frequency distribution
  ✓ Check Zipfian fit (natural language vs artifact)
  ✓ Examine co-occurrence patterns
  ✓ Look at physical manuscript locations
  ✓ Test predictions: if interpretation correct, then X should hold

Which is most likely?
  Evidence weight: B > A = C > D
  
  But: Cannot definitively rule out C or D without more data
```

---

## Validation Checklist

### Before Publication:
```
☐ All quantitative claims have numerical evidence
☐ All tests specified (method, sample size, significance level)
☐ All effect sizes reported, not just p-values
☐ All limitations clearly stated
☐ All alternative interpretations considered
☐ Reproducibility: code + data available
☐ No claims stronger than evidence supports
☐ Confidence levels assigned to each finding
☐ Comparison corpora analyzed identically
☐ Image-folio-token traceability verified
☐ EVA parsing method documented
☐ Missing data handling explained
☐ Sensitivity analysis completed
☐ Peer review comments addressed
```

### Forbidden Phrasings:
```
❌ "proven"           → "consistent with" or "supported by"
❌ "shows that"       → "suggests" or "may indicate"
❌ "clearly"          → "statistically significant" (p < 0.05)
❌ "obviously"        → delete or replace with evidence
❌ "everyone knows"   → cite source or remove
❌ "it is certain"    → specify confidence level
```

### Recommended Phrasings:
```
✅ "The analysis reveals that..."
✅ "Statistical evidence suggests that..."
✅ "This pattern is consistent with a hypothesis that..."
✅ "These findings support a candidate interpretation of..."
✅ "Further validation is required to determine whether..."
✅ "The data are compatible with but do not uniquely specify..."
```

---

## Example: Complete Validation Cycle

```
HYPOTHESIS: "Word-final y should be less common in Astronomical section"

Phase 1 - Specification:
  H0: Word-final y frequency equal across sections (p=p_botanical)
  H1: Word-final y frequency differs (p_botanical ≠ p_astronomical)
  Testable? YES
  Prediction: Astronomical % should be <15%, Botanical >18%

Phase 2 - Evidence Collection:
  Botanical section: 3,200 tokens, 576 end in y (18.0%)
  Astronomical section: 800 tokens, 104 end in y (13.0%)
  
Phase 3 - Statistical Test:
  χ² (1 df) = 18.4, p = 0.00002
  Effect size: Cramér's V = 0.09 (small)
  
Phase 4 - Evidence Assessment:
  Supporting: Statistically significant difference (p<0.001)
  Limiting: Very small effect size (V=0.09)
  Alternative: Could be random sampling variation (ruled out by p-value)
  
Phase 5 - Conclusion:
  Status: SUPPORTED (but small effect)
  Confidence: ⭐⭐⭐ Medium
  Implication: Astronomical section shows different word-final pattern,
               but effect size is small (13% vs 18%)
  Next: Investigate WHY (subject matter? Scribe hand? Folio damage?)
```

---

## Summary Table

| Phase | Key Question | Output | Confidence Needed |
|-------|---|---|---|
| 1 | What is the hypothesis? | Testable claim | 100% (must be clear) |
| 2 | What is the evidence? | Data + metadata | 95% (quality control) |
| 3 | What do statistics show? | Test results + effect sizes | 80% (p-value alone insufficient) |
| 4 | What does evidence mean? | Interpretation + alternatives | 70% (acknowledge uncertainty) |
| 5 | What is the conclusion? | Validated/rejected/candidate | 60% (admit limitations) |

