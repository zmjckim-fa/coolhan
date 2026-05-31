-- Voynich Reference Analyzer v0.3
-- Research Evidence Ingestion & Validation System
-- Additional Tables (extends schema.sql v0.2)

-- ============================================================================
-- EVIDENCE TIER: Constants
-- PRIMARY_EVIDENCE | DERIVED_EVIDENCE | EXTERNAL_CLAIM | HYPOTHESIS_EVAL
-- These MUST NEVER be mixed in analysis output.
-- ============================================================================

-- 1. DATA SOURCES: All ingested data sources with full metadata
CREATE TABLE IF NOT EXISTS data_sources (
    source_id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL CHECK(source_type IN (
        'primary_image', 'eva_transcription', 'vib_metadata',
        'folio_description', 'color_analysis', 'token_analysis',
        'section_metadata', 'comparison_corpus', 'analysis_report',
        'external_research', 'other'
    )),
    source_name TEXT NOT NULL,
    author_or_origin TEXT,
    url_or_file_path TEXT,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    license_or_usage_note TEXT,
    reliability_level TEXT CHECK(reliability_level IN (
        'primary', 'high', 'medium', 'low', 'unverified'
    )) DEFAULT 'medium',
    is_primary_source BOOLEAN DEFAULT 0,
    is_external_research BOOLEAN DEFAULT 0,
    evidence_tier TEXT CHECK(evidence_tier IN (
        'primary_evidence', 'derived_evidence',
        'external_claim', 'hypothesis_eval'
    )) NOT NULL,
    notes TEXT
);

-- 2. SOURCE FILES: Individual files per source
CREATE TABLE IF NOT EXISTS source_files (
    file_id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT,
    file_type TEXT CHECK(file_type IN (
        'txt', 'csv', 'json', 'jpg', 'png', 'pdf', 'md', 'sql', 'other'
    )),
    file_size_bytes INTEGER,
    checksum_md5 TEXT,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parse_status TEXT CHECK(parse_status IN (
        'pending', 'parsed', 'failed', 'skipped'
    )) DEFAULT 'pending',
    parse_notes TEXT,
    FOREIGN KEY(source_id) REFERENCES data_sources(source_id)
);

-- 3. EXTERNAL RESEARCH: Other researchers' work
CREATE TABLE IF NOT EXISTS external_research (
    research_id TEXT PRIMARY KEY,
    source_id TEXT,
    researcher_name TEXT NOT NULL,
    paper_title TEXT NOT NULL,
    publication_year INTEGER,
    data_used TEXT,
    methodology TEXT,
    main_claims TEXT,
    patterns_found TEXT,
    claims_decipherment BOOLEAN DEFAULT 0,
    verification_method TEXT,
    refutation_reason TEXT,
    failure_causes TEXT,
    advantages_for_us TEXT,
    disadvantages_to_avoid TEXT,
    relevance_to_our_research TEXT,
    our_evaluation TEXT CHECK(our_evaluation IN (
        'useful_method', 'useful_data', 'failure_lesson',
        'comparison_basis', 'irrelevant', 'contradicts_hypothesis'
    )),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(source_id) REFERENCES data_sources(source_id)
);

-- 4. RESEARCH CLAIMS: All claims, strictly separated from facts
-- CRITICAL: External researcher conclusions go HERE, not in any facts table.
CREATE TABLE IF NOT EXISTS research_claims (
    claim_id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    research_id TEXT,
    claim_text TEXT NOT NULL,
    claim_type TEXT NOT NULL CHECK(claim_type IN (
        'translation_claim', 'structural_claim', 'statistical_claim',
        'historical_claim', 'botanical_identification_claim',
        'cipher_claim', 'language_identification_claim',
        'author_attribution_claim', 'date_claim', 'methodology_claim'
    )),
    evidence_used TEXT,
    method_used TEXT,
    confidence_claimed_by_author REAL CHECK(
        confidence_claimed_by_author >= 0 AND confidence_claimed_by_author <= 1
    ),
    our_evaluation_status TEXT NOT NULL CHECK(our_evaluation_status IN (
        'accepted_as_reference', 'useful_method', 'unverified',
        'contradicted', 'rejected', 'historical_interest_only',
        'needs_verification', 'partially_supported'
    )),
    reason_for_status TEXT,
    relation_to_our_hypothesis TEXT CHECK(relation_to_our_hypothesis IN (
        'supports', 'contradicts', 'neutral', 'irrelevant', 'unknown'
    )),
    caution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(source_id) REFERENCES data_sources(source_id),
    FOREIGN KEY(research_id) REFERENCES external_research(research_id)
);

