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
보이니치 원고는 15세기 필사본으로 500년 이상 미해독 상태다.
기존 연구는 암호문/자연어/의례적 텍스트 가설을 제시했으나,
구조적 정의서/분류표 가설은 아직 체계적으로 검증되지 않았다.
```

#### 1.1.2 Research Gap (연구 공백)
- 기존 연구의 한계
- 우리가 할 일

**예시:**
```
기존 연구는 보이니치의 구조적 제약을 발견했지만,
그 기능이 분류체계/참조 데이터베이스와 양립 가능한지는 검토하지 않았다.
```

#### 1.1.3 Research Questions (연구 질문)
- RQ1: 보이니치 token이 일반 단어처럼 행동하는가, 아니면 코드/라벨처럼 행동하는가?
- RQ2: 섹션별 token 분포가 우연보다 강한가?
- RQ3: 비슷한 token들이 계열적으로 반복되는가?

#### 1.1.4 Hypothesis (가설)
**Primary Hypothesis:**
```
The Voynich Manuscript may encode a taxonomic or reference-like 
classification system rather than ordinary prose, as evidenced by:
- Constrained token structure
- Section-specific vocabulary
- Repetitive token family patterns
```

---

### 1.2 **M: Methods (방법론)** — 8~10페이지
**누구든 따라할 수 있도록** 상세하게 작성합니다.

#### 1.2.1 Data Source (데이터 출처)
```
Source:          IT2a-n.txt (Landini-Stolfi EVA Transcription v2a)
Yale Beinecke:   MS 408 (MS 408 digital collection)
Coverage:        f1r-f112v (224 pages, 6 sections)
Token Count:     ~7,063 unique and repeated tokens
Character Count: ~50,000 EVA characters
Encoding:        UTF-8, EVA standard
```

#### 1.2.2 Parsing Method (파싱 방법)
```
Step 1: Raw EVA text
<f1r.P1.1;H> fachys.ykal.ar.ataiin.shol...

Step 2: Line segmentation
folio_id: f1r
paragraph: 1
line_number: 1
physical_line_text: fachys.ykal.ar.ataiin.shol...

Step 3: Token segmentation (. delimiter)
token_1: fachys
token_2: ykal
token_3: ar
token_4: ataiin
token_5: shol

Step 4: Glyph extraction
f -> [position: 1, shape: "gallows"]
a -> [position: 2, shape: "arch"]
...

Important: 
- Distinguish physical_line (원고 실제 줄) vs EVA_segment (점 기준 분절)
- Maintain folio_id → line_id → token_id → glyph_id hierarchy
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

**E. Section-Level Analysis**
```
Sections: Herbal, Botanical, Astronomical, Biological, Cosmological, Pharmaceutical
For each section:
  - Token count
  - Character frequency
  - Unique tokens (type)
  - Repeated tokens (token families)
  - TTR (Type-Token Ratio)
  - Top-10 concentration
Output: section_comparison.csv
```

**F. Token Clustering (Family Analysis)**
```
Method: Edit distance (Levenshtein distance)
Clustering: Group tokens by:
  - Shared prefix (q*, ch*, k*)
  - Shared suffix (*ain, *iin, *ol)
  - Edit distance ≤ 2
Example:
  Cluster TOKCL-AIN: aiin, ain, ataiin, chaiin, daiin
Output: token_clusters.csv
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

Corpus A: Natural Language Baseline
  Source: English Wikipedia articles
  Sample: 50,000 characters of scientific text
  
Corpus B: Botanical/Herbal Text
  Source: Medieval herbal descriptions
  Sample: 10,000 tokens from herbal manuscripts
  
Corpus C: Taxonomic/Catalog Structure
  Source: Plant species lists, taxonomic databases
  Sample: 5,000 entries from Linnaean classification
  
Corpus D: Artificial/Generated Text
  Source: Markov-generated text using Voynich unigram probabilities
  Sample: 50,000 characters generated text
  
Corpus E: Substitution Cipher
  Source: English text encrypted with simple substitution
  Sample: 50,000 characters ciphertext
```

