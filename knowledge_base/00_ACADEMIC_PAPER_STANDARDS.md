# 학술 논문 작성 표준: IMRAD 방식

## 목적
AI 연구 프로젝트의 결과를 국제 학술지 수준의 논문으로 구조화하기 위한 표준 양식.

---

## 1. IMRAD 구조 (International Standard)

### 1.1 **I: Introduction (소개)** — 6~8페이지
논문의 배경과 필요성을 설정합니다.

#### 1.1.1 Background (배경)
- 연구 주제의 역사적/학술적 배경
- 기존 연구의 상태
- 왜 이 주제가 중요한가?

**예시:**
```
[Your research subject]의 배경과 기존 연구 상황을 설명합니다.
기존 연구는 A/B/C 가설을 제시했으나,
D 가설은 아직 체계적으로 검증되지 않았다.
```

#### 1.1.2 Research Gap (연구 공백)
- 기존 연구의 한계
- 우리가 할 일

**예시:**
```
기존 연구는 [Subject]의 구조적 제약을 발견했지만,
그 기능이 [Alternative Hypothesis]와 양립 가능한지는 검토하지 않았다.
```

#### 1.1.3 Research Questions (연구 질문)
- RQ1: [Your data unit]이 [Feature A]처럼 행동하는가, 아니면 [Feature B]처럼 행동하는가?
- RQ2: [Dimension 1]별 분포가 우연보다 강한가?
- RQ3: [Item]들이 계열적으로 반복되는가?

#### 1.1.4 Hypothesis (가설)
**Primary Hypothesis:**
```
[Your subject] may exhibit structural patterns consistent with 
[Your hypothesis], as evidenced by:
- [Evidence type 1]
- [Evidence type 2]
- [Evidence type 3]
```

---

### 1.2 **M: Methods (방법론)** — 8~10페이지
**누구든 따라할 수 있도록** 상세하게 작성합니다.

#### 1.2.1 Data Source (데이터 출처)
```
Source:          [Your primary data source and version]
Collection:      [Your collection/archive name]
Coverage:        [Your data scope and range]
Unit Count:      [~Your total count of units]
Total Characters: [~Your total character/feature count]
Encoding:        [Your encoding standard]
```

#### 1.2.2 Parsing Method (파싱 방법)
```
Step 1: Raw data format
[Your raw data example line]

Step 2: Segment extraction
[Document how you parse the data]
[Extract metadata like ID, section, etc]

Step 3: Unit segmentation (your delimiter)
[Show how you tokenize or segment the data]

Step 4: Feature extraction
[Show how you extract sub-units or features]

Important: 
- Define your data hierarchy clearly
- Document all assumptions about data structure
- Maintain traceable IDs throughout the hierarchy
```

#### 1.2.3 Analysis Methods (분석 방법)

**A. Token Frequency Analysis**
```
Method: Count token occurrences per folio/section
Metric: Frequency distribution, Zipfian fit, TTR
Output: token_frequency.csv
```

**B. Character Analysis**
```
Method: 1-gram, 2-gram, 3-gram frequency
Position analysis: word-initial, word-medial, word-final
Metric: Character distribution, digram/trigram patterns
Output: character_frequency.csv, ngram_analysis.csv
```

**C. Entropy Analysis**
```
Formula: H(X) = -Σ p(x) log₂ p(x)
Metrics: 
  - 1-gram entropy
  - 2-gram entropy
  - Conditional entropy H(X|Y)
Comparison: vs English, vs random, vs ciphers
Output: entropy_report.md
```

**D. Position Rules**
```
Analysis:
  - Line-initial tokens (tokens at line start)
  - Line-final tokens (tokens at line end)
  - Word-initial characters (first char of each token)
  - Word-final characters (last char of each token)
Output: position_rules.csv
```

**E. Category/Section-Level Analysis**
```
Sections: [List your document sections/categories]
For each section:
  - Unit count
  - Feature frequency
  - Unique units (diversity)
  - Repeated units (family/cluster analysis)
  - TTR (Type-Token Ratio) or similar diversity metric
  - Top-10 concentration
Output: [Your category analysis file]
```

**F. Unit Clustering (Family/Pattern Analysis)**
```
Method: [Your similarity/distance metric]
Clustering: Group units by:
  - Shared prefix patterns
  - Shared suffix patterns
  - Distance threshold
Example:
  Cluster [NAME]: [List example units in same cluster]
Output: [Your clustering analysis file]
```

