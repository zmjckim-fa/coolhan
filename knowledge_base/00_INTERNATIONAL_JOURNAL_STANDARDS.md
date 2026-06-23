# International-Level Academic Paper Writing Standards
## International Journal Standards (Nature, Science, PNAS Level)

**Purpose:** Write AI research at a level suitable for submission to top-tier international journals such as Nature/Science/PNAS/eLife

**Applies to:** [Your Subject] manuscript, molecular biology, data science, and artificial intelligence fields

---

## 📋 Part 1: Standards of Top-Tier International Journals

### 1.1 Journal Characteristics (by Impact Factor)

| Journal | IF | Characteristics | Reproducibility demand | Difficulty |
|------|----|----|-----------|--------|
| **Nature** | 64+ | innovation, maximum impact | very high | ⭐⭐⭐⭐⭐ |
| **Science** | 41+ | general interest, high standards | very high | ⭐⭐⭐⭐⭐ |
| **PNAS** | 11+ | rigorous science, US Academy | high | ⭐⭐⭐⭐ |
| **eLife** | 8.5+ | Open science, transparency | very high | ⭐⭐⭐⭐ |
| **PLOS ONE** | 3.5+ | rigorous but inclusive | high | ⭐⭐⭐ |
| **Nature Communications** | 16+ | high quality, more accessible | high | ⭐⭐⭐⭐ |

### 1.2 Common Features of Nature/Science Submissions

```
1. NOVELTY
   ✓ a perspective clearly different from prior work
   ✓ new data or analysis methods
   ✓ findings impossible to explain with existing accounts
   ✗ a trivial extension of prior work

2. RIGOR
   ✓ statistical validation required
   ✓ effect size + p-value presented together
   ✓ all assumptions stated
   ✓ limitations clearly acknowledged
   ✗ conclusions from p-value alone

3. SIGNIFICANCE
   ✓ impact across a broad field
   ✓ theoretical/practical implications
   ✓ suggests future research directions
   ✗ important only in specific cases

4. CLARITY
   ✓ main finding understandable even by a 5-year-old
   ✓ graphs/tables speak for themselves
   ✓ technical jargon minimized
   ✗ writing only experts can understand

5. REPRODUCIBILITY
   ✓ code/data published
   ✓ all parameters stated
   ✓ independently reproducible
   ✗ "only we can know"
```

---

## 📄 Part 2: International-Level Paper Structure (Enhanced IMRAD)

### 2.1 Title - Accuracy and Impact

#### ❌ Bad title
```
"Analysis of [Your Subject] Manuscript Structure"
(too general; unclear what was found)
```

#### ✅ Good title
```
"Structural Evidence for Taxonomic Organization in the [Your Subject] Manuscript:
A Quantitative Corpus Analysis Comparing Pre-Modern Reference Systems"
(states the subject, main finding, and methodology at a glance)
```

### 2.2 Abstract - 60-250 words (varies by journal)

#### Structure: Problem → Approach → Results → Significance

```markdown
**Background:**
The [Your Subject] Manuscript, an undeciphered 15th-century manuscript,
has resisted decipherment for 500+ years. Existing theories—cipher,
natural language, artificial language—remain unresolved. However,
these theories assume the manuscript encodes readable text, overlooking
an alternative: it may encode a reference or taxonomic system.

**Methods:**
We conducted quantitative structural analysis on 7,063 tokens
(~50,000 characters) across 112 folios using corpus linguistics methods.
We computed character frequency, entropy, position-based constraints,
and section-level statistics, comparing results to English text,
taxonomic catalogs, herbal descriptions, ciphers, and random text.

**Results:**
[Your Subject] exhibits structural patterns inconsistent with natural language
but consistent with formal classification systems: 96.3% of tokens end
with 8 constrained characters (English: 75%, catalog: 89%); vocabulary
divergence is 23% across sections (English: 5%, catalog: 35%);
token family clustering at 9% (vs. 2% in English). Entropy metrics
(2-gram H=6.14) match formal systems more than natural language (H=10.5).

**Significance:**
While not claiming decipherment, our analysis provides quantitative
evidence that [Your Subject]'s structure is compatible with a pre-modern
reference system hypothesis. This fundamentally reframes the problem
from "What language/cipher?" to "What information system?"—opening
new research avenues in manuscript studies and historical information
technologies.

**Keywords:** [Your Subject] Manuscript, corpus linguistics, information
systems, manuscript analysis, quantitative methods
```

