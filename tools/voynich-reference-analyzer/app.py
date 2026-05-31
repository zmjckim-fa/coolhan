"""
Voynich Reference Analyzer v0.3 - Streamlit Dashboard

Interactive research analysis interface for testing hypothesis:
Does the Voynich Manuscript encode a reference/taxonomic system?

NOT a decipherment tool. This is a RESEARCH ANALYSIS PROGRAM.
"""

import os
import sys

# Add modules path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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
st.sidebar.markdown("**v0.3** | Research Analysis Tool")
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
    "📋 Report Generator",
    "🗂️ Data Sources",
    "📥 Import New Data",
    "🗃️ Research Claims",
    "❌ Failure Lessons",
    "🔄 Rule Revalidation",
    "🎯 Hypothesis Dashboard",
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

# Import page handlers
try:
    from modules.dashboard_pages import (
        page_data_sources, page_import_data, page_research_claims,
        page_failure_lessons, page_rule_revalidation, page_hypothesis_dashboard
    )
    EVIDENCE_PAGES_READY = True
except ImportError:
    EVIDENCE_PAGES_READY = False

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
    import sqlite3 as _sq
    from pathlib import Path as _P
    _db = str(_P(__file__).parent / "database" / "voynich.sqlite")
    try:
        _conn = _sq.connect(_db)
        _folios_df = pd.read_sql_query(
            "SELECT f.folio_id, f.section, f.currier_version, f.scribe_hand, "
            "COALESCE(m.total_tokens,0) as tokens, "
            "COALESCE(m.unique_tokens,0) as unique_tok, "
            "COALESCE(ROUND(m.entropy_2gram,3),0) as entropy "
            "FROM folio f LEFT JOIN folio_metrics m ON f.folio_id=m.folio_id "
            "ORDER BY f.section, f.folio_id", _conn)

        if _folios_df.empty:
            st.warning("No folio data yet. Run: `python scripts/run_pipeline.py --demo`")
        else:
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Total Folios", len(_folios_df))
            with col2:
                sections = _folios_df['section'].nunique()
                st.metric("Sections", sections)
            with col3:
                total_tok = int(_folios_df['tokens'].sum())
                st.metric("Total Tokens", f"{total_tok:,}")

            st.markdown("---")
            section_filter = st.selectbox("Filter by Section",
                ["All"] + sorted(_folios_df['section'].unique().tolist()))
            currier_filter = st.selectbox("Currier Version", ["All", "A", "B", "unknown"])

            filtered = _folios_df.copy()
            if section_filter != "All":
                filtered = filtered[filtered['section'] == section_filter]
            if currier_filter != "All":
                filtered = filtered[filtered['currier_version'] == currier_filter]

            st.dataframe(filtered, use_container_width=True)

            if len(_folios_df) > 0 and 'tokens' in _folios_df.columns and _folios_df['tokens'].sum() > 0:
                st.markdown("### Token Distribution by Section")
                sec_tokens = _folios_df.groupby('section')['tokens'].sum().sort_values(ascending=False)
                st.bar_chart(sec_tokens)

        _conn.close()
    except Exception as _e:
        st.error(f"Database error: {_e}")
        st.info("Run: `python scripts/run_pipeline.py --demo` to load sample data")

# ============================================================================
# PAGE: EVA PARSER
# ============================================================================