#### 1.2.4 Validation Criteria (검증 기준)
```
Hypothesis is SUPPORTED if:
✓ Multiple structural patterns hold consistently
✓ Patterns hold across different sections
✓ Patterns cannot be explained by natural language alone
✓ Patterns align with reference/catalog corpus features

Hypothesis is PARTIALLY SUPPORTED if:
⚠ Patterns hold in some sections but not others
⚠ Patterns hold but are consistent with multiple hypotheses
⚠ Evidence is present but weak

Hypothesis is REJECTED if:
✗ Patterns do not hold when normalized
✗ Comparison corpus shows stronger pattern match
✗ Alternative hypothesis explains data better with fewer assumptions
```

#### 1.2.5 Comparison Corpora (비교 자료)
```
For each of the following corpora, calculate identical metrics:

Corpus A: [Reference 1 - description]
  Source: [Source]
  Sample: [Sample size]
  
Corpus B: [Reference 2 - description]
  Source: [Source]
  Sample: [Sample size]
  
Corpus C: [Reference 3 - description]
  Source: [Source]
  Sample: [Sample size]
  
Corpus D: [Reference 4 - description]
  Source: [Source]
  Sample: [Sample size]
  
Corpus E: [Reference 5 - description]
  Source: [Source]
  Sample: [Sample size]
```

#### 1.2.6 Metadata & Image Mapping (메타데이터)
```
Critical: Ensure complete metadata correspondence for all data units

Data Collection Metadata:
  [Document how you track provenance]
  [Document collection date and version]
  [Document any image/physical correspondence if applicable]
  
Mapping details:
  [List all ID fields you track]
  [Document confidence/quality indicators]
  [List verification procedures]

All IDs and references must be verified before analysis begins.
```

#### 1.2.7 Limitations of Method (방법론 한계)
```
⚠ Limitation 1: [Your data source limitation]
  [Description]
  Mitigation: [Your mitigation strategy]

⚠ Limitation 2: [Your second limitation]
  [Description]
  Mitigation: [Your mitigation strategy]

⚠ Limitation 3: [Your third limitation]
  [Description]
  Mitigation: [Your mitigation strategy]

⚠ Limitation 4: [Your fourth limitation]
  [Description]
  Mitigation: [Your mitigation strategy]

⚠ Limitation 5: [Your fifth limitation]
  [Description]
  Mitigation: [Your mitigation strategy]
```

---

### 1.3 **R: Results (결과)** — 10~12페이지
**객관적 사실만**. 해석 없이.

#### 1.3.1 Descriptive Statistics (기술 통계)
```
# 데이터셋 개요
Total units analyzed:      [Your total count]
Total measurements:        [Your total measurement count]
Unique units:              [Your unique unit count]
Total observations:        [Your total observation count]
Unique features:           [Your unique feature count]

Average per unit:          [Your mean] (SD=[Your SD])
Average per category:      [Your mean] (SD=[Your SD])
Unit length mean:          [Your mean] (SD=[Your SD], range=[Your range])
```

#### 1.3.2 Key Findings Tables (주요 발견 표)

**Table 1: Feature Distribution**
```
Rank | Feature | Count | % of Total | Position Distribution
-----|---------|-------|------------|------------------------
1    | [Name]  | [N]   | [%]        | [Distribution details]
2    | [Name]  | [N]   | [%]        | [Distribution details]
3    | [Name]  | [N]   | [%]        | [Distribution details]
...
```

**Table 2: Top Units**
```
Rank | Unit     | Count | Categories | Metrics
-----|----------|-------|------------|---------|
1    | [Name]   | [N]   | [N]        | [%]     |
2    | [Name]   | [N]   | [N]        | [%]     |
3    | [Name]   | [N]   | [N]        | [%]     |
...
```

**Table 3: Comparative Metrics**
```
Metric                 | Your Data | Reference 1 | Reference 2 | Reference 3
-----------------------|-----------|-------------|-------------|------------
Metric 1               | [Value]   | [Value]     | [Value]     | [Value]
Metric 2               | [Value]   | [Value]     | [Value]     | [Value]
Metric 3               | [Value]   | [Value]     | [Value]     | [Value]
```

#### 1.3.3 Category-Level Differences
```
Table 4: Category Statistics

Category    | Count | Unique | Diversity | Concentration | Metric 1 | Metric 2
------------|-------|--------|-----------|----------------|----------|--------
[Name]      | [N]   | [N]    | [%]       | [%]            | [Value]  | [Value]
[Name]      | [N]   | [N]    | [%]       | [%]            | [Value]  | [Value]
[Name]      | [N]   | [N]    | [%]       | [%]            | [Value]  | [Value]
```

