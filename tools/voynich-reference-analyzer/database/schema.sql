-- Voynich Reference Analyzer v0.2
-- SQLite Database Schema

-- ============================================================================
-- 1. FOLIO & IMAGE MAPPING
-- ============================================================================

CREATE TABLE IF NOT EXISTS folio (
    folio_id TEXT PRIMARY KEY,
    section TEXT NOT NULL,
    currier_version TEXT CHECK(currier_version IN ('A', 'B', 'unknown')),
    scribe_hand TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS image_folio_mapping (
    image_file TEXT PRIMARY KEY,
    image_index INTEGER,
    folio_id TEXT NOT NULL UNIQUE,
    section TEXT,
    confidence REAL CHECK(confidence >= 0 AND confidence <= 1),
    notes TEXT,
    FOREIGN KEY(folio_id) REFERENCES folio(folio_id)
);

CREATE INDEX idx_folio_section ON folio(section);
CREATE INDEX idx_folio_currier ON folio(currier_version);
CREATE INDEX idx_image_folio ON image_folio_mapping(folio_id);

-- ============================================================================
-- 2. EVA TRANSCRIPTION & PARSING
-- ============================================================================

CREATE TABLE IF NOT EXISTS physical_line (
    physical_line_id INTEGER PRIMARY KEY AUTOINCREMENT,
    folio_id TEXT NOT NULL,
    paragraph TEXT,
    line_number INTEGER,
    transcriber TEXT,
    raw_text TEXT NOT NULL,
    FOREIGN KEY(folio_id) REFERENCES folio(folio_id),
    UNIQUE(folio_id, paragraph, line_number)
);

CREATE TABLE IF NOT EXISTS token (
    token_id INTEGER PRIMARY KEY AUTOINCREMENT,
    physical_line_id INTEGER NOT NULL,
    token_text TEXT NOT NULL,
    token_position INTEGER,
    token_length INTEGER,
    contains_punctuation BOOLEAN,
    FOREIGN KEY(physical_line_id) REFERENCES physical_line(physical_line_id)
);

CREATE TABLE IF NOT EXISTS glyph (
    glyph_id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_id INTEGER NOT NULL,
    glyph_char TEXT NOT NULL,
    glyph_position INTEGER,
    FOREIGN KEY(token_id) REFERENCES token(token_id)
);

CREATE INDEX idx_physical_line_folio ON physical_line(folio_id);
CREATE INDEX idx_token_physical_line ON token(physical_line_id);
CREATE INDEX idx_token_text ON token(token_text);
CREATE INDEX idx_glyph_token ON glyph(token_id);
CREATE INDEX idx_glyph_char ON glyph(glyph_char);

-- ============================================================================
-- 3. STATISTICS & METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS folio_metrics (
    folio_id TEXT PRIMARY KEY,
    total_tokens INTEGER,
    unique_tokens INTEGER,
    token_type_ratio REAL,
    hapax_tokens INTEGER,
    hapax_ratio REAL,
    avg_token_length REAL,
    word_final_y_ratio REAL,
    word_final_r_ratio REAL,
    word_final_l_ratio REAL,
    word_final_n_ratio REAL,
    total_word_final_ratio REAL,
    entropy_1gram REAL,
    entropy_2gram REAL,
    conditional_entropy REAL,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(folio_id) REFERENCES folio(folio_id)
);

CREATE TABLE IF NOT EXISTS section_metrics (
    section TEXT PRIMARY KEY,
    total_tokens INTEGER,
    unique_tokens INTEGER,
    token_type_ratio REAL,
    hapax_ratio REAL,
    avg_token_length REAL,
    word_final_ratio REAL,
    entropy_1gram REAL,
    entropy_2gram REAL,
    ch_frequency REAL,
    daiin_frequency REAL,
    top_10_concentration REAL,
    vocabulary_divergence REAL,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS character_frequency (
    char TEXT PRIMARY KEY,
    frequency INTEGER,
    relative_frequency REAL,
    folio_id TEXT,
    section TEXT,
    FOREIGN KEY(folio_id) REFERENCES folio(folio_id)
);

CREATE TABLE IF NOT EXISTS ngram_frequency (
    ngram_type INTEGER CHECK(ngram_type IN (1, 2, 3, 4)),
    ngram TEXT NOT NULL,
    frequency INTEGER,
    relative_frequency REAL,
    folio_id TEXT,
    section TEXT,
    PRIMARY KEY(ngram_type, ngram, folio_id),
    FOREIGN KEY(folio_id) REFERENCES folio(folio_id)
);

CREATE INDEX idx_folio_metrics_ttr ON folio_metrics(token_type_ratio);
CREATE INDEX idx_folio_metrics_entropy ON folio_metrics(entropy_2gram);
CREATE INDEX idx_section_metrics ON section_metrics(section);

-- ============================================================================
-- 4. RULE CANDIDATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS rule_candidate (
    rule_id TEXT PRIMARY KEY,
    rule_name TEXT NOT NULL,
    rule_description TEXT NOT NULL,
    rule_type TEXT CHECK(rule_type IN (
        'position_constraint',
        'frequency_pattern',
        'word_final_rule',
        'section_specific',
        'token_family',
        'entropy_pattern'
    )),
    evidence_count INTEGER DEFAULT 0,
    exception_count INTEGER DEFAULT 0,
    confidence REAL CHECK(confidence >= 0 AND confidence <= 1),
    validation_status TEXT DEFAULT 'candidate' CHECK(validation_status IN (
        'candidate',
        'validated',
        'partially_validated',
        'rejected',
        'needs_review'
    )),
    affected_folios TEXT,
    affected_sections TEXT,
    counterexamples TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rule_evidence (
    evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id TEXT NOT NULL,
    folio_id TEXT,
    token_id INTEGER,
    evidence_text TEXT,
    evidence_type TEXT CHECK(evidence_type IN ('positive', 'negative', 'counterexample')),
    FOREIGN KEY(rule_id) REFERENCES rule_candidate(rule_id),
    FOREIGN KEY(folio_id) REFERENCES folio(folio_id),
    FOREIGN KEY(token_id) REFERENCES token(token_id)
);

CREATE INDEX idx_rule_candidate_status ON rule_candidate(validation_status);
CREATE INDEX idx_rule_candidate_type ON rule_candidate(rule_type);
CREATE INDEX idx_rule_evidence_rule ON rule_evidence(rule_id);
CREATE INDEX idx_rule_evidence_type ON rule_evidence(evidence_type);

-- ============================================================================
-- 5. TOKEN FAMILIES & CLUSTERING
-- ============================================================================

CREATE TABLE IF NOT EXISTS token_family (
    family_id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_name TEXT,
    root_token TEXT,
    member_tokens TEXT,
    edit_distance_threshold REAL DEFAULT 0.85,
    frequency INTEGER,
    sections TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS token_family_member (
    member_id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    token_text TEXT NOT NULL,
    edit_distance REAL,
    frequency INTEGER,
    FOREIGN KEY(family_id) REFERENCES token_family(family_id)
);

CREATE INDEX idx_token_family ON token_family_member(family_id);

-- ============================================================================
-- 6. COMPARISON CORPUS
-- ============================================================================

CREATE TABLE IF NOT EXISTS comparison_corpus (
    corpus_id TEXT PRIMARY KEY,
    corpus_name TEXT NOT NULL,
    corpus_type TEXT CHECK(corpus_type IN (
        'natural_language',
        'herbal_description',
        'plant_list',
        'catalog_taxonomy',
        'artificial_generated',
        'cipher_code'
    )),
    total_tokens INTEGER,
    unique_tokens INTEGER,
    avg_token_length REAL,
    entropy_1gram REAL,
    entropy_2gram REAL,
    conditional_entropy REAL,
    word_final_ratio REAL,
    top_10_concentration REAL,
    token_type_ratio REAL,
    hapax_ratio REAL,
    source TEXT,
    language TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS corpus_similarity (
    similarity_id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name TEXT NOT NULL,
    voynich_value REAL,
    corpus_id TEXT NOT NULL,
    corpus_value REAL,
    similarity_score REAL CHECK(similarity_score >= 0 AND similarity_score <= 1),
    distance REAL,
    FOREIGN KEY(corpus_id) REFERENCES comparison_corpus(corpus_id)
);

CREATE INDEX idx_corpus_type ON comparison_corpus(corpus_type);
CREATE INDEX idx_corpus_similarity ON corpus_similarity(corpus_id, metric_name);

-- ============================================================================
-- 7. ANALYSIS REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS analysis_report (
    report_id TEXT PRIMARY KEY,
    report_title TEXT NOT NULL,
    report_type TEXT CHECK(report_type IN (
        'folio_summary',
        'section_comparison',
        'rule_validation',
        'entropy_analysis',
        'corpus_comparison',
        'hypothesis_final'
    )),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_snapshot TEXT,
    conclusions TEXT,
    limitations TEXT,
    next_steps TEXT
);

CREATE TABLE IF NOT EXISTS analysis_metadata (
    metadata_key TEXT PRIMARY KEY,
    metadata_value TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. INITIALIZATION DATA
-- ============================================================================

-- Insert initial metadata
INSERT OR IGNORE INTO analysis_metadata (metadata_key, metadata_value)
VALUES ('database_version', '0.2');

INSERT OR IGNORE INTO analysis_metadata (metadata_key, metadata_value)
VALUES ('last_analysis', 'not_run');

INSERT OR IGNORE INTO analysis_metadata (metadata_key, metadata_value)
VALUES ('folio_count', '0');

INSERT OR IGNORE INTO analysis_metadata (metadata_key, metadata_value)
VALUES ('token_count', '0');

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Key Tables:
-- 1. Mapping: folio, image_folio_mapping
-- 2. Transcription: physical_line, token, glyph
-- 3. Metrics: folio_metrics, section_metrics, character_frequency, ngram_frequency
-- 4. Rules: rule_candidate, rule_evidence
-- 5. Families: token_family, token_family_member
-- 6. Corpus: comparison_corpus, corpus_similarity
-- 7. Reports: analysis_report, analysis_metadata

-- All queries are indexed for fast access on:
-- - folio_id, section, token_text, rule_status, corpus_type
