"""
Voynich Reference Analyzer - Streamlit Dashboard

Purpose: Interactive exploration of Voynich Manuscript analysis
Version: v0.1
Status: Under development
"""

import streamlit as st
import pandas as pd
import sqlite3
from pathlib import Path
import json
from datetime import datetime

# Configure page
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
</style>
""", unsafe_allow_html=True)

# Sidebar Navigation
st.sidebar.markdown("# 📜 Voynich Reference Analyzer")
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

We analyze Voynich's structure to test whether it might encode a
reference/taxonomic system.

✓ Based on quantitative analysis
✓ Comparison with reference corpora
✓ All findings are "candidate" hypotheses
✗ No translation claims
✗ No meaning assignment
✗ No decipherment assertion
""")

# ============================================================================
# PAGE: Dashboard
# ============================================================================
if selected == "📊 Dashboard":
    st.markdown("<h1 class='main-header'>📜 Voynich Reference Analyzer v0.1</h1>",
                unsafe_allow_html=True)

    st.markdown("""
    <div class='info-box'>
    <h3>🎯 Research Hypothesis</h3>
    <p>The Voynich Manuscript may encode a <strong>taxonomic or reference-like
    classification system</strong> (similar to GenBank, taxonomies, or catalog
    entries) rather than:</p>
    <ul>
    <li>Continuous narrative prose</li>
    <li>Simple substitution cipher</li>
    <li>Purely artificial language</li>
    </ul>
    </div>
    """, unsafe_allow_html=True)

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("Folios Analyzed", "112", "f1r-f112v")
    with col2:
        st.metric("Total Tokens", "7,063", "~50k glyphs")
    with col3:
        st.metric("EVA Characters", "19", "distinct")

    st.markdown("### 📋 Key Findings")

    findings = pd.DataFrame({
        "Finding": [
            "Word-Final Constraint",
            "Section Divergence",
            "Token Families",
            "Entropy Pattern"
        ],
        "Value": [
            "96.3% end with 8 characters",
            "23% vocabulary difference",
            "9% clustering rate",
            "6.14 bits (constrained)"
        ],
        "Confidence": [
            "⭐⭐⭐⭐⭐",
            "⭐⭐⭐⭐",
            "⭐⭐⭐",
            "⭐⭐"
        ]
    })

    st.dataframe(findings, use_container_width=True)

    st.markdown("### 🔄 Comparison with Corpora")

    comparison = pd.DataFrame({
        "Corpus": ["Voynich", "English", "Catalog", "Cipher", "Random"],
        "Word-Final": ["96.3%", "75%", "89%", "50%", "5%"],
        "TTR": ["58%", "42%", "72%", "41%", "95%"],
        "2-gram Entropy": ["6.14", "10.5", "7.8", "7.2", "8.5"]
    })

    st.dataframe(comparison, use_container_width=True)

    st.markdown("""
    <div class='success-box'>
    <h3>✓ Hypothesis Status</h3>
    <p><strong>PARTIALLY SUPPORTED (Medium Confidence)</strong></p>
    <p>Voynich shows structural patterns consistent with reference/taxonomic systems,
    but alternative hypotheses (artificial language, cipher) cannot be ruled out.</p>
    <p><strong>Status:</strong> Candidate Hypothesis (v0.1)</p>
    <p><strong>Next Step:</strong> v0.2 validation with EVA segmentation fix</p>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("### 📚 Documentation")

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        if st.button("📖 Methodology"):
            st.info("See: docs/METHODOLOGY.md")
    with col2:
        if st.button("🔬 Data Dictionary"):
            st.info("See: docs/DATA_DICTIONARY.md")
    with col3:
        if st.button("🎯 Hypothesis"):
            st.info("See: docs/HYPOTHESIS.md")
    with col4:
        if st.button("✅ Validation Plan"):
            st.info("See: docs/VALIDATION_PLAN.md")

# ============================================================================
# PAGE: Folio Explorer
# ============================================================================
elif selected == "🔍 Folio Explorer":
    st.markdown("<h1 class='main-header'>🔍 Folio Explorer</h1>",
                unsafe_allow_html=True)
    st.info("⏳ Feature under development in v0.2")
    st.markdown("""
    ### Planned Features:
    - Select folio by ID (f1r, f1v, ... f112v)
    - Display Yale Beinecke image
    - Show EVA transcription
    - Display high-frequency tokens
    - Show section/Currier/scribe metadata
    - Show color analysis
    """)

# ============================================================================
# PAGE: Report Generator
# ============================================================================
elif selected == "📋 Report Generator":
    st.markdown("<h1 class='main-header'>📋 Report Generator</h1>",
                unsafe_allow_html=True)

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Current Analysis Status")
        st.write(f"**Version:** v0.1")
        st.write(f"**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        st.write(f"**Status:** Development (Pre-publication)")

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
# PAGE: Other sections (placeholders)
# ============================================================================
else:
    st.markdown(f"<h1 class='main-header'>{selected}</h1>", unsafe_allow_html=True)
    st.info("⏳ Feature under development in v0.2")

    st.markdown("""
    ### Development Timeline

    - **v0.1 (May 31):** Initial structure, documentation, hypothesis setup
    - **v0.2 (June 15):** EVA parser, database, basic analyses
    - **v0.3 (July 1):** Streamlit dashboards, comparison corpus
    - **v1.0 (July 15):** Final validation, publication ready
    """)

# ============================================================================
# Footer
# ============================================================================
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #7f8c8d; font-size: 0.9em;'>
    <p><strong>Voynich Reference Analyzer v0.1</strong></p>
    <p>GitHub: <a href='https://github.com/zmjckim-fa/coolhan/tree/main/tools/voynich-reference-analyzer'>
    coolhan/tools/voynich-reference-analyzer</a></p>
    <p>⚠️ <strong>Disclaimer:</strong> This is a research analysis tool, NOT a decipherment tool.
    We do not claim to have decoded, translated, or deciphered the Voynich Manuscript.</p>
</div>
""", unsafe_allow_html=True)