### 2.3 Introduction - 3-4 pages

```markdown
## Introduction

### Historical Context
[600 words on manuscript history, discovery, ownership timeline]

### Existing Hypotheses & Their Limitations
The [Your Subject] has generated theories for 500+ years:

1. **Natural Language (Encrypted or Not)**
   - Rugg (2004): Supports cipher hypothesis
   - Landini (2013): Linguistic analysis shows non-random structure
   - Limitation: Entropy values inconsistent with any known language

2. **Substitution Cipher**
   - Assumption: Natural language encrypted with character substitution
   - Evidence: Position-specific character constraints
   - Problem: Why maintain letter frequency? Why token families?
   
3. **Artificial Language**
   - Hypothesis: Constructed language like Esperanto
   - Evidence: Phonotactic constraints, syllabic rules
   - Problem: What is the purpose? No grammar or semantics evident

4. **The Overlooked Hypothesis: Reference System**
   - Modern parallel: GenBank, taxonomic nomenclature, library catalogs
   - Structural similarity: identifier constraint, section-specific terms
   - This has NEVER been systematically tested

### Research Gap
No quantitative comparison between [Your Subject] and reference/taxonomic
systems. All previous studies either assume decryption is possible or
focus on artificial language generation. None test whether the structure
itself encodes organizational information.

### Hypothesis & Research Questions
**Primary Hypothesis:**
The [Your Subject] Manuscript may encode a pre-modern taxonomic or reference
system with structural principles analogous to modern databases.

**Research Questions:**
1. Is [Your Subject] structure compatible with formal classification systems?
2. Can we quantify similarity to reference corpora?
3. What alternative explanations are ruled out?

### Research Significance
If correct, this reframes [Your Subject]ology from a cryptography problem to
a manuscript studies problem, inviting collaboration from historians,
paleographers, and information scientists.
```

### 2.4 Methods - highly detailed

#### Rule: "Someone reading only Methods should be able to replicate the study"

```markdown
## Methods

### 2.1 Data Sources

#### Primary Manuscript Data
Source: IT2a-n.txt (Landini-Stolfi EVA Transcription v2a)
Access: https://www.[your subject].nu/ (open access)
Format: EVA (European [Your Subject] Alphabet) standard notation
Coverage: f1r-f112v, 112 folios, 224 pages
Token count: 7,063 (calculated in Analysis section)
Character count: ~50,000 glyphs

**Why this source:**
IT2a-n.txt is the most widely-used scholarly transcription,
cross-referenced by Landini, Stolfi, Takahashi, and others.
Using a single primary source eliminates transcription variation
as a confound.

#### Metadata
Folio classification by section (Herbal, Botanical, Astronomical, etc.)
Currier language variant (Currier 1976)
Scribe hand classification (Fagin Davis 2013)
Yale Beinecke image IDs (2002046_1.jpg through 2002046_214.jpg)

#### Comparison Corpora

**Corpus A: English Natural Language (Baseline)**
```
Source: Wikipedia articles (Science & Technology category)
Sample size: 50,000 characters (matched to [Your Subject] size)
Selection criteria: Published 2010+, high-quality articles
Preprocessing: Lowercase, remove markup
Expected metrics: TTR ~42%, Word-final variety ~75%
```

**Corpus B: Botanical/Herbal Text (Subject Control)**
```
Source: Medieval herbal descriptions (Culpeper, Dioscorides translations)
Sample size: 10,000 tokens
Purpose: Control for subject-matter bias (botanical vocabulary)
Expected: TTR ~48%, Word-final ~80%
```

**Corpus C: Taxonomic/Catalog Structure (Hypothesis-Specific)**
```
Source: Linnaean nomenclature, museum catalog entries
Sample size: 5,000 entries
Purpose: Test if [Your Subject] resembles formal naming
Expected: TTR ~72%, Word-final ~89%
```

**Corpus D: Substitution Cipher (Alternative Hypothesis)**
```
Source: English text encrypted with Caesar cipher (k=3)
Sample size: 50,000 characters
Purpose: Compare against simple encryption hypothesis
Expected: TTR ~41% (preserved), Entropy ~7.2
```

**Corpus E: Random Text (Null Hypothesis)**
```
Source: Markov chain text using [Your Subject] unigram probabilities
Sample size: 50,000 characters
Purpose: Establish baseline for "no structure"
Expected: TTR ~95%, Entropy ~8.5
```

### 2.2 Parsing Protocol

#### Step-by-Step Line Parsing

**Input raw line:**
```
<f1r.P1.1;H> fachys.ykal.ar.ataiin.shol.shory.cth!res.y.kor.sholdy
```

**Processing:**

1. **Extract metadata**
   - folio_id: f1r
   - paragraph_number: 1
   - line_number: 1
   - quality_marker: H (high quality transcription)

2. **Segment by delimiters**
   - Primary: . (period) = word boundary
   - Secondary: ! (exclamation) = possible punctuation
   - Result: [fachys], [ykal], [ar], [ataiin], [shol], [shory], [cth!res], [y], [kor], [sholdy]

3. **Create token IDs**
   - token_id: f1r.P1.1.T001 through f1r.P1.1.T010
   - Enables complete traceability

4. **Extract glyphs with position**
   - For each token, map each character to its position
   - Store as: glyph_id, folio, line, token, glyph_position, character, eva_value

#### Critical Distinction: Physical Line vs. EVA Segment
**Problem:** In previous analysis, "Avg Len 1.0" was ambiguous.
**Solution:** We now track both:

```
physical_line_count: How many actual manuscript lines in this folio
eva_segment_count: How many . delimited segments
avg_glyphs_per_physical_line: Glyphs per actual manuscript line
avg_glyphs_per_eva_segment: Glyphs per . delimited unit

