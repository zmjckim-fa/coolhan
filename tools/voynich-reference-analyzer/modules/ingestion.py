"""
Ingestion Module - Research Evidence Ingestion & Validation System

CRITICAL DESIGN PRINCIPLE:
- Primary evidence (Yale images, EVA transcription) != External claims
- External researcher conclusions go to research_claims, NOT facts tables
- All ingested data is tagged with evidence_tier before storage
"""

import sqlite3
import hashlib
import json
import csv
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum


# ============================================================================
# ENUMS & CONSTANTS
# ============================================================================

class EvidenceTier(Enum):
    PRIMARY = "primary_evidence"        # Yale images, EVA, folio metadata
    DERIVED = "derived_evidence"        # Computed: freq, entropy, n-gram
    EXTERNAL_CLAIM = "external_claim"   # Other researchers' assertions
    HYPOTHESIS_EVAL = "hypothesis_eval" # Our own evaluation


class SourceType(Enum):
    PRIMARY_IMAGE = "primary_image"
    EVA_TRANSCRIPTION = "eva_transcription"
    VIB_METADATA = "vib_metadata"
    FOLIO_DESCRIPTION = "folio_description"
    COLOR_ANALYSIS = "color_analysis"
    TOKEN_ANALYSIS = "token_analysis"
    SECTION_METADATA = "section_metadata"
    COMPARISON_CORPUS = "comparison_corpus"
    ANALYSIS_REPORT = "analysis_report"
    EXTERNAL_RESEARCH = "external_research"
    OTHER = "other"


class ReliabilityLevel(Enum):
    PRIMARY = "primary"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNVERIFIED = "unverified"


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class DataSource:
    source_id: str
    source_type: str
    source_name: str
    evidence_tier: str
    author_or_origin: str = ""
    url_or_file_path: str = ""
    license_or_usage_note: str = ""
    reliability_level: str = "medium"
    is_primary_source: bool = False
    is_external_research: bool = False
    notes: str = ""


@dataclass
class ExternalResearch:
    research_id: str
    source_id: str
    researcher_name: str
    paper_title: str
    publication_year: Optional[int] = None
    data_used: str = ""
    methodology: str = ""
    main_claims: str = ""
    patterns_found: str = ""
    claims_decipherment: bool = False
    verification_method: str = ""
    refutation_reason: str = ""
    failure_causes: str = ""
    advantages_for_us: str = ""
    disadvantages_to_avoid: str = ""
    relevance_to_our_research: str = ""
    our_evaluation: str = "failure_lesson"


@dataclass
class ResearchClaim:
    claim_id: str
    source_id: str
    claim_text: str
    claim_type: str
    our_evaluation_status: str
    research_id: str = ""
    evidence_used: str = ""
    method_used: str = ""
    confidence_claimed_by_author: float = 0.0
    reason_for_status: str = ""
    relation_to_our_hypothesis: str = "unknown"
    caution_notes: str = ""


@dataclass
class FailureCase:
    failure_id: str
    source_id: str
    hypothesis_name: str
    failure_reason: str
    what_to_learn: str
    what_to_avoid: str
    research_id: str = ""
    method_used: str = ""
    failure_reason_detail: str = ""
    example_problem: str = ""
    relevance_to_our_project: str = "medium"


# ============================================================================
# INGESTION ENGINE
# ============================================================================