#### 1.2.6 Image-Folio Mapping (이미지 매핑)
```
Critical: Ensure image file ↔ folio_id correspondence

Yale Beinecke Digital Collection:
  Image file naming: 2002046_1.jpg to 2002046_214.jpg
  
Mapping table:
  image_file_number: 1
  image_filename: 2002046_1.jpg
  folio_id: f1r
  recto_verso: recto
  section: Herbal
  yale_url: https://...
  confidence: confirmed
  notes: ""

All image URLs and folio IDs must be verified before analysis.
```

#### 1.2.7 Limitations of Method (방법론 한계)
```
⚠ Limitation 1: EVA transcription variation
  Different transcribers may mark glyphs differently.
  Mitigation: Use primary source (Takahashi/Landini-Stolfi)

⚠ Limitation 2: Folio missing/damaged
  Some folios are damaged or missing.
  Mitigation: Document missing pages in analysis_metadata.csv

⚠ Limitation 3: Line parsing ambiguity
  EVA transcription uses . as word delimiter, but sometimes
  as abbreviation or punctuation. "Physical line" vs "EVA segment" 
  distinction is critical.
  Mitigation: Manually verify line parsing on 10% sample

⚠ Limitation 4: Small sample for comparison corpora
  Cannot perfectly match Voynich size/style with comparison corpora.
  Mitigation: Normalize all metrics (TTR, entropy per 1000 chars)

⚠ Limitation 5: No access to original manuscript
  Analysis based on transcription only; color/ink analysis not included.
  Mitigation: Note that future research with images should be incorporated
```

---

### 1.3 **R: Results (결과)** — 10~12페이지
**객관적 사실만**. 해석 없이.

#### 1.3.1 Descriptive Statistics (기술 통계)
```
# 데이터셋 개요
Total folios analyzed:     112 (f1r-f112v)
Total tokens:              7,063
Unique tokens:             3,500
Total characters (EVA):    50,000
Unique characters:         19

Average tokens per folio:  63.1 (SD=21.4)
Average characters per folio: 446.4 (SD=142.1)
Token length mean:         5.2 (SD=1.8, range=1-14)
```

#### 1.3.2 Key Findings Tables (주요 발견 표)

**Table 1: Character Frequency Distribution**
```
Rank | Character | Count | % of Total | Position Distribution
-----|-----------|-------|------------|------------------------
1    | d         | 5421  | 10.84%     | word-initial: 45%, final: 22%
2    | o         | 4856  | 9.71%      | word-initial: 15%, final: 8%
3    | a         | 4234  | 8.47%      | word-initial: 8%, final: 35%
...
```

**Table 2: Top 20 Tokens**
```
Rank | Token    | Count | Unique Folios | Botanical% | Herbal% | ...
-----|----------|-------|---------------|------------|---------|----
1    | daiin    | 172   | 33            | 8.2%       | 1.2%    | ...
2    | chol     | 116   | 24            | 4.1%       | 2.3%    | ...
3    | chor     | 92    | 22            | 3.8%       | 1.9%    | ...
...
```

**Table 3: Entropy Measurements**
```
Metric                 | Voynich | English | Random | Cipher
-----------------------|---------|---------|--------|--------
1-gram entropy         | 3.81    | 4.0-4.5 | 4.25   | 3.95
2-gram entropy         | 6.14    | 10-11   | 8.50   | 7.20
Conditional entropy    | 2.33    | 3.0-3.5 | 4.20   | 3.25
Word-final constraint  | 96.3%   | 75%     | 5%     | 50%
```

#### 1.3.3 Section-Level Differences
```
Table 4: Section Statistics

Section         | Token Count | Unique | TTR   | Top-10% | Word-final Y% | daiin%
----------------|-------------|--------|-------|---------|---------------|---------
Herbal          | 1200        | 650    | 54%   | 18%     | 22%           | 1.2%
Botanical       | 3200        | 1850   | 58%   | 14%     | 18%           | 6.5%
Astronomical    | 800         | 520    | 65%   | 9%      | 15%           | 0.5%
Biological      | 950         | 600    | 63%   | 12%     | 17%           | 2.1%
Cosmological    | 650         | 420    | 65%   | 11%     | 16%           | 0.8%
Pharmaceutical  | 263         | 180    | 68%   | 8%      | 20%           | 0.3%
```