Example:
  Physical line: "fachys.ykal.ar.ataiin.shol" = 1 line
  EVA segments: 5 segments
  Avg per segment: 4.2 glyphs
  Avg per physical line: 21 glyphs
```

### 2.3 Statistical Methods

#### Character Frequency Analysis
```
Calculation: f_i = count(character_i) / total_characters
Test for non-uniformity: χ² goodness-of-fit
Null hypothesis (H0): All characters equally frequent
Alternative (H1): Some characters more frequent than others
Expected p < 0.001 if H1 true
```

#### Token Frequency & Distribution
```
Zipfian hypothesis test:
  H0: Frequency follows Zipfian distribution f ∝ r^(-α)
  Parameter: α estimated via maximum likelihood
  Natural language: α ≈ 1.0
  Random: α → 2.0
  
Type-Token Ratio (TTR):
  TTR = unique_tokens / total_tokens
  Normalized: TTR_1000 = TTR for every 1000 tokens
  Why: Different corpus sizes make raw TTR incomparable
  
Hapax ratio:
  Hapax = tokens appearing exactly once
  Used to distinguish: natural language (< 40%) vs catalog (> 45%)
```

#### Entropy Calculations
```
1-gram entropy:
  H(X) = -Σ_i p_i log₂(p_i)
  Units: bits per character
  
2-gram entropy:
  H(X,Y) = -Σ_i,j p_ij log₂(p_ij)
  
Conditional entropy:
  H(X|Y) = H(X,Y) - H(Y)
  Interpretation: How predictable is next char given current?
  
Benchmark values:
  English: H(X)=4.1, H(X,Y)=10.5, H(X|Y)=3.25
  Random: H(X)=4.25, H(X,Y)=8.5, H(X|Y)=4.2
  Cipher: H(X)=4.1, H(X,Y)=7.2, H(X|Y)=2.8
```

#### Position-Based Analysis
```
Line-initial tokens:
  All tokens at position = 1 within a physical line
  Frequency distribution compared to corpus average
  Test: χ² for independence
  
Word-final character constraint:
  For each token, examine last character
  Count how many end with {y, r, l, n, s, o, m, k}
  Calculate percentage
  Test: χ² against expected natural language distribution (75%)
  
Interpretation: > 90% constraint indicates formal system
```

#### Section Divergence Metric
```
For each section (Herbal, Botanical, Astronomical, etc.):
  1. Compute top-10 tokens by frequency
  2. Rank them 1-10
  3. For two sections, calculate rank correlation (Spearman ρ)
  4. Divergence = 1 - ρ
  
Interpretation:
  ρ = 1.0 (divergence = 0): Identical vocabulary
  ρ = 0.5 (divergence = 0.5): Moderately different
  ρ = 0.0 (divergence = 1.0): Completely different
  