#### 1.3.4 Comparison Corpus Results
```
Table 5: Your Data vs Comparison Corpora

Metric                    | Your Data | Reference 1 | Reference 2 | Reference 3 | Reference 4 | Reference 5
--------------------------|-----------|-------------|-------------|------------|------------|----------
Metric 1                  | [Value]   | [Value]     | [Value]     | [Value]    | [Value]    | [Value]
Metric 2                  | [Value]   | [Value]     | [Value]     | [Value]    | [Value]    | [Value]
Metric 3                  | [Value]   | [Value]     | [Value]     | [Value]    | [Value]    | [Value]
```

---

### 1.4 **A: Analysis (분석)** — 8~10페이지
**해석과 의미 파악**. 하지만 "증명했다"는 표현 금지.

#### 1.4.1 Interpretation of Results
```
**Observation 1: [Your first finding]**
- Observed: [Your observation]
- Reference baseline: [Your baseline value]
- Interpretation: [Statistical significance and interpretation]
- Could indicate: [Possible interpretations]
- Cannot conclude: [What cannot be concluded from this alone]

**Observation 2: [Your second finding]**
- Observed: [Your observation]
- Interpretation: [How you interpret this]
- Could indicate: [Alternative interpretations]
- Cannot conclude: [What is not proven by this evidence]

**Observation 3: [Your third finding]**
- Observed: [Your observation]
- [Comparison with references]
- Interpretation: [What this is consistent with]
- Cannot conclude: [What remains uncertain]
```

#### 1.4.2 Pattern Consistency
```
Pattern 1 holds in: [List which categories/subsets] (yes/partial/no)
Pattern 2 holds in: [List which categories/subsets] (yes/partial/no)
Pattern 3 holds in: [List which comparisons] (yes/partial/no)

→ Interpretation: [Structural or methodological meaning]
→ But: [Alternative explanations must be considered]
```

---

### 1.5 **D: Discussion (토의)** — 10~12페이지
**기존 연구와 대조, 한계 인정, 다음 연구 제시**.

#### 1.5.1 Hypothesis Validation Status
```
PRIMARY HYPOTHESIS: Voynich encodes taxonomic/reference system

Supportive Evidence:
  ✓ Word-final constraint (96.3%) → rule-based system signature
  ✓ Token family clustering → systematic variation within families
  ✓ Section vocabulary divergence (23%) → subject-specific terminology
  ✓ Positive correlation with catalog corpus features

Contradictory Evidence:
  ✗ TTR (58%) is below catalog corpus (72%) → less systematic?
  ✗ Daiin concentration is high but not universal → marker or label?
  ✗ Some tokens appear across all sections → could be articles/prepositions?

Inconclusive Evidence:
  ⚠ Entropy (6.14) is between natural language (10.5) and random (8.5)
  ⚠ Avg token length (5.2) not unique to any hypothesis
  ⚠ Physical line vs EVA segment ambiguity affects interpretation
```

#### 1.5.2 Comparison with Existing Theories
```
1. Natural Language Hypothesis
   Voynich-like entropy would require... this is inconsistent with 
   normal language statistics. (Rugg, 2004; Landini)
   Our findings: Consistent with this criticism. TTR and entropy 
   argue against unencrypted natural language.

2. Substitution Cipher Hypothesis
   Our findings: Structural constraints (word-final, prefix families)
   are tighter than cipher baseline. Not consistent with simple 
   substitution or homophones.

3. Artificial Language Hypothesis
   Our findings: Consistent with deliberate phonotactic constraints.
   The Gaussian token length (μ=5.2) and word-final regularity 
   suggest artificial system design.

4. Reference/Taxonomic System (Our proposal)
   Our findings: Consistent with GenBank/catalog features 
   (section divergence, label concentration, identifier families).
   But: TTR and marker concentration are lower than expected.
```

#### 1.5.3 Limitations and Caveats
```
Critical Limitations:
  1. Transcription-based only
     - Color, ink, layout information not included
     - Future work should incorporate images
  
  2. EVA segmentation ambiguity
     - "Physical line" vs "EVA . delimiter" distinction affects conclusions
     - 1.0 average length result needs manual verification
  
  3. No original manuscript access
     - Cannot verify transcription accuracy
     - Physical damage/deterioration not assessed
  
  4. Small comparison corpora
     - Catalog corpus (5,000 entries) may not be representative
     - TTR normalization may introduce bias
  
  5. Multiple hypothesis compatibility
     - Observed patterns compatible with 2+ hypotheses
     - Hypothesis not uniquely determined by current data
```

