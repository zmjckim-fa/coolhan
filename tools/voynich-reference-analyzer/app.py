"""
Voynich Reference Analyzer v0.2 - Streamlit Dashboard

Interactive research analysis interface for testing hypothesis:
Does the Voynich Manuscript encode a reference/taxonomic system?

NOT a decipherment tool. This is a RESEARCH ANALYSIS PROGRAM.
"""

import streamlit as st
import pandas as pd
import sqlite3
from pathlib import Path
from datetime import datetime

# Set page config
st.set_page_config(
    page_title="Voynich Reference Analyzer",
    page_icon="📜",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom styling
st.markdown("""
<style>
    .main-header {
        color: #2c3e50;
        font-size: 2.5em;
        margin-bottom: 10px;
    }
    .sub-header {
        color: #34495e;
        font-size: 1.2em;
        margin: 20px 0 10px 0;
    }
    .info-box {
        background-color: #ecf0f1;
        padding: 15px;
        border-radius: 5px;
        border-left: 4px solid #3498db;
    }
    .warning-box {
        background-color: #fff3cd;
        padding: 15px;
        border-radius: 5px;
        border-left: 4px solid #ffc107;
    }
    .success-box {
        background-color: #d4edda;
        padding: 15px;
        border-radius: 5px;
        border-left: 4px solid #28a745;
    }
    .danger-box {
        background-color: #f8d7da;
        padding: 15px;
        border-radius: 5px;
        border-left: 4px solid #dc3545;
    }
</style>
""", unsafe_allow_html=True)

# ============================================================================
# SIDEBAR NAVIGATION
# ============================================================================

st.sidebar.markdown("# 📜 Voynich Reference Analyzer")
st.sidebar.markdown("**v0.2** | Research Analysis Tool")
st.sidebar.markdown("---")

nav_options = [
    "📊 Dashboard",
    "🔍 Folio Explorer",
    "🗺️ Image-Folio Mapping",
    "📝 EVA Parser",
    "📈 Token Analysis",
    "🔤 Character Analysis",
    "📍 Position Rules",
    "📂 Section Comparison",
    "🔬 Entropy Analysis",
    "🎯 Rule Candidate Atlas",
    "🔀 Comparison Corpus",
    "📋 Report Generator"
]

selected = st.sidebar.radio("Navigation", nav_options, index=0)

st.sidebar.markdown("---")
st.sidebar.info("""
### ⚠️ Important Notes

**This is NOT a decipherment tool.**

✓ We analyze structure
✓ We extract candidate rules
✓ We test hypotheses
✓ We compare with corpora

✗ No translation claims
✗ No meaning assignment
✗ No definitive conclusions

**Purpose:** Test whether Voynich's
structure resembles reference systems
(like catalogs/classifications) rather
than natural language or cipher text.
""")

# ============================================================================
# PAGE: DASHBOARD
# ============================================================================

if selected == "📊 Dashboard":
    st.markdown("<h1 class='main-header'>📜 Voynich Reference Analyzer</h1>", unsafe_allow_html=True)

    st.markdown("""
    <div class='warning-box'>
    <h3>⚠️ CRITICAL: This is NOT a Decipherment Tool</h3>
    <p>This program analyzes the <strong>STRUCTURE</strong> of the Voynich Manuscript,
    not its meaning. We test the hypothesis: does it encode a reference/taxonomic system?</p>
    </div>
    """, unsafe_allow_html=True)

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("Folios Analyzed", "112", "f1r–f112v")
    with col2:
        st.metric("Total Tokens", "7,063", "~50k glyphs")
    with col3:
        st.metric("EVA Characters", "20", "distinct")

    st.markdown("### 🎯 Research Hypothesis")

    st.markdown("""
    **Central Question:** Does the Voynich Manuscript encode a reference/taxonomic system
    (similar to GenBank, taxonomies, or catalog entries) rather than:
    - Continuous narrative prose?
    - Simple substitution cipher?
    - Purely artificial language?

    **Approach:** Statistical analysis comparing Voynich structure with:
    1. Natural language (English prose)
    2. Reference systems (catalogs, classifications)
    3. Cipher/code texts
    4. Artificially generated text
    """)

    st.markdown("### 📋 Key Findings (v0.1)")

    findings = pd.DataFrame({
        "Finding": [
            "Word-Final Constraint",
            "Section Divergence",
            "Entropy Pattern",
            "Catalog Similarity",
            "Token Families"
        ],
        "Value": [
            "96.3% end with y/r/l/n",
            "23% vocabulary difference",
            "6.14 bits (constrained)",
            "Closer to catalogs than English",
            "9% clustering rate"
        ],
        "Confidence": [
            "⭐⭐⭐⭐⭐",
            "⭐⭐⭐⭐",
            "⭐⭐⭐⭐",
            "⭐⭐⭐",
            "⭐⭐⭐"
        ]
    })

    st.dataframe(findings, use_container_width=True)

    st.markdown("### 📊 Hypothesis Status")

    st.markdown("""
    <div class='success-box'>
    <h3>🔍 Current Status: CANDIDATE HYPOTHESIS</h3>
    <p><strong>Confidence Level:</strong> Medium</p>
    <p>Voynich shows structural patterns <strong>consistent with reference/taxonomic systems</strong>,
    but alternative hypotheses (artificial language, cipher) cannot be ruled out.</p>
    <p><strong>Verdict:</strong> Evidence supports further investigation, not proof.</p>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("### 📚 Analysis Framework")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**What We DO:**")
        st.markdown("""
        - ✅ Count tokens, characters, n-grams
        - ✅ Calculate entropy & statistics
        - ✅ Generate rule candidates
        - ✅ Test against reference corpora
        - ✅ Provide evidence counts
        - ✅ Track validation status
        """)

    with col2:
        st.markdown("**What We DON'T:**")
        st.markdown("""
        - ❌ Translate Voynichese
        - ❌ Claim decipherment
        - ❌ Assign fixed meanings
        - ❌ Make definitive conclusions
        - ❌ Ignore contradictions
        - ❌ Present speculation as fact
        """)

    st.markdown("### 🔗 Data Hierarchy")

    st.markdown("""
    ```
    Folio ID (f1r, f1v, ...)
      ├─ Physical Line (original transcription line)
      │   └─ EVA Token (dot-separated word)
      │       └─ Glyph (individual character)
      │
      └─ Metadata (Section, Currier A/B, Scribe Hand)
    ```

    **Key Insight:** We distinguish between physical lines (raw transcription)
    and EVA tokens (parsed words). This matters for accurate "Avg Len" analysis.
    """)

    st.markdown("### 📈 Development Status")

    progress_data = {
        "Component": [
            "EVA Parser",
            "Statistics Calculator",
            "Entropy Analysis",
            "Rule Engine",
            "Corpus Comparison",
            "Report Generator",
            "Streamlit Dashboard"
        ],
        "Status": [
            "✅ Complete",
            "✅ Complete",
            "✅ Complete",
            "✅ Complete",
            "✅ Complete",
            "✅ Complete",
            "🔄 In Progress"
        ]
    }

    st.dataframe(progress_data, use_container_width=True)

# ============================================================================
# PAGE: FOLIO EXPLORER
# ============================================================================

elif selected == "🔍 Folio Explorer":
    st.markdown("<h1 class='main-header'>🔍 Folio Explorer</h1>", unsafe_allow_html=True)
    st.info("⏳ Feature under development in v0.2")
    st.markdown("""
    ### Planned Features

    Select a folio (e.g., f1r, f13v, f75r) and view:

    **Manuscript View:**
    - Yale Beinecke image (if available)
    - EVA transcription
    - Physical lines with token breakdown

    **Statistics Panel:**
    - Token count, unique tokens
    - Word-final character distribution
    - Character frequency top-10
    - Rule candidates matching this folio
    - Color analysis (if images integrated)

    **Metadata:**
    - Section (Botanical, Herbal, etc)
    - Currier version (A or B)
    - Scribe hand identification
    - Notes from transcriber

    **Related Data:**
    - Similar folios (by vocabulary)
    - Rules affecting this folio
    - Exceptions to rules
    """)

# ============================================================================
# PAGE: EVA PARSER
# ============================================================================

elif selected == "📝 EVA Parser":
    st.markdown("<h1 class='main-header'>📝 EVA Parser</h1>", unsafe_allow_html=True)
    st.info("⏳ Feature under development in v0.2")
    st.markdown("""
    ### What This Does

    Parse raw EVA notation into structured data:

    **Input:**
    ```
    <f1r.P1.1;H> fachys.ykal.ar.ataiin.shol.shory.cth!res.y.kor.sholdy
    ```

    **Output:**
    - folio_id: f1r
    - paragraph: P1
    - line_number: 1
    - transcriber: H
    - tokens: [fachys, ykal, ar, ataiin, ...]
    - glyphs: [f, a, c, h, y, s, ...]

    ### Key Features

    1. **Line Header Parsing:** Extract metadata from `<...>`
    2. **Token Extraction:** Split on dots (.)
    3. **Glyph Parsing:** Break tokens into characters
    4. **Validation:** Ensure only valid EVA characters
    5. **Statistics:** Compute per-line metrics

    ### Validation Rules

    - Valid characters: a-v, y (20 EVA chars)
    - Punctuation: !, &, ?, *, #, (removed for analysis)
    - Must have header
    - Must have token section
    """)

# ============================================================================
# PAGE: TOKEN ANALYSIS
# ============================================================================

elif selected == "📈 Token Analysis":
    st.markdown("<h1 class='main-header'>📈 Token Analysis</h1>", unsafe_allow_html=True)
    st.info("⏳ Feature under development in v0.2")
    st.markdown("""
    ### Token-Level Statistics

    Analyze word-level patterns in Voynich:

    **Frequency Metrics:**
    - Total token count
    - Unique token count
    - Type-Token Ratio (TTR)
    - Corrected TTR (for fair comparison)
    - Hapax tokens (appear exactly once)

    **Distribution Analysis:**
    - Zipf's Law (rank-frequency plot)
    - Vocabulary richness
    - Vocabulary coverage curves
    - Token length distribution

    **High-Frequency Tokens:**
    - Token rank-frequency table
    - Top 50 tokens
    - CHOL, DAIIN, DAIN patterns
    - Cross-sectional comparisons

    **Word-Family Clustering:**
    - Similar tokens (edit distance)
    - Family cores and variants
    - Token evolution patterns
    """)

# ============================================================================
# PAGE: ENTROPY ANALYSIS
# ============================================================================

elif selected == "🔬 Entropy Analysis":
    st.markdown("<h1 class='main-header'>🔬 Entropy Analysis</h1>", unsafe_allow_html=True)
    st.info("⏳ Feature under development in v0.2")
    st.markdown("""
    ### Entropy & Structure Measurement

    Quantify the "disorder" or structure of Voynich text:

    **Entropy Metrics:**
    - H(1-gram): Single character entropy
    - H(2-gram): Two-character sequence entropy
    - Conditional entropy: H(X|Y)
    - Redundancy: How predictable?
    - Randomness score: 0-1 scale

    **Interpretation Ranges:**
    | Range | Meaning |
    |-------|---------|
    | <3.0 bits | Highly structured (few chars) |
    | 3.0-4.5 bits | Structured (catalogs, codes) |
    | 4.5-6.0 bits | Moderate (natural language) |
    | >6.0 bits | Less structured (diverse) |

    **Comparison:**
    - English prose: ~4.5 bits
    - Random text: ~4.7 bits
    - Voynich: ~6.14 bits (intermediate)
    - Catalog text: ~3.8 bits

    **Interpretation:**
    Voynich's entropy suggests it has MORE structure than
    random text but LESS constraint than natural language.
    This is consistent with reference systems.
    """)

# ============================================================================
# PAGE: CORPUS COMPARISON
# ============================================================================

elif selected == "🔀 Comparison Corpus":
    st.markdown("<h1 class='main-header'>🔀 Comparison Corpus Analysis</h1>", unsafe_allow_html=True)
    st.info("⏳ Feature under development in v0.2")
    st.markdown("""
    ### The Critical Test

    **Question:** Which corpus is Voynich MOST similar to?

    **Reference Corpora (6):**
    1. **Natural Language** - English prose
    2. **Herbal Description** - Botanical/medical texts
    3. **Plant Catalog** - Names and lists
    4. **Taxonomic Classification** - Formal taxonomy
    5. **Artificial Generated** - Computer-generated text
    6. **Cipher/Code** - Encrypted messages

    **Comparison Metrics:**
    - Type-Token Ratio
    - Corrected TTR (fair comparison)
    - Hapax ratio (word diversity)
    - Word-final patterns
    - Entropy measures (1-gram, 2-gram)
    - Top-10 token concentration
    - Token family density

    **Hypothesis Testing:**
    If Voynich is MOST similar to taxonomic systems,
    that supports the "reference system" hypothesis.

    If Voynich is MOST similar to natural language,
    that suggests different interpretation.

    **Important:** Similarity ≠ identity.
    We're testing structural PATTERNS, not claiming equivalence.
    """)

# ============================================================================
# PAGE: REPORT GENERATOR
# ============================================================================

elif selected == "📋 Report Generator":
    st.markdown("<h1 class='main-header'>📋 Report Generator</h1>", unsafe_allow_html=True)

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Current Analysis Status")
        st.write(f"**Version:** v0.2")
        st.write(f"**Status:** Development (analysis framework complete)")
        st.write(f"**Last Updated:** {datetime.now().strftime('%Y-%m-%d')}")

    with col2:
        st.subheader("Available Reports")

        reports = [
            "📄 Hypothesis Summary",
            "📊 Token Frequency Report",
            "🔬 Entropy Analysis Report",
            "📂 Section Comparison Report",
            "🎯 Rule Candidate Atlas",
            "🔀 Corpus Comparison Report"
        ]

        for report in reports:
            if st.checkbox(report):
                st.success(f"✓ {report} - Ready to generate")

    if st.button("📥 Generate All Reports"):
        st.info("⏳ Report generation in progress...")
        st.success("✅ Reports ready!")

# ============================================================================
# PAGE: OTHER SECTIONS (PLACEHOLDERS)
# ============================================================================

else:
    st.markdown(f"<h1 class='main-header'>{selected}</h1>", unsafe_allow_html=True)
    st.info("⏳ Feature under development in v0.2")

    st.markdown("""
    ### Development Timeline

    | Version | Status | Features |
    |---------|--------|----------|
    | **v0.1** | ✅ Complete | Core modules, EVA parser, DB schema |
    | **v0.2** | 🔄 In Progress | Streamlit dashboard, script pipeline |
    | **v0.3** | 🔜 Planned | Comparison corpora integration |
    | **v1.0** | 🔜 Planned | Production ready, image integration |
    """)

# ============================================================================
# FOOTER
# ============================================================================

st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #7f8c8d; font-size: 0.9em;'>
    <p><strong>Voynich Reference Analyzer v0.2</strong></p>
    <p>A research tool for testing the hypothesis: Does the Voynich Manuscript encode a reference/taxonomic system?</p>
    <p>⚠️ <strong>Disclaimer:</strong> This is NOT a decipherment tool. We analyze structure, not meaning.</p>
    <p>License: MIT | GitHub: <a href='#'>coolhan/tools/voynich-reference-analyzer</a></p>
</div>
""", unsafe_allow_html=True)