English prose sections: divergence ~0.05 (similar everywhere)
Catalog sections: divergence ~0.35 (very different per section)
[Your Subject] prediction: divergence ~0.20-0.25 if hybrid structure
```

### 2.4 Multiple Comparisons Correction

**Critical:** Testing multiple hypotheses inflates Type I error (false positives).

**Bonferroni Correction:**
```
Original α = 0.05
Number of tests = 15 (character freq, entropy, section diverg, etc.)
Corrected α = 0.05 / 15 = 0.0033

Result: p < 0.0033 needed for significance
This controls family-wise error rate at 0.05
```

### 2.5 Effect Size Reporting (Never p-value alone!)

```
For 2-group comparison ([Your Subject] vs Corpus):
  Cohen's d = (mean1 - mean2) / pooled_SD
  Interpretation:
    d = 0.2: Small effect
    d = 0.5: Medium effect
    d = 0.8: Large effect
    d > 1.0: Very large effect
    
For categorical data (word-final constraint):
  Cramér's V = √(χ²/n(k-1))  where k=min(rows, cols)
  Interpretation:
    V = 0.1: Small effect
    V = 0.3: Medium effect
    V = 0.5: Large effect
    
Example report (GOOD):
  "Word-final constraint: 96.3% in [Your Subject] vs 75% in English
   [χ²(1) = 234.5, p < .001, Cramér's V = 0.42 (large effect)]"
   
Example report (BAD):
  "Word-final constraint differs significantly (p < .001)"
  [No effect size given; readers don't know if 1% or 50% difference]
```

### 2.6 Reproducibility Statement

Every methods section MUST end with:

```markdown
### Reproducibility

**Code & Data Availability:**
All analysis code, raw data, and comparison corpora are available at:
  https://github.com/zmjckim-fa/coolhan/tools/[your subject]-reference-analyzer
  License: MIT (code), CC0 (data)

**Computational Environment:**
  Python 3.9+
  pandas 1.5+
  scipy 1.9+
  SQLite 3.40+
  Dependencies: See requirements.txt

**Replication Instructions:**
  1. Clone repository
  2. Create virtual environment: python -m venv venv
  3. Install dependencies: pip install -r requirements.txt
  4. Run analysis: python scripts/01_parse_eva.py
  5. Generate report: python scripts/07_generate_report.py
  
**Estimated Runtime:** ~5 minutes on standard laptop (2020+)

**Data Provenance:**
  [Your Subject] EVA text: IT2a-n.txt (Landini-Stolfi v2a, accessed 2026-05-31)
  Yale images: https://brbl-dl.library.yale.edu/vufind/Record/3663539
  Comparison corpora: See Supplementary Methods
```

---

## 📊 Part 3: Results Section for International Journals

### 3.1 Quantitative Presentation Rules

```
Rule 1: ALWAYS report mean ± SD (or 95% CI)
  Bad:  "The average was 5.2"
  Good: "The mean was 5.2 characters (SD = 1.8, range = 1-14)"

Rule 2: ALWAYS report sample size
  Bad:  "Most tokens ended in specific characters"
  Good: "Of 6,892 tokens analyzed, 6,643 (96.3%) ended in 8 specific characters"

Rule 3: ALWAYS report both p-value AND effect size
  Bad:  "p < 0.001"
  Good: "p < 0.001, Cohen's d = 1.23 (very large effect)"

Rule 4: ALWAYS use exact p-values (not p < 0.05)
  Bad:  "p < 0.05"
  Good: "p = 0.0032" or "p < 0.001"

Rule 5: ALWAYS report confidence intervals
  Bad:  "The average was 5.2"
  Good: "The mean was 5.2 (95% CI = 5.0-5.4)"
```

### 3.2 Table Design (Nature/Science Standard)

#### ✅ GOOD Table
```
Table 1 | Structural Metrics Compared Across Corpora

Metric                | [Your Subject] | English | Catalog | Cipher  | Random
                      | (n=7063)| (n=50k) | (n=5k)  | (n=50k) | (n=50k)
─────────────────────────────────────────────────────────────────────────
Word-final constraint | 96.3%   | 75%     | 89%     | 50%     | 5%
  (% tokens ending in  | (SD=2.1)| (SD=5.3)| (SD=3.8)| (SD=6.1)| (SD=1.2)
  {y,r,l,n,s,o,m,k})  |         |         |         |         |

Type-Token Ratio      | 0.58    | 0.42    | 0.72    | 0.41    | 0.95
  (Unique/Total)      | (SE=0.02)|(SE=0.01)|(SE=0.03)|(SE=0.01)|(SE=0.04)

1-gram Entropy        | 3.81    | 4.15    | 3.65    | 4.10    | 4.25
  (bits/char)         | (SD=0.15)|(SD=0.20)|(SD=0.18)|(SD=0.17)|(SD=0.22)

2-gram Entropy        | 6.14    | 10.5    | 7.8     | 7.2     | 8.5
  (bits/bigram)       | (SD=0.22)|(SD=0.35)|(SD=0.28)|(SD=0.31)|(SD=0.40)

Section Divergence    | 0.23    | 0.05    | 0.35    | 0.12    | 0.02
  (Spearman ρ diff)   | (n=6)   | (n=6)   | (n=6)   | (n=6)   | (n=6)
─────────────────────────────────────────────────────────────────────────

Notes: SD = standard deviation. SE = standard error. Entropy reported
as mean ± 95% CI. [Your Subject] metrics computed on 112 folios (7,063 tokens).
English, Cipher, Random metrics computed on 50,000-character samples
matched to [Your Subject] sample size. Catalog metrics computed on 5,000 entries
representing distinct species/items. See Methods for corpus details.
```

#### ❌ BAD Table
```
Table 1 | Results

Metric          | [Your Subject] | English
Word-final      | 96.3%   | 75%
TTR             | 58%     | 42%
Entropy         | 6.14    | 10.5
```
(Missing: n, SD/SE, CI, units, details)

---

## 🌍 Part 4: Multilingual Abstracts

### International Journal Requirements
```
For Nature/Science submission:
  ✓ English (Primary)
  ✓ Author's native language (optional)
  ✓ 2-3 additional languages (depending on the journal)

eLife/PLOS ONE:
  ✓ English + author's chosen language

Highest standard (MLM - Multilingual Manuscript):
  ✓ 6 languages (EN, ZH, JA, KO, ES, DE)
  ✓ Equal information content in each language
  ✓ Professional translators (native speakers)
  ✓ Cultural adaptation (not mere translation)
```

#### Example: English abstract
```markdown
**Background:**
The [Your Subject] Manuscript, a 15th-century undeciphered manuscript,
presents an enduring cryptological and linguistic puzzle. Despite
500+ years of scholarly effort, no consensus explanation exists.

**Methods:**
Quantitative corpus analysis of 7,063 tokens across 112 folios,
comparing structural metrics with five comparison corpora.

**Results:**
Word-final character constraints (96.3%), token family clustering (9%),
and section vocabulary divergence (23%) are consistent with formal
classification systems but inconsistent with natural language (75%).

**Conclusion:**
Evidence suggests [Your Subject] may encode a reference/taxonomic system
rather than decipherable text. This reframes the problem from
"What language/cipher?" to "What information system?"
```

#### Example: Korean abstract (Korean-language slot)
```markdown
**Background:**
The [Your Subject] manuscript is a 15th-century undeciphered manuscript that has remained
a cryptological and linguistic puzzle for over 500 years.

**Methods:**
We performed a quantitative corpus analysis of 7,063 tokens across 112 folios,
compared against 5 comparison corpora.

**Results:**
Word-final character constraints (96.3%), token family clustering (9%), and
section-level vocabulary divergence (23%) are consistent with formal classification
systems but inconsistent with natural language (75%).

**Conclusion:**
The evidence suggests that [Your Subject] encodes a reference/classification system
rather than decipherable text. This reframes the problem from "What language/cipher?"
to "What information system?"
```

---

## ✅ Part 5: Peer Review Readiness Checklist

### 25 Questions Reviewer 1 Will Ask

```markdown
## Anticipated Reviewer Questions

### NOVELTY & SIGNIFICANCE
[ ] Q1: How is this different from previous [Your Subject] analyses?
    ANSWER: First quantitative comparison with reference/taxonomic systems
    
[ ] Q2: Why should general audience care?
    ANSWER: Opens new research direction in manuscript studies & information history

### METHODOLOGY & RIGOR
[ ] Q3: Why these specific corpora?
    ANSWER: See Methods 2.1; selected to test alternative hypotheses
    
[ ] Q4: Multiple comparisons problem?
    ANSWER: Bonferroni correction applied; see Methods 2.4
    
[ ] Q5: Effect size vs p-value?
    ANSWER: Both reported for all findings (see Results tables)
    
[ ] Q6: EVA transcription reliability?
    ANSWER: Used standard Landini-Stolfi v2a; see Supplementary Methods
    
[ ] Q7: How sensitive are results to parsing choices?
    ANSWER: Sensitivity analysis in Supplementary Results; findings robust

### DATA & REPRODUCIBILITY
[ ] Q8: All data publicly available?
    ANSWER: Yes, GitHub + supplementary materials
    
[ ] Q9: Code reproducibility?
    ANSWER: Full environment specs in Supplementary Methods;
           5-min replication time on standard laptop
    
[ ] Q10: Sample size adequate?
    ANSWER: n=7,063 tokens; power analysis in Supplementary Methods
            shows >0.95 power for observed effects

### STATISTICAL INTERPRETATION
[ ] Q11: "96.3% word-final constraint" - is this significant?
    ANSWER: χ²(1)=4521.3, p<0.001, Cramér's V=0.83 (very large effect);
           shows structure is non-random and extreme
    
[ ] Q12: Could this be transcriber bias?
    ANSWER: Addressed in Limitations; secondary analysis using Takahashi
           transcription (different transcriber) shows similar patterns

### ALTERNATIVE HYPOTHESES
[ ] Q13: Why not just a substitution cipher?
    ANSWER: Conditional entropy (2.33) too low for cipher (expected ~2.8);
           token families inconsistent with simple encryption
    
[ ] Q14: Artificial language explanation?
    ANSWER: Compatible with some evidence but doesn't explain
           section-specific vocabulary divergence
    
[ ] Q15: Could this be measurement artifact?
    ANSWER: Cross-validated with multiple corpus metrics; not dependent
           on any single measurement

### LIMITATIONS
[ ] Q16: Limited to transcription, not original?
    ANSWER: Acknowledged major limitation; future work requires images
    
[ ] Q17: What about manuscript damage/deterioration?
    ANSWER: Unknown; discussed in Limitations
    
[ ] Q18: Small comparison corpora?
    ANSWER: Acknowledged; normalized metrics & sensitivity analysis
           show robustness to corpus size variations

### FRAMING & CLAIMS
[ ] Q19: Do you claim to have deciphered the manuscript?
    ANSWER: NO. We test whether structure is compatible with reference
           systems, NOT whether content is decoded.
    
[ ] Q20: Overinterpreting "possible"?
    ANSWER: Careful to use "consistent with" / "compatible with" language;
           no claims of proof

### RELATED WORK
[ ] Q21: What does Rugg (2004) say about this?
    ANSWER: Rugg tested cipher; we test reference system (independent question)
    
[ ] Q22: Known prior art on taxonomic manuscript analysis?
    ANSWER: None in [Your Subject] literature; applies methods from corpus linguistics
           and information science

### BROADER IMPACT
[ ] Q23: Why this matters for manuscript studies?
    ANSWER: Could identify new class of pre-modern information systems;
           methods applicable to other undeciphered texts
    
[ ] Q24: Implications for cryptography/AI?
    ANSWER: Understanding information structure without content decryption
           has applications in pattern recognition and information theory
    
[ ] Q25: What's your next experiment?
    ANSWER: Image-based analysis (colors, layout), domain expert review
           (paleography, botany), Currier A/B sub-analysis (supplementary)
```

---

## 🎯 Part 6: Nature/Science Submission Checklist

### Before Hitting "Submit"

```markdown
CONTENT
[ ] Main text < 4000 words (excluding references, tables, figures)
[ ] Abstract < 150 words
[ ] Figure count ≤ 4 (Nature); ≤ 6 (Science)
[ ] Table count ≤ 3
[ ] All figures have legends (caption + explanation)
[ ] All tables have titles + footnotes

METHODOLOGY
[ ] Methods section: someone could replicate from this alone
[ ] All statistical tests named explicitly (test name + statistic + p-value + effect size)
[ ] Effect sizes reported for ALL main findings
[ ] Multiple comparisons correction documented
[ ] Power analysis included (why is n adequate?)
[ ] Blinding/randomization described (if applicable)
[ ] Pre-registration or statement of post-hoc analysis

DATA & CODE
[ ] All data accessible (GitHub, Zenodo, OSF, or SI)
[ ] Code runs on standard hardware (specify requirements)
[ ] License specified (CC0 for data, MIT/GPL for code)
[ ] README includes replication instructions
[ ] Computational time stated (~5 minutes)

WRITING
[ ] Figures tell story without reading text
[ ] Key finding in first paragraph of Results
[ ] Limitations section lists ≥5 specific limitations
[ ] No overclaiming ("possible" ≠ "proved")
[ ] Plain English (minimize jargon; explain when necessary)
[ ] Consistent terminology throughout

CITATIONS
[ ] All major claims have citations
[ ] Cited work includes recent (last 5 years) papers
[ ] Open-access preprints mentioned where relevant
[ ] Self-citations minimized (use if necessary, disclosed)

COMPLIANCE
[ ] No plagiarism (similarity index < 15% via Turnitin)
[ ] Ethics approval documented (if applicable)
[ ] Funding sources disclosed
[ ] Author contributions stated
[ ] Competing interests disclosed (even if "none")

FIGURES & TABLES
[ ] Figures are publication-ready resolution (300 dpi for print)
[ ] Color-blind accessible (no red-green only; provide color codes)
[ ] Black & white versions readable (important for printing)
[ ] Figure data available in supplementary
[ ] No cherry-picked data (show all relevant findings)

SUPPLEMENTARY MATERIALS
[ ] Full methodology details not in main text
[ ] Power analysis calculations
[ ] Sensitivity analyses
[ ] Robustness checks (alternative statistical tests)
[ ] Additional figures/tables
[ ] Raw data (if appropriate)

PRE-SUBMISSION REVIEW
[ ] 2+ colleagues read & gave feedback
[ ] Addressed all reviewer-like questions (Part 5)
[ ] Plagiarism check passed
[ ] References formatted correctly (Nature style)
[ ] Proofs read for typos & grammar
```

---

## 📜 Part 7: Multilingual Versions (6 Languages)

### Abstract Template per Language

```markdown
## English (Primary)
[Full abstract as above]

## 中文 (Simplified Chinese)
背景：...
方法：...
结果：...
结论：...

## 日本語 (Japanese)
背景：...
方法：...
結果：...
結論：...

## 한국어 (Korean)
배경：...
방법：...
결과：...
결론：...

## Español (Spanish)
Antecedentes：...
Métodos：...
Resultados：...
Conclusiones：...

## Deutsch (German)
Hintergrund：...
Methoden：...
Ergebnisse：...
Schlussfolgerungen：...
```

---

## 🏆 Part 8: Publication Tier Strategy

### Where to Submit (in order)

```
TIER 1 (Impact > 15) - Reach for the stars
  [ ] Nature
  [ ] Science
  [ ] PNAS
  Success rate: ~5-10%

TIER 2 (Impact 8-15) - Strong journals
  [ ] eLife
  [ ] Nature Communications
  [ ] Science Advances
  Success rate: ~20-30%

TIER 3 (Impact 3-8) - Reliable journals
  [ ] PLOS ONE
  [ ] Frontiers in
  [ ] Journal of [Discipline]
  Success rate: ~50-60%

BACKUP (Impact < 3) - Always an option
  [ ] Preprint (arXiv, bioRxiv)
  [ ] Disciplinary repository
  Success rate: 100%
```

### Selection Criteria
```
Choose Nature/Science?
  ✓ YES if: Truly novel, significant, broadly interesting, perfect methods
  ✗ NO if: Incremental, narrow, preliminary, methodological concerns

Choose eLife/Nature Comms?
  ✓ YES if: Solid research, clear findings, some novelty
  ✗ NO if: Not publication-ready, needs major revisions

Choose PLOS ONE?
  ✓ YES if: Methodologically sound, but not trendy/novel enough for tier 2
  ✗ NO if: Fundamental flaws that should be fixed first
```

---

**Final checklist:**

```
✅ BEFORE SUBMISSION:
  [ ] Have 2+ colleagues reviewed (not co-authors)?
  [ ] Addressed all 25 anticipated reviewer questions?
  [ ] Reproducibility < 10 minutes on standard laptop?
  [ ] All data/code publicly available with clear license?
  [ ] No plagiarism (< 15% similarity)?
  [ ] English check by native speaker?
  [ ] Figures publication-ready?
  [ ] Limitations explicitly stated (≥5)?
  [ ] No overclaiming?
  [ ] Effect sizes reported for all main findings?
```

Passing this checklist means your submission is ready at the Nature/Science level.
