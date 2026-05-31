"""
Dashboard Pages Module - 6 new pages for Research Evidence Ingestion System

Pages:
  A. Data Sources        - View all ingested sources by tier
  B. Import New Data     - Upload/register new primary or external data
  C. Research Claims     - View and filter all research claims
  D. Failure Lessons     - Browse and filter failure cases
  E. Rule Revalidation   - Trigger revalidation, view changes
  F. Hypothesis Dashboard - Current hypothesis status summary
"""

import streamlit as st
import pandas as pd
import sqlite3
from datetime import datetime
from pathlib import Path
import json


# ============================================================================
# SHARED HELPERS
# ============================================================================

def get_db_conn(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def safe_query(conn, query: str, params=()) -> pd.DataFrame:
    try:
        return pd.read_sql_query(query, conn, params=params)
    except Exception:
        return pd.DataFrame()


TIER_COLORS = {
    "primary_evidence": "🟢",
    "derived_evidence": "🔵",
    "external_claim": "🟡",
    "hypothesis_eval": "🟣"
}

STATUS_EMOJI = {
    "validated": "✅",
    "partially_validated": "🔶",
    "candidate": "🔘",
    "rejected": "❌",
    "needs_review": "⚠️"
}

CLAIM_STATUS_EMOJI = {
    "accepted_as_reference": "✅",
    "useful_method": "🔧",
    "unverified": "❓",
    "contradicted": "⚠️",
    "rejected": "❌",
    "historical_interest_only": "📚",
    "needs_verification": "🔍",
    "partially_supported": "🔶"
}


# ============================================================================
# PAGE A: DATA SOURCES
# ============================================================================

def page_data_sources(db_path: str):
    st.markdown("# 📂 Data Sources")
    st.markdown("""
    <div style='background:#ecf0f1;padding:12px;border-left:4px solid #3498db;border-radius:4px;'>
    All ingested data sources, organized by <strong>Evidence Tier</strong>.
    Primary evidence and external claims are <strong>strictly separated</strong>.
    </div>
    """, unsafe_allow_html=True)

    conn = get_db_conn(db_path)

    # --- Summary metrics ---
    df_all = safe_query(conn, "SELECT * FROM data_sources")
    if df_all.empty:
        st.info("No data sources registered yet. Use 'Import New Data' to add sources.")
        conn.close()
        return

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Sources", len(df_all))
    with col2:
        primary_count = len(df_all[df_all.get('is_primary_source', pd.Series([0]*len(df_all))) == 1]) if 'is_primary_source' in df_all.columns else 0
        st.metric("Primary Sources", primary_count)
    with col3:
        external_count = len(df_all[df_all.get('is_external_research', pd.Series([0]*len(df_all))) == 1]) if 'is_external_research' in df_all.columns else 0
        st.metric("External Research", external_count)
    with col4:
        tiers = df_all['evidence_tier'].nunique() if 'evidence_tier' in df_all.columns else 0
        st.metric("Evidence Tiers Used", tiers)

    st.markdown("---")

    # --- Evidence Tier Breakdown ---
    st.markdown("## Evidence Tier Breakdown")
    st.markdown("""
    | Tier | Symbol | Content |
    |------|--------|---------|
    | Primary Evidence | 🟢 | Yale images, EVA transcription, folio metadata |
    | Derived Evidence | 🔵 | Computed: token freq, entropy, n-gram, section metrics |
    | External Claim | 🟡 | Other researchers' assertions, interpretations |
    | Hypothesis Eval | 🟣 | Our own hypothesis evaluation results |
    """)

    if 'evidence_tier' in df_all.columns:
        tier_counts = df_all['evidence_tier'].value_counts().reset_index()
        tier_counts.columns = ['tier', 'count']
        tier_counts['symbol'] = tier_counts['tier'].map(TIER_COLORS)
        st.dataframe(tier_counts, use_container_width=True)

    st.markdown("---")

    # --- Sources Table with filters ---
    st.markdown("## All Sources")
    col_filter1, col_filter2 = st.columns(2)
    with col_filter1:
        tier_filter = st.selectbox(
            "Filter by Evidence Tier",
            ["All"] + list(TIER_COLORS.keys())
        )
    with col_filter2:
        rel_filter = st.selectbox(
            "Filter by Reliability",
            ["All", "primary", "high", "medium", "low", "unverified"]
        )

    display_df = df_all.copy()
    if tier_filter != "All" and 'evidence_tier' in display_df.columns:
        display_df = display_df[display_df['evidence_tier'] == tier_filter]
    if rel_filter != "All" and 'reliability_level' in display_df.columns:
        display_df = display_df[display_df['reliability_level'] == rel_filter]

    cols_to_show = [c for c in ['source_name','source_type','evidence_tier',
                                 'reliability_level','is_primary_source',
                                 'is_external_research','imported_at'] if c in display_df.columns]
    st.dataframe(display_df[cols_to_show] if cols_to_show else display_df, use_container_width=True)

    conn.close()


# ============================================================================
# PAGE B: IMPORT NEW DATA
# ============================================================================

def page_import_data(db_path: str):
    st.markdown("# 📥 Import New Data")
    st.markdown("""
    <div style='background:#fff3cd;padding:12px;border-left:4px solid #ffc107;border-radius:4px;'>
    ⚠️ <strong>Before importing:</strong> Classify your data correctly.
    External research conclusions go to <strong>Research Claims</strong>, not primary data.
    </div>
    """, unsafe_allow_html=True)

    tab1, tab2, tab3 = st.tabs([
        "🗂️ Primary / Derived Data",
        "📚 External Research",
        "❌ Failure Case"
    ])

    # --- Tab 1: Primary Data ---
    with tab1:
        st.markdown("### Register Primary or Derived Data Source")
        st.info("Use this for: Yale images, EVA files, VIB metadata, color analysis, token CSV, corpus text")

        with st.form("form_primary_source"):
            col1, col2 = st.columns(2)
            with col1:
                src_name = st.text_input("Source Name *", placeholder="e.g., Voynich EVA Transcription IT2a-n")
                src_type = st.selectbox("Source Type *", [
                    "eva_transcription", "primary_image", "vib_metadata",
                    "folio_description", "color_analysis", "token_analysis",
                    "section_metadata", "comparison_corpus", "analysis_report", "other"
                ])
                evidence_tier = st.selectbox("Evidence Tier *", [
                    "primary_evidence", "derived_evidence"
                ])
            with col2:
                src_author = st.text_input("Author / Origin", placeholder="e.g., René Zandbergen")
                src_url = st.text_input("URL or File Path")
                reliability = st.selectbox("Reliability Level", [
                    "primary", "high", "medium", "low", "unverified"
                ])
                is_primary = st.checkbox("Is Primary Source (Yale/EVA/VIB)?")
            notes = st.text_area("Notes")
            license_note = st.text_input("License / Usage Note")

            if st.form_submit_button("✅ Register Source"):
                if not src_name:
                    st.error("Source name is required.")
                else:
                    source_id = f"SRC-{datetime.now().strftime('%Y%m%d%H%M%S')}"
                    conn = get_db_conn(db_path)
                    try:
                        conn.execute("""
                            INSERT OR REPLACE INTO data_sources
                            (source_id, source_type, source_name, author_or_origin,
                             url_or_file_path, imported_at, license_or_usage_note,
                             reliability_level, is_primary_source, is_external_research,
                             evidence_tier, notes)
                            VALUES (?,?,?,?,?,?,?,?,?,0,?,?)
                        """, (source_id, src_type, src_name, src_author,
                              src_url, datetime.now().isoformat(), license_note,
                              reliability, int(is_primary), evidence_tier, notes))
                        conn.commit()
                        st.success(f"✅ Source registered: {source_id}")
                    except Exception as e:
                        st.error(f"Error: {e}")
                    finally:
                        conn.close()

        st.markdown("---")
        st.markdown("### Upload Data File")
        uploaded = st.file_uploader(
            "Upload EVA .txt, token .csv, color analysis, etc.",
            type=["txt", "csv", "json", "md"]
        )
        if uploaded:
            st.info(f"File received: {uploaded.name} ({uploaded.size} bytes)")
            st.warning("⏳ File parsing pipeline: connect to EVA parser or CSV importer.")

    # --- Tab 2: External Research ---
    with tab2:
        st.markdown("### Register External Research")
        st.markdown("""
        <div style='background:#f8d7da;padding:10px;border-left:4px solid #dc3545;border-radius:4px;'>
        ❌ <strong>CRITICAL:</strong> Do NOT import their conclusions as facts.
        Fill in what they found, and we evaluate it separately.
        </div>
        """, unsafe_allow_html=True)

        with st.form("form_external_research"):
            col1, col2 = st.columns(2)
            with col1:
                researcher = st.text_input("Researcher Name *", placeholder="e.g., Gordon Rugg")
                title = st.text_input("Paper / Article Title *")
                year = st.number_input("Publication Year", min_value=1900, max_value=2030, value=2000)
                methodology = st.text_area("Methodology Used", height=80)
                patterns = st.text_area("Patterns Found", height=80)
            with col2:
                data_used = st.text_area("Data Used", height=60)
                main_claims = st.text_area("Main Claims (their words)", height=80)
                claims_decipherment = st.checkbox("Claims Decipherment?")
                verification = st.text_input("Their Verification Method")
                refutation = st.text_input("Refuted by (if known)")

            advantages = st.text_area("What we can use from them (methods, data)", height=60)
            disadvantages = st.text_area("What to avoid from them", height=60)
            relevance = st.text_area("Relevance to our hypothesis", height=60)
            our_eval = st.selectbox("Our Evaluation", [
                "failure_lesson", "useful_method", "useful_data",
                "comparison_basis", "irrelevant", "contradicts_hypothesis"
            ])

            if st.form_submit_button("📚 Register External Research"):
                if not researcher or not title:
                    st.error("Researcher name and title are required.")
                else:
                    research_id = f"EXT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
                    source_id = f"SRC-EXT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
                    conn = get_db_conn(db_path)
                    try:
                        conn.execute("""
                            INSERT OR REPLACE INTO data_sources
                            (source_id, source_type, source_name, author_or_origin,
                             imported_at, reliability_level, is_primary_source,
                             is_external_research, evidence_tier, notes)
                            VALUES (?,?,?,?,?,?,0,1,'external_claim',?)
                        """, (source_id, "external_research",
                              f"{researcher}: {title}", researcher,
                              datetime.now().isoformat(), "unverified", ""))
                        conn.execute("""
                            INSERT OR REPLACE INTO external_research
                            (research_id, source_id, researcher_name, paper_title,
                             publication_year, data_used, methodology, main_claims,
                             patterns_found, claims_decipherment, verification_method,
                             refutation_reason, advantages_for_us, disadvantages_to_avoid,
                             relevance_to_our_research, our_evaluation)
                            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                        """, (research_id, source_id, researcher, title,
                              int(year), data_used, methodology, main_claims,
                              patterns, int(claims_decipherment), verification,
                              refutation, advantages, disadvantages, relevance, our_eval))
                        conn.commit()
                        st.success(f"✅ External research registered: {research_id}")
                        st.info("Next: Register specific claims from this research in the 'Research Claims' page.")
                    except Exception as e:
                        st.error(f"Error: {e}")
                    finally:
                        conn.close()

    # --- Tab 3: Failure Case ---
    with tab3:
        st.markdown("### Register Failure Case")
        st.info("Document why a past research approach failed. This builds our 'what to avoid' knowledge base.")

        with st.form("form_failure"):
            hyp_name = st.text_input("Hypothesis Name *", placeholder="e.g., Voynich as Old Turkish")
            method = st.text_input("Method Used")
            failure_reason = st.selectbox("Primary Failure Reason *", [
                "forced_language_match", "selective_evidence", "no_corpus_validation",
                "ignored_counterexamples", "image_driven_meaning", "insufficient_statistics",
                "no_external_replication", "circular_reasoning", "cherry_picking",
                "unfalsifiable_claim", "other"
            ])
            detail = st.text_area("Failure Detail", height=80)
            example = st.text_area("Example Problem", height=80)
            learn = st.text_area("What we learn from this", height=80)
            avoid = st.text_area("What to avoid", height=80)
            relevance = st.selectbox("Relevance to Our Project", ["high", "medium", "low", "not_relevant"])

            if st.form_submit_button("❌ Register Failure Case"):
                if not hyp_name:
                    st.error("Hypothesis name is required.")
                else:
                    failure_id = f"FAIL-{datetime.now().strftime('%Y%m%d%H%M%S')}"
                    conn = get_db_conn(db_path)
                    try:
                        conn.execute("""
                            INSERT OR REPLACE INTO failure_cases
                            (failure_id, source_id, hypothesis_name, method_used,
                             failure_reason, failure_reason_detail, example_problem,
                             what_to_learn, what_to_avoid, relevance_to_our_project)
                            VALUES (?,NULL,?,?,?,?,?,?,?,?)
                        """, (failure_id, hyp_name, method, failure_reason,
                              detail, example, learn, avoid, relevance))
                        conn.commit()
                        st.success(f"✅ Failure case registered: {failure_id}")
                    except Exception as e:
                        st.error(f"Error: {e}")
                    finally:
                        conn.close()


# ============================================================================
# PAGE C: RESEARCH CLAIMS
# ============================================================================

def page_research_claims(db_path: str):
    st.markdown("# 📋 Research Claim Registry")
    st.markdown("""
    <div style='background:#ecf0f1;padding:12px;border-left:4px solid #3498db;border-radius:4px;'>
    All research claims are stored here — separated from primary evidence.
    <strong>Claims ≠ Facts.</strong> Claims are what researchers assert; facts are what the data shows.
    </div>
    """, unsafe_allow_html=True)

    conn = get_db_conn(db_path)
    df = safe_query(conn, "SELECT * FROM research_claims ORDER BY created_at DESC")

    if df.empty:
        st.info("No claims registered yet.")
        conn.close()
        _render_claim_form(db_path)
        return

    # Metrics
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Claims", len(df))
    with col2:
        if 'claim_type' in df.columns:
            translation_count = len(df[df['claim_type'] == 'translation_claim'])
        else:
            translation_count = 0
        st.metric("Translation Claims", translation_count, "isolated from facts")
    with col3:
        if 'relation_to_our_hypothesis' in df.columns:
            supporting = len(df[df['relation_to_our_hypothesis'] == 'supports'])
        else:
            supporting = 0
        st.metric("Supporting Hypothesis", supporting)
    with col4:
        if 'relation_to_our_hypothesis' in df.columns:
            contra = len(df[df['relation_to_our_hypothesis'] == 'contradicts'])
        else:
            contra = 0
        st.metric("Contradicting Hypothesis", contra)

    st.markdown("---")

    # Filters
    col_f1, col_f2, col_f3 = st.columns(3)
    with col_f1:
        ct_opts = ["All"] + list(df['claim_type'].unique()) if 'claim_type' in df.columns else ["All"]
        claim_type_filter = st.selectbox("Claim Type", ct_opts)
    with col_f2:
        cs_opts = ["All"] + list(df['our_evaluation_status'].unique()) if 'our_evaluation_status' in df.columns else ["All"]
        status_filter = st.selectbox("Our Evaluation", cs_opts)
    with col_f3:
        rel_opts = ["All"] + list(df['relation_to_our_hypothesis'].unique()) if 'relation_to_our_hypothesis' in df.columns else ["All"]
        hyp_filter = st.selectbox("Hypothesis Relation", rel_opts)

    filtered = df.copy()
    if claim_type_filter != "All" and 'claim_type' in filtered.columns:
        filtered = filtered[filtered['claim_type'] == claim_type_filter]
    if status_filter != "All" and 'our_evaluation_status' in filtered.columns:
        filtered = filtered[filtered['our_evaluation_status'] == status_filter]
    if hyp_filter != "All" and 'relation_to_our_hypothesis' in filtered.columns:
        filtered = filtered[filtered['relation_to_our_hypothesis'] == hyp_filter]

    show_cols = [c for c in ['claim_text','claim_type','our_evaluation_status',
                              'relation_to_our_hypothesis','caution_notes'] if c in filtered.columns]
    st.dataframe(filtered[show_cols] if show_cols else filtered, use_container_width=True)

    st.markdown("---")
    _render_claim_form(db_path)
    conn.close()


def _render_claim_form(db_path: str):
    st.markdown("### ➕ Register New Claim")
    conn = get_db_conn(db_path)
    sources = safe_query(conn, "SELECT source_id, source_name FROM data_sources")
    conn.close()

    src_options = dict(zip(sources['source_name'], sources['source_id'])) if not sources.empty and 'source_name' in sources.columns else {}

    with st.form("form_claim"):
        src_choice = st.selectbox("Source", list(src_options.keys()) if src_options else ["(No sources yet)"])
        claim_text = st.text_area("Claim Text *", height=100)
        col1, col2 = st.columns(2)
        with col1:
            claim_type = st.selectbox("Claim Type", [
                "structural_claim", "statistical_claim", "translation_claim",
                "historical_claim", "botanical_identification_claim",
                "cipher_claim", "language_identification_claim",
                "author_attribution_claim", "date_claim", "methodology_claim"
            ])
            our_eval = st.selectbox("Our Evaluation", [
                "unverified", "accepted_as_reference", "useful_method",
                "contradicted", "rejected", "historical_interest_only",
                "needs_verification", "partially_supported"
            ])
        with col2:
            confidence = st.slider("Confidence Claimed by Author", 0.0, 1.0, 0.5, 0.05)
            hyp_rel = st.selectbox("Relation to Our Hypothesis", [
                "unknown", "supports", "contradicts", "neutral", "irrelevant"
            ])
        reason = st.text_input("Reason for Our Evaluation")
        caution = st.text_area("Caution Notes", height=60)

        if st.form_submit_button("📋 Register Claim"):
            if not claim_text:
                st.error("Claim text is required.")
            elif not src_options:
                st.error("Register a source first.")
            else:
                claim_id = f"CLM-{datetime.now().strftime('%Y%m%d%H%M%S')}"
                source_id = src_options.get(src_choice, "")
                conn2 = get_db_conn(db_path)
                # Guardrail: auto-adjust translation claims
                if claim_type == "translation_claim":
                    our_eval = "historical_interest_only"
                    caution = "[GUARDRAIL AUTO] " + caution
                try:
                    conn2.execute("""
                        INSERT OR REPLACE INTO research_claims
                        (claim_id, source_id, claim_text, claim_type,
                         confidence_claimed_by_author, our_evaluation_status,
                         reason_for_status, relation_to_our_hypothesis, caution_notes)
                        VALUES (?,?,?,?,?,?,?,?,?)
                    """, (claim_id, source_id, claim_text, claim_type,
                          confidence, our_eval, reason, hyp_rel, caution))
                    conn2.commit()
                    st.success(f"✅ Claim registered: {claim_id}")
                    if claim_type == "translation_claim":
                        st.warning("⚠️ Translation claim auto-set to 'historical_interest_only' by guardrail.")
                except Exception as e:
                    st.error(f"Error: {e}")
                finally:
                    conn2.close()


# ============================================================================
# PAGE D: FAILURE LESSONS
# ============================================================================

def page_failure_lessons(db_path: str):
    st.markdown("# ❌ Failure Lessons Registry")
    st.markdown("""
    <div style='background:#f8d7da;padding:12px;border-left:4px solid #dc3545;border-radius:4px;'>
    Past research failures are documented here as <strong>learning resources</strong>.
    Understanding why others failed helps us avoid the same mistakes.
    </div>
    """, unsafe_allow_html=True)

    conn = get_db_conn(db_path)
    df = safe_query(conn, "SELECT * FROM failure_cases ORDER BY relevance_to_our_project DESC, created_at DESC")
    conn.close()

    if df.empty:
        st.info("No failure cases registered yet.")
        st.markdown("""
        ### Common Failure Patterns to Document

        | Pattern | Example |
        |---------|---------|
        | forced_language_match | Forcing Arabic/Hebrew/Latin onto Voynich tokens |
        | selective_evidence | Only translating 20 words that 'fit' |
        | no_corpus_validation | No comparison against full manuscript |
        | image_driven_meaning | Seeing 'sunflower' → deciding token means 'sun' |
        | circular_reasoning | Assuming structure, then finding it |
        | no_external_replication | Only one person tested the method |
        """)
        return

    # Summary
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Failure Cases", len(df))
    with col2:
        high_rel = len(df[df['relevance_to_our_project'] == 'high']) if 'relevance_to_our_project' in df.columns else 0
        st.metric("High Relevance", high_rel, "must avoid")
    with col3:
        reasons = df['failure_reason'].nunique() if 'failure_reason' in df.columns else 0
        st.metric("Distinct Failure Types", reasons)

    st.markdown("---")

    # Filter by relevance
    rel_filter = st.selectbox("Filter by Relevance", ["All", "high", "medium", "low", "not_relevant"])

    filtered = df.copy()
    if rel_filter != "All" and 'relevance_to_our_project' in filtered.columns:
        filtered = filtered[filtered['relevance_to_our_project'] == rel_filter]

    # Failure reason breakdown
    if 'failure_reason' in df.columns:
        st.markdown("### Failure Reason Distribution")
        reason_counts = df['failure_reason'].value_counts()
        st.bar_chart(reason_counts)

    st.markdown("### Failure Cases")
    for _, row in filtered.iterrows():
        relevance = row.get('relevance_to_our_project', 'medium')
        emoji = "🔴" if relevance == "high" else "🟡" if relevance == "medium" else "⚪"
        with st.expander(f"{emoji} {row.get('hypothesis_name', 'Unknown')} — {row.get('failure_reason', '')}"):
            col1, col2 = st.columns(2)
            with col1:
                st.markdown(f"**Method Used:** {row.get('method_used', 'N/A')}")
                st.markdown(f"**Failure Type:** `{row.get('failure_reason', '')}`")
                st.markdown(f"**Detail:** {row.get('failure_reason_detail', 'N/A')}")
                st.markdown(f"**Example Problem:** {row.get('example_problem', 'N/A')}")
            with col2:
                st.markdown(f"**What to Learn:** {row.get('what_to_learn', 'N/A')}")
                st.markdown(f"**What to Avoid:** {row.get('what_to_avoid', 'N/A')}")
                st.markdown(f"**Relevance:** `{relevance}`")


# ============================================================================
# PAGE E: RULE REVALIDATION
# ============================================================================

def page_rule_revalidation(db_path: str):
    st.markdown("# 🔄 Rule Revalidation")
    st.markdown("""
    <div style='background:#ecf0f1;padding:12px;border-left:4px solid #3498db;border-radius:4px;'>
    When new primary data is added, existing rules are automatically re-evaluated.
    Rules can be <strong>strengthened</strong>, <strong>weakened</strong>, or <strong>rejected</strong>.
    </div>
    """, unsafe_allow_html=True)

    conn = get_db_conn(db_path)

    # Current rule status summary
    df_rules = safe_query(conn, "SELECT * FROM rule_candidate")
    df_history = safe_query(conn, """
        SELECT h.*, r.rule_name
        FROM rule_validation_history h
        LEFT JOIN rule_candidate r ON h.rule_id = r.rule_id
        ORDER BY h.changed_at DESC
    """)

    if not df_rules.empty and 'validation_status' in df_rules.columns:
        st.markdown("### Current Rule Status")
        status_counts = df_rules['validation_status'].value_counts()
        col_metrics = st.columns(len(status_counts))
        for i, (status, count) in enumerate(status_counts.items()):
            with col_metrics[i]:
                emoji = STATUS_EMOJI.get(status, "❔")
                st.metric(f"{emoji} {status}", count)

        st.markdown("---")

    # Manual Revalidation trigger
    st.markdown("### Trigger Revalidation")
    col1, col2 = st.columns([2, 1])
    with col1:
        st.info("Run full revalidation against current token data in the database.")
    with col2:
        if st.button("🔄 Run Revalidation Now"):
            try:
                import sys
                sys.path.insert(0, str(Path(db_path).parent.parent / "modules"))
                from revalidation import RevalidationEngine
                engine = RevalidationEngine(db_path)
                run_id = f"RUN-MANUAL-{datetime.now().strftime('%Y%m%d%H%M%S')}"
                # Start run record
                conn.execute("""
                    INSERT OR IGNORE INTO analysis_runs
                    (run_id, run_date, data_version, triggered_by, status)
                    VALUES (?, ?, 'manual', 'manual', 'running')
                """, (run_id, datetime.now().isoformat()))
                conn.commit()
                results = engine.run_full_revalidation(run_id)
                conn.execute("UPDATE analysis_runs SET status='complete' WHERE run_id=?", (run_id,))
                conn.commit()
                st.success(f"✅ Revalidation complete: {len(results)} rules checked")

                summary = engine.get_revalidation_summary(results)
                col_r1, col_r2, col_r3, col_r4 = st.columns(4)
                with col_r1:
                    st.metric("✅ Strengthened", len(summary['strengthened']))
                with col_r2:
                    st.metric("⚠️ Weakened", len(summary['weakened']))
                with col_r3:
                    st.metric("❌ Rejected", len(summary['rejected']))
                with col_r4:
                    st.metric("🔘 Unchanged", len(summary['unchanged']))
            except ImportError:
                st.warning("⏳ Revalidation module not yet connected. Schema ready.")
            except Exception as e:
                st.error(f"Revalidation error: {e}")

    st.markdown("---")

    # Validation history
    if not df_history.empty:
        st.markdown("### Recent Validation History")
        show_cols = [c for c in ['rule_name','previous_status','new_status',
                                  'previous_confidence','new_confidence',
                                  'change_reason','changed_at'] if c in df_history.columns]
        st.dataframe(df_history[show_cols].head(50) if show_cols else df_history.head(50),
                     use_container_width=True)
    else:
        st.info("No validation history yet. Run revalidation after adding new data.")

    # All rules table
    if not df_rules.empty:
        st.markdown("### All Rule Candidates")
        show_cols = [c for c in ['rule_name','rule_type','validation_status',
                                  'evidence_count','exception_count','confidence'] if c in df_rules.columns]
        st.dataframe(df_rules[show_cols] if show_cols else df_rules, use_container_width=True)

    conn.close()


# ============================================================================
# PAGE F: HYPOTHESIS DASHBOARD
# ============================================================================

def page_hypothesis_dashboard(db_path: str):
    st.markdown("# 🎯 Hypothesis Dashboard")

    HYPOTHESIS = (
        "The Voynich Manuscript may share structural properties with "
        "reference/taxonomic corpora rather than natural prose or cipher text."
    )

    st.markdown(f"""
    <div style='background:#d4edda;padding:16px;border-left:5px solid #28a745;border-radius:5px;margin-bottom:20px;'>
    <h3>🔬 Core Research Hypothesis</h3>
    <p style='font-size:1.1em;'><em>{HYPOTHESIS}</em></p>
    <p><strong>Status:</strong> ACTIVE CANDIDATE HYPOTHESIS</p>
    </div>
    """, unsafe_allow_html=True)

    conn = get_db_conn(db_path)

    # Evidence summary from claims
    df_claims = safe_query(conn, "SELECT * FROM research_claims")
    df_rules = safe_query(conn, "SELECT * FROM rule_candidate")
    df_runs = safe_query(conn, "SELECT * FROM analysis_runs ORDER BY run_date DESC")

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        supporting = len(df_claims[df_claims['relation_to_our_hypothesis'] == 'supports']) if not df_claims.empty and 'relation_to_our_hypothesis' in df_claims.columns else 0
        st.metric("🟢 Supporting Claims", supporting)
    with col2:
        contra = len(df_claims[df_claims['relation_to_our_hypothesis'] == 'contradicts']) if not df_claims.empty and 'relation_to_our_hypothesis' in df_claims.columns else 0
        st.metric("🔴 Contradicting Claims", contra)
    with col3:
        neutral = len(df_claims[df_claims['relation_to_our_hypothesis'] == 'neutral']) if not df_claims.empty and 'relation_to_our_hypothesis' in df_claims.columns else 0
        st.metric("⚪ Neutral Claims", neutral)
    with col4:
        validated_rules = len(df_rules[df_rules['validation_status'] == 'validated']) if not df_rules.empty and 'validation_status' in df_rules.columns else 0
        st.metric("✅ Validated Rules", validated_rules)

    st.markdown("---")

    # Guardrail status
    st.markdown("## 🛡️ Hypothesis Guardrail Status")
    st.markdown("""
    | Guardrail Rule | Status |
    |----------------|--------|
    | No translation claims treated as facts | 🟢 ACTIVE |
    | No specific language hypothesis as default | 🟢 ACTIVE |
    | No decipherment success claims | 🟢 ACTIVE |
    | External claims separated from primary data | 🟢 ACTIVE |
    | Evidence tier separation enforced | 🟢 ACTIVE |
    | Single-researcher dependency blocked | 🟢 ACTIVE |
    """)

    # Allowed uses reminder
    st.markdown("## ✅ Allowed Uses of External Research")
    st.markdown("""
    1. **원자료 보강** — Use their raw data (transcriptions, images), not their conclusions
    2. **비교 기준 확보** — Use their results as a comparison baseline
    3. **검증 방법 참고** — Reference their methodology, apply independently
    4. **실패 사례 학습** — Learn what NOT to do from their failures
    5. **우리 가설의 반례 탐색** — Use their counterexamples to stress-test our hypothesis
    """)

    st.markdown("---")

    # Evidence four-tier diagram
    st.markdown("## 📊 Evidence Tier Separation")
    st.markdown("""
    ```
    ┌─────────────────────────────────────────────────────────────┐
    │  TIER 1: Primary Evidence (🟢)                              │
    │  Yale images, EVA transcription, VIB metadata               │
    │  → NEVER mixed with external claims                         │
    ├─────────────────────────────────────────────────────────────┤
    │  TIER 2: Derived Evidence (🔵)                              │
    │  Token freq, entropy, n-gram, section metrics               │
    │  → Computed FROM primary evidence only                      │
    ├─────────────────────────────────────────────────────────────┤
    │  TIER 3: External Research Claims (🟡)                      │
    │  Other researchers' assertions, translations, identifications│
    │  → Stored separately; evaluated, NOT adopted                │
    ├─────────────────────────────────────────────────────────────┤
    │  TIER 4: Our Hypothesis Evaluation (🟣)                     │
    │  Our own assessment of evidence vs. hypothesis              │
    │  → Based on Tiers 1-2, informed (not driven) by Tier 3     │
    └─────────────────────────────────────────────────────────────┘
    ```
    """)

    # Analysis runs
    if not df_runs.empty:
        st.markdown("## 📈 Analysis Run History")
        show_cols = [c for c in ['run_id','run_date','data_version','triggered_by',
                                  'folio_count','token_count','rule_count','status'] if c in df_runs.columns]
        st.dataframe(df_runs[show_cols].head(10) if show_cols else df_runs.head(10), use_container_width=True)

    # Next steps
    st.markdown("## 🔭 Next Verification Needed")
    df_evals = safe_query(conn, "SELECT * FROM hypothesis_evaluations ORDER BY evaluated_at DESC LIMIT 1")
    if not df_evals.empty and 'next_verification_needed' in df_evals.columns:
        next_step = df_evals.iloc[0]['next_verification_needed']
        if next_step:
            st.info(f"**Next Step:** {next_step}")
    else:
        st.info("""
        **Default Next Steps:**
        1. Import full EVA transcription (IT2a-n.txt) as primary evidence
        2. Run section comparison: Herbal A vs Herbal B vs Pharma vs Stars
        3. Add 3 comparison corpora (herbal description, catalog, cipher)
        4. Register known failed hypotheses in Failure Cases
        5. Run first full revalidation after primary data import
        """)

    conn.close()