-- 5. FAILURE CASES: Why past research failed
CREATE TABLE IF NOT EXISTS failure_cases (
    failure_id TEXT PRIMARY KEY,
    source_id TEXT,
    research_id TEXT,
    hypothesis_name TEXT NOT NULL,
    method_used TEXT,
    failure_reason TEXT NOT NULL CHECK(failure_reason IN (
        'forced_language_match', 'selective_evidence', 'no_corpus_validation',
        'ignored_counterexamples', 'image_driven_meaning', 'insufficient_statistics',
        'no_external_replication', 'circular_reasoning', 'cherry_picking',
        'unfalsifiable_claim', 'other'
    )),
    failure_reason_detail TEXT,
    example_problem TEXT,
    what_to_learn TEXT,
    what_to_avoid TEXT,
    relevance_to_our_project TEXT CHECK(relevance_to_our_project IN (
        'high', 'medium', 'low', 'not_relevant'
    )) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(source_id) REFERENCES data_sources(source_id),
    FOREIGN KEY(research_id) REFERENCES external_research(research_id)
);

-- 6. IMPORTED DATASETS: Track what raw data has been imported
CREATE TABLE IF NOT EXISTS imported_datasets (
    dataset_id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    dataset_name TEXT NOT NULL,
    dataset_type TEXT CHECK(dataset_type IN (
        'folio_image', 'eva_file', 'vib_file', 'color_data',
        'token_csv', 'metadata_json', 'corpus_text', 'report_md', 'other'
    )),
    record_count INTEGER DEFAULT 0,
    import_status TEXT CHECK(import_status IN (
        'pending', 'complete', 'partial', 'failed'
    )) DEFAULT 'pending',
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    import_notes TEXT,
    triggers_revalidation BOOLEAN DEFAULT 1,
    FOREIGN KEY(source_id) REFERENCES data_sources(source_id)
);

-- 7. ANALYSIS RUNS: Versioned analysis runs
CREATE TABLE IF NOT EXISTS analysis_runs (
    run_id TEXT PRIMARY KEY,
    run_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_version TEXT NOT NULL,
    source_files_used TEXT,
    parser_version TEXT DEFAULT '0.3',
    rule_engine_version TEXT DEFAULT '0.3',
    metrics_version TEXT DEFAULT '0.3',
    folio_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    rule_count INTEGER DEFAULT 0,
    triggered_by TEXT CHECK(triggered_by IN (
        'manual', 'new_data_import', 'scheduled', 'test'
    )) DEFAULT 'manual',
    status TEXT CHECK(status IN (
        'running', 'complete', 'failed', 'partial'
    )) DEFAULT 'running',
    notes TEXT
);

-- 8. EVIDENCE ITEMS: 4-tier evidence separation
-- This enforces the separation of evidence types.
CREATE TABLE IF NOT EXISTS evidence_items (
    evidence_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    evidence_tier TEXT NOT NULL CHECK(evidence_tier IN (
        'primary_evidence',    -- Yale images, EVA transcription, folio metadata
        'derived_evidence',    -- Token freq, n-gram, entropy, section metrics
        'external_claim',      -- Other researchers' assertions
        'hypothesis_eval'      -- Our hypothesis evaluation
    )),
    source_id TEXT,
    related_rule_id TEXT,
    related_folio_id TEXT,
    evidence_text TEXT NOT NULL,
    evidence_value REAL,
    evidence_unit TEXT,
    supports_hypothesis BOOLEAN,
    confidence REAL CHECK(confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    run_id TEXT,
    FOREIGN KEY(source_id) REFERENCES data_sources(source_id),
    FOREIGN KEY(related_rule_id) REFERENCES rule_candidate(rule_id),
    FOREIGN KEY(related_folio_id) REFERENCES folio(folio_id),
    FOREIGN KEY(run_id) REFERENCES analysis_runs(run_id)
);

-- 9. RULE VALIDATION HISTORY: Track how rules change over time
CREATE TABLE IF NOT EXISTS rule_validation_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id TEXT NOT NULL,
    run_id TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    previous_evidence INTEGER,
    new_evidence INTEGER,
    previous_confidence REAL,
    new_confidence REAL,
    change_reason TEXT CHECK(change_reason IN (
        'new_data_added', 'manual_review', 'counterexample_found',
        'revalidation_pass', 'revalidation_fail', 'initial'
    )) DEFAULT 'initial',
    change_detail TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(rule_id) REFERENCES rule_candidate(rule_id),
    FOREIGN KEY(run_id) REFERENCES analysis_runs(run_id)
);