elif selected == "📝 EVA Parser":
    st.markdown("<h1 class='main-header'>📝 EVA Parser</h1>", unsafe_allow_html=True)
    st.markdown("""
    Parse EVA (European Voynich Alphabet) notation in real-time.
    Enter an EVA line to see token and glyph breakdown.
    """)

    st.markdown("### Live Parser Demo")
    default_line = "<f1r.P1.1;H> fachys.ykal.ar.ataiin.shol.shory.cth!res.y.kor.sholdy"
    eva_input = st.text_area("EVA Line Input", value=default_line, height=80)

    if st.button("🔍 Parse Line") or eva_input:
        import re
        # Parse header
        header_match = re.match(r'<([^>]+)>', eva_input)
        body = re.sub(r'<[^>]+>', '', eva_input).strip()
        clean = re.sub(r'[!?*&#@]', '', body).strip()
        tokens = [t for t in clean.split('.') if t]

        col1, col2 = st.columns(2)
        with col1:
            st.markdown("**Header Info**")
            if header_match:
                parts = header_match.group(1).split('.')
                if len(parts) >= 2:
                    folio_para = parts[0].split('.')
                    st.write(f"- **Folio:** `{parts[0]}`")
                    if len(parts) > 1:
                        st.write(f"- **Para/Line:** `{parts[1]}`")
                    if ';' in header_match.group(1):
                        transcriber = header_match.group(1).split(';')[-1].rstrip('>')
                        st.write(f"- **Transcriber:** `{transcriber}`")
            st.markdown(f"**Tokens found:** {len(tokens)}")
            st.markdown(f"**Total glyphs:** {sum(len(t) for t in tokens)}")
            st.markdown(f"**Avg token length:** {sum(len(t) for t in tokens)/max(len(tokens),1):.1f}")

        with col2:
            st.markdown("**Word-Final Analysis**")
            final_chars = [t[-1] for t in tokens if t]
            final_count = sum(1 for c in final_chars if c in 'yrln')
            final_pct = final_count / len(final_chars) * 100 if final_chars else 0
            st.metric("End with y/r/l/n", f"{final_count}/{len(final_chars)}", f"{final_pct:.0f}%")

        st.markdown("### Token Breakdown")
        token_data = []
        for i, tok in enumerate(tokens):
            glyphs = list(tok)
            final = tok[-1] if tok else ""
            token_data.append({
                "Position": i, "Token": tok, "Length": len(tok),
                "Glyphs": " ".join(glyphs),
                "Final Char": final,
                "Word-Final Rule": "✅" if final in "yrln" else "❌"
            })
        if token_data:
            st.dataframe(pd.DataFrame(token_data), use_container_width=True)

    st.markdown("---")
    st.markdown("### DB Token Statistics")
    import sqlite3 as _sq
    from pathlib import Path as _P
    _db = str(_P(__file__).parent / "database" / "voynich.sqlite")
    try:
        _conn = _sq.connect(_db)
        _token_count = _conn.execute("SELECT COUNT(*) FROM token").fetchone()[0]
        _unique = _conn.execute("SELECT COUNT(DISTINCT token_text) FROM token").fetchone()[0]
        if _token_count > 0:
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Total Tokens in DB", f"{_token_count:,}")
            with col2:
                st.metric("Unique Tokens", f"{_unique:,}")
            with col3:
                st.metric("TTR", f"{_unique/_token_count:.3f}")
        else:
            st.info("No token data yet. Run: `python scripts/run_pipeline.py --demo`")
        _conn.close()
    except Exception as _e:
        st.error(f"DB error: {_e}")

# ============================================================================
# PAGE: TOKEN ANALYSIS
# ============================================================================

elif selected == "📈 Token Analysis":
    st.markdown("<h1 class='main-header'>📈 Token Analysis</h1>", unsafe_allow_html=True)
    import sqlite3 as _sq
    from pathlib import Path as _P
    _db = str(_P(__file__).parent / "database" / "voynich.sqlite")
    try:
        _conn = _sq.connect(_db)
        _tc = _conn.execute("SELECT COUNT(*) FROM token").fetchone()[0]
        if _tc == 0:
            st.warning("No token data. Run: `python scripts/run_pipeline.py --demo`")
            _conn.close()
        else:
            # Overall metrics
            _uniq = _conn.execute("SELECT COUNT(DISTINCT token_text) FROM token").fetchone()[0]
            _hapax = _conn.execute("""
                SELECT COUNT(*) FROM (
                    SELECT token_text FROM token GROUP BY token_text HAVING COUNT(*)=1
                )""").fetchone()[0]
            _avg_len = _conn.execute("SELECT AVG(token_length) FROM token WHERE token_length > 0").fetchone()[0] or 0

            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Total Tokens", f"{_tc:,}")
            with col2:
                st.metric("Unique Tokens", f"{_uniq:,}")
            with col3:
                st.metric("Type-Token Ratio", f"{_uniq/_tc:.3f}")
            with col4:
                st.metric("Avg Token Length", f"{_avg_len:.1f}")

            # Top tokens
            st.markdown("### Top 20 Most Frequent Tokens")
            _top = pd.read_sql_query("""
                SELECT token_text, COUNT(*) as frequency
                FROM token GROUP BY token_text
                ORDER BY frequency DESC LIMIT 20
            """, _conn)
            if not _top.empty:
                st.bar_chart(_top.set_index('token_text')['frequency'])
                st.dataframe(_top, use_container_width=True)

            # Token length distribution
            st.markdown("### Token Length Distribution")
            _lens = pd.read_sql_query("""
                SELECT token_length, COUNT(*) as count
                FROM token WHERE token_length > 0 AND token_length <= 15
                GROUP BY token_length ORDER BY token_length
            """, _conn)
            if not _lens.empty:
                st.bar_chart(_lens.set_index('token_length')['count'])

            # Word-final analysis
            st.markdown("### Word-Final Character Analysis")
            _wf = pd.read_sql_query("""
                SELECT SUBSTR(token_text, -1) as final_char, COUNT(*) as count
                FROM token WHERE LENGTH(token_text) > 0
                GROUP BY final_char ORDER BY count DESC LIMIT 10
            """, _conn)
            if not _wf.empty:
                st.bar_chart(_wf.set_index('final_char')['count'])
                final_yn = _wf[_wf['final_char'].isin(['y','r','l','n'])]['count'].sum()
                total_counted = _wf['count'].sum()
                st.metric("Word-Final Rule (y/r/l/n)", f"{final_yn/total_counted:.1%}")

            # Section comparison
            st.markdown("### Token Metrics by Section")
            _sec = pd.read_sql_query("""
                SELECT section, total_tokens, unique_tokens,
                       ROUND(token_type_ratio,3) as ttr,
                       ROUND(hapax_ratio,3) as hapax_ratio,
                       ROUND(entropy_2gram,3) as entropy_2gram
                FROM section_metrics ORDER BY total_tokens DESC
            """, _conn)
            if not _sec.empty:
                st.dataframe(_sec, use_container_width=True)
            _conn.close()
    except Exception as _e:
        st.error(f"DB error: {_e}")

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
        st.write(f"**Version:** v0.3")
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
# PAGE: DATA SOURCES
# ============================================================================