class IngestionEngine:
    """
    Core engine for ingesting research evidence.

    GUARDRAIL: This engine enforces evidence tier separation.
    External claims are NEVER written to primary evidence tables.
    """

    HYPOTHESIS = (
        "The Voynich Manuscript may share structural properties with "
        "reference/taxonomic corpora rather than natural prose or cipher text."
    )

    FORBIDDEN_ACTIONS = [
        "Do not accept external translation claims as facts",
        "Do not adopt specific language hypotheses as default",
        "Do not infer token meaning from images",
        "Do not use terms implying successful decipherment",
        "Do not depend on a single researcher's methodology",
        "Do not accept selective evidence only",
    ]

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self._ensure_schema()

    def _ensure_schema(self):
        """Load v0.3 schema if tables don't exist."""
        schema_path = Path(self.db_path).parent.parent / "database" / "schema_v03.sql"
        if schema_path.exists():
            with open(schema_path, "r", encoding="utf-8") as f:
                sql = f.read()
            try:
                self.conn.executescript(sql)
                self.conn.commit()
            except sqlite3.OperationalError:
                pass  # Tables already exist

    # ========================================================================
    # SOURCE INGESTION
    # ========================================================================

    def ingest_source(self, source: DataSource) -> bool:
        """Register a data source with full metadata."""
        try:
            self.conn.execute("""
                INSERT OR REPLACE INTO data_sources
                (source_id, source_type, source_name, author_or_origin,
                 url_or_file_path, imported_at, license_or_usage_note,
                 reliability_level, is_primary_source, is_external_research,
                 evidence_tier, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                source.source_id, source.source_type, source.source_name,
                source.author_or_origin, source.url_or_file_path,
                datetime.now().isoformat(), source.license_or_usage_note,
                source.reliability_level, int(source.is_primary_source),
                int(source.is_external_research), source.evidence_tier,
                source.notes
            ))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"[Ingestion] Source ingestion failed: {e}")
            return False

    def ingest_file(self, source_id: str, file_path: str) -> int:
        """Register a file under a source. Returns file_id."""
        path = Path(file_path)
        checksum = self._md5(file_path) if path.exists() else None
        suffix = path.suffix.lstrip('.').lower()
        file_type = suffix if suffix in ('txt','csv','json','jpg','png','pdf','md','sql') else 'other'

        cursor = self.conn.execute("""
            INSERT INTO source_files
            (source_id, file_name, file_path, file_type, file_size_bytes, checksum_md5, parse_status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        """, (
            source_id, path.name, str(path),
            file_type, path.stat().st_size if path.exists() else 0,
            checksum
        ))
        self.conn.commit()
        return cursor.lastrowid

    # ========================================================================
    # EXTERNAL RESEARCH
    # ========================================================================

    def ingest_external_research(self, research: ExternalResearch) -> bool:
        """
        Ingest external researcher's work.

        NOTE: This does NOT import their conclusions as facts.
        Their conclusions go to research_claims table only.
        """
        # First register as a data source
        source = DataSource(
            source_id=research.source_id,
            source_type="external_research",
            source_name=f"{research.researcher_name}: {research.paper_title}",
            evidence_tier=EvidenceTier.EXTERNAL_CLAIM.value,
            author_or_origin=research.researcher_name,
            is_primary_source=False,
            is_external_research=True,
            reliability_level="unverified",
            notes=f"Year: {research.publication_year}"
        )
        self.ingest_source(source)

        try:
            self.conn.execute("""
                INSERT OR REPLACE INTO external_research
                (research_id, source_id, researcher_name, paper_title,
                 publication_year, data_used, methodology, main_claims,
                 patterns_found, claims_decipherment, verification_method,
                 refutation_reason, failure_causes, advantages_for_us,
                 disadvantages_to_avoid, relevance_to_our_research, our_evaluation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                research.research_id, research.source_id,
                research.researcher_name, research.paper_title,
                research.publication_year, research.data_used,
                research.methodology, research.main_claims,
                research.patterns_found, int(research.claims_decipherment),
                research.verification_method, research.refutation_reason,
                research.failure_causes, research.advantages_for_us,
                research.disadvantages_to_avoid, research.relevance_to_our_research,
                research.our_evaluation
            ))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"[Ingestion] External research ingestion failed: {e}")
            return False

    # ========================================================================
    # CLAIM REGISTRY
    # ========================================================================

    def register_claim(self, claim: ResearchClaim) -> bool:
        """
        Register a research claim.

        GUARDRAIL: claim_type 'translation_claim' is ALWAYS marked
        'historical_interest_only' unless we override explicitly.
        """
        # Auto-apply guardrail to translation claims
        if claim.claim_type == 'translation_claim':
            if claim.our_evaluation_status not in ('rejected', 'contradicted'):
                claim.our_evaluation_status = 'historical_interest_only'
                claim.caution_notes = (
                    "[GUARDRAIL] Translation claims are not accepted as facts. "
                    + claim.caution_notes
                )

        try:
            self.conn.execute("""
                INSERT OR REPLACE INTO research_claims
                (claim_id, source_id, research_id, claim_text, claim_type,
                 evidence_used, method_used, confidence_claimed_by_author,
                 our_evaluation_status, reason_for_status,
                 relation_to_our_hypothesis, caution_notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                claim.claim_id, claim.source_id, claim.research_id,
                claim.claim_text, claim.claim_type,
                claim.evidence_used, claim.method_used,
                claim.confidence_claimed_by_author,
                claim.our_evaluation_status, claim.reason_for_status,
                claim.relation_to_our_hypothesis, claim.caution_notes
            ))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"[Ingestion] Claim registration failed: {e}")
            return False

    # ========================================================================
    # FAILURE CASES
    # ========================================================================

    def register_failure(self, failure: FailureCase) -> bool:
        """Register a research failure case."""
        try:
            self.conn.execute("""
                INSERT OR REPLACE INTO failure_cases
                (failure_id, source_id, research_id, hypothesis_name,
                 method_used, failure_reason, failure_reason_detail,
                 example_problem, what_to_learn, what_to_avoid,
                 relevance_to_our_project)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                failure.failure_id, failure.source_id, failure.research_id,
                failure.hypothesis_name, failure.method_used,
                failure.failure_reason, failure.failure_reason_detail,
                failure.example_problem, failure.what_to_learn,
                failure.what_to_avoid, failure.relevance_to_our_project
            ))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"[Ingestion] Failure case registration failed: {e}")
            return False

    # ========================================================================
    # ANALYSIS RUN MANAGEMENT
    # ========================================================================

    def start_analysis_run(self, data_version: str, triggered_by: str = "manual") -> str:
        """Create a new analysis run record. Returns run_id."""
        run_id = f"RUN-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        self.conn.execute("""
            INSERT INTO analysis_runs
            (run_id, run_date, data_version, triggered_by, status)
            VALUES (?, ?, ?, ?, 'running')
        """, (run_id, datetime.now().isoformat(), data_version, triggered_by))
        self.conn.commit()
        return run_id

    def complete_analysis_run(self, run_id: str, folio_count: int = 0,
                               token_count: int = 0, rule_count: int = 0,
                               status: str = "complete", notes: str = ""):
        """Mark an analysis run as complete."""
        self.conn.execute("""
            UPDATE analysis_runs
            SET status=?, folio_count=?, token_count=?, rule_count=?, notes=?
            WHERE run_id=?
        """, (status, folio_count, token_count, rule_count, notes, run_id))
        self.conn.commit()

    # ========================================================================
    # QUERIES
    # ========================================================================

    def get_all_sources(self) -> List[Dict]:
        rows = self.conn.execute(
            "SELECT * FROM data_sources ORDER BY imported_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]

    def get_primary_sources(self) -> List[Dict]:
        rows = self.conn.execute(
            "SELECT * FROM data_sources WHERE is_primary_source=1"
        ).fetchall()
        return [dict(r) for r in rows]

    def get_external_research_list(self) -> List[Dict]:
        rows = self.conn.execute(
            "SELECT * FROM external_research ORDER BY publication_year DESC"
        ).fetchall()
        return [dict(r) for r in rows]

    def get_claims(self, claim_type: str = None, status: str = None) -> List[Dict]:
        query = "SELECT * FROM research_claims WHERE 1=1"
        params = []
        if claim_type:
            query += " AND claim_type=?"
            params.append(claim_type)
        if status:
            query += " AND our_evaluation_status=?"
            params.append(status)
        rows = self.conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

    def get_failure_cases(self, relevance: str = None) -> List[Dict]:
        query = "SELECT * FROM failure_cases"
        params = []
        if relevance:
            query += " WHERE relevance_to_our_project=?"
            params.append(relevance)
        rows = self.conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

    def get_analysis_runs(self) -> List[Dict]:
        rows = self.conn.execute(
            "SELECT * FROM analysis_runs ORDER BY run_date DESC"
        ).fetchall()
        return [dict(r) for r in rows]

    def get_hypothesis_status(self) -> Dict:
        """Get current hypothesis evaluation summary."""
        claims = self.conn.execute("""
            SELECT
                COUNT(CASE WHEN relation_to_our_hypothesis='supports' THEN 1 END) AS supporting,
                COUNT(CASE WHEN relation_to_our_hypothesis='contradicts' THEN 1 END) AS contradicting,
                COUNT(CASE WHEN relation_to_our_hypothesis='neutral' THEN 1 END) AS neutral,
                COUNT(*) AS total
            FROM research_claims
        """).fetchone()

        rules = self.conn.execute("""
            SELECT validation_status, COUNT(*) as cnt
            FROM rule_candidate GROUP BY validation_status
        """).fetchall()

        return {
            "hypothesis": self.HYPOTHESIS,
            "claim_support": dict(claims) if claims else {},
            "rule_status": {r["validation_status"]: r["cnt"] for r in rules},
            "guardrail": "ACTIVE",
            "forbidden_actions": self.FORBIDDEN_ACTIONS
        }

    # ========================================================================
    # UTILITIES
    # ========================================================================

    def _md5(self, file_path: str) -> str:
        h = hashlib.md5()
        try:
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(8192), b''):
                    h.update(chunk)
            return h.hexdigest()
        except Exception:
            return ""

    def __del__(self):
        if hasattr(self, 'conn'):
            self.conn.close()