-- 10. HYPOTHESIS EVALUATIONS: Track hypothesis status over time
CREATE TABLE IF NOT EXISTS hypothesis_evaluations (
    eval_id TEXT PRIMARY KEY,
    run_id TEXT,
    hypothesis_text TEXT NOT NULL DEFAULT
        'The Voynich Manuscript may share structural properties with reference/taxonomic corpora rather than natural prose or cipher text.',
    supporting_evidence_count INTEGER DEFAULT 0,
    contradicting_evidence_count INTEGER DEFAULT 0,
    neutral_evidence_count INTEGER DEFAULT 0,
    overall_status TEXT CHECK(overall_status IN (
        'strongly_supported', 'partially_supported', 'neutral',
        'weakly_contradicted', 'strongly_contradicted', 'insufficient_data'
    )) DEFAULT 'insufficient_data',
    confidence_level REAL CHECK(confidence_level >= 0 AND confidence_level <= 1) DEFAULT 0.0,
    key_supporting_rules TEXT,
    key_contradicting_evidence TEXT,
    next_verification_needed TEXT,
    evaluator_notes TEXT,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(run_id) REFERENCES analysis_runs(run_id)
);

-- 11. COMPARISON METHODS: Methodology references
CREATE TABLE IF NOT EXISTS comparison_methods (
    method_id TEXT PRIMARY KEY,
    method_name TEXT NOT NULL,
    method_description TEXT,
    source_research_id TEXT,
    method_type TEXT CHECK(method_type IN (
        'statistical', 'linguistic', 'cryptographic',
        'image_analysis', 'corpus_comparison', 'entropy', 'other'
    )),
    we_use_it BOOLEAN DEFAULT 0,
    why_we_use_or_avoid TEXT,
    implementation_notes TEXT,
    FOREIGN KEY(source_research_id) REFERENCES external_research(research_id)
);

-- 12. METHODOLOGY REFERENCES: Bibliography
CREATE TABLE IF NOT EXISTS methodology_references (
    ref_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    authors TEXT,
    year INTEGER,
    publication TEXT,
    url TEXT,
    method_ids TEXT,
    relevance TEXT CHECK(relevance IN (
        'core_method', 'comparison_baseline', 'failure_example',
        'historical_context', 'data_source', 'peripheral'
    )),
    our_notes TEXT,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR NEW TABLES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_data_sources_tier ON data_sources(evidence_tier);
CREATE INDEX IF NOT EXISTS idx_data_sources_primary ON data_sources(is_primary_source);
CREATE INDEX IF NOT EXISTS idx_source_files_source ON source_files(source_id);
CREATE INDEX IF NOT EXISTS idx_source_files_status ON source_files(parse_status);
CREATE INDEX IF NOT EXISTS idx_external_research_year ON external_research(publication_year);
CREATE INDEX IF NOT EXISTS idx_research_claims_type ON research_claims(claim_type);
CREATE INDEX IF NOT EXISTS idx_research_claims_status ON research_claims(our_evaluation_status);
CREATE INDEX IF NOT EXISTS idx_research_claims_hypothesis ON research_claims(relation_to_our_hypothesis);
CREATE INDEX IF NOT EXISTS idx_failure_cases_reason ON failure_cases(failure_reason);
CREATE INDEX IF NOT EXISTS idx_failure_cases_relevance ON failure_cases(relevance_to_our_project);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_date ON analysis_runs(run_date);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_status ON analysis_runs(status);
CREATE INDEX IF NOT EXISTS idx_evidence_items_tier ON evidence_items(evidence_tier);
CREATE INDEX IF NOT EXISTS idx_evidence_items_hypothesis ON evidence_items(supports_hypothesis);
CREATE INDEX IF NOT EXISTS idx_rule_validation_history_rule ON rule_validation_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_validation_history_run ON rule_validation_history(run_id);
CREATE INDEX IF NOT EXISTS idx_hypothesis_evals_run ON hypothesis_evaluations(run_id);
CREATE INDEX IF NOT EXISTS idx_hypothesis_evals_status ON hypothesis_evaluations(overall_status);

-- ============================================================================
-- GUARDRAIL: Hypothesis protection view
-- ============================================================================

CREATE VIEW IF NOT EXISTS v_hypothesis_guard AS
SELECT
    'GUARDRAIL ACTIVE' AS status,
    'The Voynich Manuscript may share structural properties with reference/taxonomic corpora.' AS core_hypothesis,
    COUNT(CASE WHEN relation_to_our_hypothesis = 'supports' THEN 1 END) AS supporting_claims,
    COUNT(CASE WHEN relation_to_our_hypothesis = 'contradicts' THEN 1 END) AS contradicting_claims,
    COUNT(CASE WHEN relation_to_our_hypothesis = 'neutral' THEN 1 END) AS neutral_claims,
    'external claims are SEPARATE from primary evidence' AS evidence_separation_reminder
FROM research_claims;

-- ============================================================================
-- SEED: Initial metadata for v0.3
-- ============================================================================

INSERT OR IGNORE INTO analysis_metadata (metadata_key, metadata_value)
VALUES ('schema_version', '0.3');

INSERT OR IGNORE INTO analysis_metadata (metadata_key, metadata_value)
VALUES ('evidence_ingestion_system', 'active');

INSERT OR IGNORE INTO analysis_metadata (metadata_key, metadata_value)
VALUES ('hypothesis_guardrail', 'active');