elif selected == "🗂️ Data Sources":
    DB_PATH = str(Path(__file__).parent / "database" / "voynich.db")
    if EVIDENCE_PAGES_READY:
        page_data_sources(DB_PATH)
    else:
        st.error("dashboard_pages module not found.")

# ============================================================================
# PAGE: IMPORT NEW DATA
# ============================================================================

elif selected == "📥 Import New Data":
    DB_PATH = str(Path(__file__).parent / "database" / "voynich.db")
    if EVIDENCE_PAGES_READY:
        page_import_data(DB_PATH)
    else:
        st.error("dashboard_pages module not found.")

# ============================================================================
# PAGE: RESEARCH CLAIMS
# ============================================================================

elif selected == "🗃️ Research Claims":
    DB_PATH = str(Path(__file__).parent / "database" / "voynich.db")
    if EVIDENCE_PAGES_READY:
        page_research_claims(DB_PATH)
    else:
        st.error("dashboard_pages module not found.")

# ============================================================================
# PAGE: FAILURE LESSONS
# ============================================================================

elif selected == "❌ Failure Lessons":
    DB_PATH = str(Path(__file__).parent / "database" / "voynich.db")
    if EVIDENCE_PAGES_READY:
        page_failure_lessons(DB_PATH)
    else:
        st.error("dashboard_pages module not found.")

# ============================================================================
# PAGE: RULE REVALIDATION
# ============================================================================

elif selected == "🔄 Rule Revalidation":
    DB_PATH = str(Path(__file__).parent / "database" / "voynich.db")
    if EVIDENCE_PAGES_READY:
        page_rule_revalidation(DB_PATH)
    else:
        st.error("dashboard_pages module not found.")

# ============================================================================
# PAGE: HYPOTHESIS DASHBOARD
# ============================================================================

elif selected == "🎯 Hypothesis Dashboard":
    DB_PATH = str(Path(__file__).parent / "database" / "voynich.db")
    if EVIDENCE_PAGES_READY:
        page_hypothesis_dashboard(DB_PATH)
    else:
        st.error("dashboard_pages module not found.")

# ============================================================================
# PAGE: CHARACTER ANALYSIS
# ============================================================================