#### 1.5.4 Implications and Future Work
```
If hypothesis is correct:
  → Voynich might contain taxonomic/organizational information
  → [Your Category 1] section might be plant classification system
  → Token families might encode hierarchical relationships
  → Future work: Attempt to link tokens to plant features/properties

If hypothesis is partially correct:
  → Voynich is likely artificial system, not natural language
  → Multiple encoding schemes may be present (catalog + narrative)
  → Future work: Sector-by-sector analysis with domain experts

If hypothesis is rejected:
  → Different model required
  → Current structural patterns explained by cipher/other mechanism
  → Future work: Test alternative theories with same rigor
```

---

### 1.6 **C: Conclusion (결론)** — 2~3페이지

```
## Summary
This study presents a testable hypothesis regarding [Your Research Question], 
based on corpus structure analysis. Analysis of [Your Data] revealed:

1. [Key finding 1]
2. [Key finding 2]
3. [Key finding 3]
4. [Key finding 4]

## Evidence Status
Evidence level: [Your assessment - PRELIMINARY, CANDIDATE, SUPPORTED, etc.]
- Multiple patterns observed
- Consistent across [Your domains/categories]
- Compatible with hypothesis
- But: Alternative explanations not ruled out
- Comparison with corpora [partially/fully] supportive

## What this does NOT claim
This study does NOT claim:
  ✗ [Overclaim 1 to avoid]
  ✗ [Overclaim 2 to avoid]
  ✗ [Overclaim 3 to avoid]
  ✗ [Overclaim 4 to avoid]
  ✗ [Overclaim 5 to avoid]

## What this DOES provide
This study DOES provide:
  ✓ Systematic structural analysis framework
  ✓ Quantitative pattern documentation
  ✓ Reproducible methodology
  ✓ Testable hypotheses
  ✓ Comparison baseline with reference corpora
  ✓ Foundation for future hypothesis testing

## Next Steps
Required for validation:
  1. [Validation step 1]
  2. [Validation step 2]
  3. [Validation step 3]
  4. [Validation step 4]
  5. [Validation step 5]
  6. [Validation step 6]

## Reproducibility
All data, code, and analysis scripts are available at:
  [Your repository URL]
  
To reproduce results:
  $ git clone [Your repo]
  $ cd [Your path]
  $ pip install -r requirements.txt
  $ python scripts/[analysis 1]
  $ python scripts/[analysis 2]
  $ [Run your analysis]
```

---

## 2. 핵심 원칙 (Golden Rules)

### 2.1 절대 금지 표현
```
❌ "[Subject] has been completely solved/decoded"
❌ "This element definitively means..."
❌ "We have proven [claim]..."
❌ "The evidence definitively shows..."
❌ "[Subject] must be [specific interpretation]..."
```

### 2.2 권장 표현
```
✅ "The analysis reveals structural patterns consistent with..."
✅ "Token distribution suggests possible..."
✅ "These patterns may indicate..."
✅ "The evidence supports a hypothesis that..."
✅ "Further analysis is required to determine..."
✅ "This finding is compatible with but does not prove..."
```

### 2.3 데이터 인용 규칙
```
Good: "In 33 folios (29.5% of manuscript), the token 'daiin' 
       appears with 8.2% frequency in [Your Category 1] section, 
       compared to 1.2% average across other sections."

Bad: "The word 'daiin' is a marker for botanical specimens."
     (No evidence given, meaning assumed)

Better: "The token 'daiin' shows statistically significant 
        section-specific concentration (p < 0.001, χ² = 234.5), 
        which may indicate..." (Evidence cited, conclusion tentative)
```

---

## 3. 논문 체크리스트

- [ ] 모든 수치는 표와 그래프로 제시
- [ ] 모든 주장은 증거 근거 제시 (수치/인용 포함)
- [ ] 한계/제약사항 명시
- [ ] 기존 연구와 비교 분석
- [ ] 대안적 해석 제시
- [ ] "번역했다/증명했다" 표현 제거
- [ ] 재현 가능성 보장 (코드 공개)
- [ ] 이미지-folio-token 역추적 가능성 보장
- [ ] 비교 코퍼스 메서드 동일 적용
- [ ] 결론은 "candidate" 수준에서 마무리

---

**마지막 체크:**
```
논문이 완성되었을 때, 다른 연구팀이
1. 데이터 다운로드 가능한가? ✓
2. 코드 실행 가능한가? ✓
3. 같은 결과 재현 가능한가? ✓
4. 가설 검증/기각 가능한가? ✓
5. 코드 수정해서 다른 가설 테스트 가능한가? ✓

모두 YES면 학술지 투고 준비 완료.
```