#### 1.3.4 Comparison Corpus Results
```
Table 5: Voynichese vs Comparison Corpora

Metric                    | Voynich | English | Herbal | Catalog | Cipher | Random
--------------------------|---------|---------|--------|---------|--------|--------
Avg token length          | 5.2     | 4.9     | 5.1    | 3.8     | 4.9    | 5.3
Type-Token Ratio (norm)   | 58%     | 42%     | 48%    | 72%     | 41%    | 95%
Word-final constraint     | 96.3%   | 75%     | 80%    | 89%     | 50%    | 5%
Top-10 concentration      | 14%     | 18%     | 15%    | 28%     | 19%    | 0.1%
Entropy (2-gram)          | 6.14    | 10.5    | 9.2    | 7.8     | 7.2    | 8.5
Section divergence        | 23%     | 5%      | 8%     | 35%     | 12%    | 2%
```

---

### 1.4 **A: Analysis (분석)** — 8~10페이지
**해석과 의미 파악**. 하지만 "증명했다"는 표현 금지.

#### 1.4.1 Interpretation of Results
```
**Observation 1: Word-final constraint (96.3%)**
- Observed: 96.3% of Voynichese tokens end with {y, r, l, n, s, o, m, k}
- English baseline: 75%
- Interpretation: This constraint is significantly stronger than natural 
  language (p < 0.001, χ²-test).
- Could indicate: Either highly formalized language or rule-based system.
- Cannot conclude: This alone proves any hypothesis.

**Observation 2: Section-specific token families**
- Observed: Token "daiin" appears in 33 folios, 8.2% of Botanical section,
  but <1% in other sections.
- Interpretation: Token distribution is not random across sections.
- Could indicate: Either subject-specific terminology OR layout-dependent labeling.
- Cannot conclude: The token's meaning or function.

**Observation 3: Token length regularity**
- Observed: 87% of tokens are 4-7 characters, Gaussian distribution (μ=5.2, σ=1.8)
- English: More varied length distribution
- Catalog entries: Similar tight distribution
- Interpretation: Consistent with short identifier/label format
- Cannot conclude: The purpose of this regularity
```

#### 1.4.2 Pattern Consistency
```
Pattern 1 holds in: Botanical (yes), Herbal (yes), Astronomical (partial)
Pattern 2 holds in: All sections (yes, with section-specific variants)
Pattern 3 holds in: Catalog corpus (yes), Cipher corpus (no), English (no)

→ Interpretation: Pattern is structural, not lexical
→ But: Could be explained by multiple hypotheses
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
  → Botanical section might be plant classification system
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
This study presents a testable hypothesis that the Voynich Manuscript 
may encode a taxonomic or reference-like classification system, based on 
corpus structure analysis. Analysis of 7,063 tokens across 112 folios and 
6 sections revealed:

1. Unusually strong word-final character constraint (96.3%)
2. Section-specific token distribution patterns
3. Token family clustering consistent with identifiers
4. Structural similarity to cataloging systems

## Evidence Status
Evidence level: PRELIMINARY & CANDIDATE
- Multiple patterns observed
- Consistent across sections
- Compatible with hypothesis
- But: Alternative explanations not ruled out
- Comparison with corpora partially supportive

## What this does NOT claim
This study does NOT claim:
  ✗ Translation of Voynich manuscript
  ✗ Decipherment of any text
  ✗ Proof of specific theory
  ✗ Identification of language family
  ✗ Historical origin determination

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
  1. Manual verification of line parsing (500 lines × 3 annotators)
  2. Domain expert review (paleography, botany, linguistics)
  3. Larger comparison corpora (100k+ tokens)
  4. Image analysis with color/layout features
  5. Currier A/B and scribe hand controlled analysis
  6. Replication by independent research team

## Reproducibility
All data, code, and analysis scripts are available at:
  https://github.com/zmjckim-fa/coolhan/tools/voynich-reference-analyzer/
  
To reproduce results:
  $ git clone https://github.com/zmjckim-fa/coolhan
  $ cd coolhan/tools/voynich-reference-analyzer
  $ pip install -r requirements.txt
  $ python scripts/01_parse_eva.py
  $ python scripts/02_analyze_tokens.py
  $ streamlit run app.py
```

---

## 2. 핵심 원칙 (Golden Rules)

### 2.1 절대 금지 표현
```
❌ "The Voynich Manuscript has been decoded"
❌ "This word means..."
❌ "We have proven..."
❌ "The text is definitely..."
❌ "Voynich was a catalog of..."
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
       appears with 8.2% frequency in Botanical section, 
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