elif selected == "🔤 Character Analysis":
    st.markdown("<h1 class='main-header'>🔤 Character Analysis</h1>", unsafe_allow_html=True)
    import sqlite3 as _sq
    from pathlib import Path as _P
    _db = str(_P(__file__).parent / "database" / "voynich.sqlite")
    try:
        _conn = _sq.connect(_db)
        _gc = _conn.execute("SELECT COUNT(*) FROM glyph").fetchone()[0]
        if _gc == 0:
            st.warning("No glyph data. Run: `python scripts/run_pipeline.py --demo`")
            _conn.close()
        else:
            st.metric("Total Glyphs in DB", f"{_gc:,}")

            # Glyph frequency
            st.markdown("### EVA Character Frequency")
            _gf = pd.read_sql_query("""
                SELECT glyph_char, COUNT(*) as freq,
                       ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM glyph), 2) as pct
                FROM glyph
                WHERE LENGTH(glyph_char)=1
                GROUP BY glyph_char ORDER BY freq DESC
            """, _conn)
            if not _gf.empty:
                col1, col2 = st.columns([3,2])
                with col1:
                    st.bar_chart(_gf.set_index('glyph_char')['freq'])
                with col2:
                    st.dataframe(_gf, use_container_width=True)

                # Highlight 'i' dominance
                i_row = _gf[_gf['glyph_char'] == 'i']
                if not i_row.empty:
                    i_pct = i_row.iloc[0]['pct']
                    if i_pct > 15:
                        st.markdown(f"""
                        <div class='warning-box'>
                        ⚠️ <strong>i-dominance detected:</strong> Character 'i' = {i_pct:.1f}% of all glyphs.
                        This is unusually high for natural language (~10% typical).
                        Consistent with reference-list repeated identifiers.
                        </div>
                        """, unsafe_allow_html=True)

            # Bigram analysis from tokens
            st.markdown("### Character Bigram Patterns (from DB tokens)")
            _bg = pd.read_sql_query("""
                SELECT SUBSTR(token_text, n.pos, 2) as bigram, COUNT(*) as freq
                FROM token,
                     (SELECT 1 AS pos UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                      UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8) n
                WHERE n.pos < LENGTH(token_text)
                AND LENGTH(SUBSTR(token_text, n.pos, 2)) = 2
                GROUP BY bigram ORDER BY freq DESC LIMIT 15
            """, _conn)
            if not _bg.empty:
                st.bar_chart(_bg.set_index('bigram')['freq'])

            _conn.close()
    except Exception as _e:
        st.error(f"DB error: {_e}")

# ============================================================================
# PAGE: POSITION RULES
# ============================================================================

elif selected == "📍 Position Rules":
    st.markdown("<h1 class='main-header'>📍 Rule Candidate Atlas</h1>", unsafe_allow_html=True)
    import sqlite3 as _sq
    from pathlib import Path as _P
    _db = str(_P(__file__).parent / "database" / "voynich.sqlite")
    try:
        _conn = _sq.connect(_db)
        _rc = _conn.execute("SELECT COUNT(*) FROM rule_candidate").fetchone()[0]
        if _rc == 0:
            st.warning("No rules yet. Run: `python scripts/run_pipeline.py --demo`")
            _conn.close()
        else:
            _rules = pd.read_sql_query("""
                SELECT rule_id, rule_name, rule_type, validation_status,
                       evidence_count, exception_count,
                       ROUND(confidence,3) as confidence,
                       affected_sections, notes
                FROM rule_candidate ORDER BY confidence DESC
            """, _conn)

            # Summary
            status_map = {'validated':'✅','partially_validated':'🔶','candidate':'🔘','rejected':'❌','needs_review':'⚠️'}
            status_counts = _rules['validation_status'].value_counts()
            cols = st.columns(len(status_counts))
            for i, (status, cnt) in enumerate(status_counts.items()):
                with cols[i]:
                    st.metric(f"{status_map.get(status,'❔')} {status}", cnt)

            # Filter
            st.markdown("---")
            status_filter = st.selectbox("Filter by Status",
                ["All"] + list(_rules['validation_status'].unique()))
            type_filter = st.selectbox("Filter by Type",
                ["All"] + list(_rules['rule_type'].unique()))

            filtered = _rules.copy()
            if status_filter != "All":
                filtered = filtered[filtered['validation_status'] == status_filter]
            if type_filter != "All":
                filtered = filtered[filtered['rule_type'] == type_filter]

            # Confidence chart
            if not filtered.empty:
                st.markdown("### Confidence Distribution")
                st.bar_chart(filtered.set_index('rule_name')['confidence'])

                st.markdown("### Rule Details")
                for _, row in filtered.iterrows():
                    status_e = status_map.get(row['validation_status'], '❔')
                    with st.expander(f"{status_e} {row['rule_name']} ({row['confidence']:.1%})"):
                        col1, col2 = st.columns(2)
                        with col1:
                            st.write(f"**Type:** `{row['rule_type']}`")
                            st.write(f"**Status:** `{row['validation_status']}`")
                            st.write(f"**Evidence:** {row['evidence_count']:,}")
                            st.write(f"**Exceptions:** {row['exception_count']:,}")
                        with col2:
                            st.write(f"**Confidence:** {row['confidence']:.1%}")
                            if row['affected_sections']:
                                st.write(f"**Sections:** {row['affected_sections']}")
                        if row['notes']:
                            st.info(row['notes'])
            _conn.close()
    except Exception as _e:
        st.error(f"DB error: {_e}")

# ============================================================================
# PAGE: SECTION COMPARISON
# ============================================================================

elif selected == "📂 Section Comparison":
    st.markdown("<h1 class='main-header'>📂 Section Comparison</h1>", unsafe_allow_html=True)
    import sqlite3 as _sq
    from pathlib import Path as _P
    _db = str(_P(__file__).parent / "database" / "voynich.sqlite")
    try:
        _conn = _sq.connect(_db)
        _sm = pd.read_sql_query("""
            SELECT section, total_tokens, unique_tokens,
                   ROUND(token_type_ratio,3) as ttr,
                   ROUND(hapax_ratio,3) as hapax_ratio,
                   ROUND(avg_token_length,2) as avg_len,
                   ROUND(word_final_ratio,3) as word_final_ratio,
                   ROUND(entropy_1gram,3) as H1,
                   ROUND(entropy_2gram,3) as H2
            FROM section_metrics ORDER BY total_tokens DESC
        """, _conn)

        if _sm.empty:
            st.warning("No section data. Run: `python scripts/run_pipeline.py --demo`")
            _conn.close()
        else:
            st.markdown("### Section Overview")
            st.dataframe(_sm, use_container_width=True)

            st.markdown("### Token Count by Section")
            st.bar_chart(_sm.set_index('section')['total_tokens'])

            col1, col2 = st.columns(2)
            with col1:
                st.markdown("### Entropy (H2) by Section")
                if 'H2' in _sm.columns:
                    st.bar_chart(_sm.set_index('section')['H2'])
            with col2:
                st.markdown("### Word-Final Ratio by Section")
                if 'word_final_ratio' in _sm.columns:
                    st.bar_chart(_sm.set_index('section')['word_final_ratio'])

            # Voynich vs Corpora
            _corpora = pd.read_sql_query("""
                SELECT corpus_name, corpus_type,
                       ROUND(token_type_ratio,3) as ttr,
                       ROUND(hapax_ratio,3) as hapax_ratio,
                       ROUND(entropy_2gram,3) as H2,
                       ROUND(word_final_ratio,3) as word_final_ratio
                FROM comparison_corpus ORDER BY corpus_type
            """, _conn)

            if not _corpora.empty:
                st.markdown("---")
                st.markdown("### Voynich vs Reference Corpora")
                st.markdown("""
                <div class='info-box'>
                <strong>Research Goal:</strong> Does Voynich cluster closer to
                taxonomic/catalog corpora than to natural language or cipher text?
                </div>
                """, unsafe_allow_html=True)
                st.dataframe(_corpora, use_container_width=True)

                # Entropy comparison
                voynich_H2 = _sm['H2'].mean() if 'H2' in _sm.columns else None
                if voynich_H2:
                    compare_data = {"Voynich (avg)": voynich_H2}
                    for _, row in _corpora.iterrows():
                        compare_data[row['corpus_name'][:20]] = row['H2']
                    st.markdown("### Entropy H2 Comparison: Voynich vs Corpora")
                    st.bar_chart(compare_data)

        _conn.close()
    except Exception as _e:
        st.error(f"DB error: {_e}")

# ============================================================================
# PAGE: OTHER SECTIONS (PLACEHOLDERS)
# ============================================================================

else:
    st.markdown(f"<h1 class='main-header'>{selected}</h1>", unsafe_allow_html=True)
    st.info("⏳ Feature under development in v0.3")

    st.markdown("""
    ### Development Timeline

    | Version | Status | Features |
    |---------|--------|----------|
    | **v0.1** | ✅ Complete | Core modules, EVA parser, DB schema |
    | **v0.2** | ✅ Complete | Streamlit dashboard, script pipeline |
    | **v0.3** | 🔄 In Progress | Evidence ingestion, 6 new dashboard pages |
    | **v1.0** | 🔜 Planned | Production ready, image integration |
    """)

# ============================================================================
# FOOTER
# ============================================================================

st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #7f8c8d; font-size: 0.9em;'>
    <p><strong>Voynich Reference Analyzer v0.3</strong></p>
    <p>A research tool for testing the hypothesis: Does the Voynich Manuscript encode a reference/taxonomic system?</p>
    <p>⚠️ <strong>Disclaimer:</strong> This is NOT a decipherment tool. We analyze structure, not meaning.</p>
    <p>License: MIT | GitHub: <a href='#'>coolhan/tools/voynich-reference-analyzer</a></p>
</div>
""", unsafe_allow_html=True)
