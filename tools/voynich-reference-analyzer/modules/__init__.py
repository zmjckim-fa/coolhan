"""
Voynich Reference Analyzer - Core Modules v0.3

Purpose: Analyze the structural properties of the Voynich Manuscript
to test whether it encodes a reference/taxonomic system.

CORE HYPOTHESIS (immutable):
"The Voynich Manuscript may share structural properties with
reference/taxonomic corpora rather than natural prose or cipher text."

Module Structure:
- eva_parser:        Parse EVA (European Voynich Alphabet) notation
- statistics:        Compute token/character/section statistics
- rule_engine:       Generate and validate rule candidates
- entropy:           Calculate entropy and statistical measures
- corpus_compare:    Compare with reference corpora
- report_writer:     Generate analysis reports

NEW in v0.3 (Research Evidence Ingestion & Validation System):
- ingestion:         Ingest primary data and external research with tier separation
- revalidation:      Auto-revalidate rules when new data is added
- hypothesis_guard:  Enforce hypothesis direction; prevent evidence tier mixing
- dashboard_pages:   Streamlit pages for evidence ingestion UI

IMPORTANT: This is NOT a decipherment tool.
We analyze structure, not meaning.
External research conclusions are stored as CLAIMS, not facts.
"""

__version__ = "0.3"
__author__ = "AI Research Team"
__description__ = """
Voynich Reference Analyzer: Research tool for structural analysis
of the Voynich Manuscript using corpus linguistics and statistical
validation against reference corpora.

v0.3 adds: Research Evidence Ingestion & Validation System
- 12 new DB tables (data_sources, research_claims, failure_cases, ...)
- Evidence tier separation (Primary / Derived / External Claim / Hypothesis Eval)
- Hypothesis guardrail (prevents hypothesis drift from external research)
- Auto-revalidation of rules when new data is ingested
- 6 new Streamlit dashboard pages
- 6 auto-generated report templates
"""

# Core imports (v0.2)
from . import eva_parser
from . import statistics
from . import rule_engine
from . import entropy
from . import corpus_compare
from . import report_writer

# New imports (v0.3) — imported with graceful fallback
try:
    from . import ingestion
    from . import revalidation
    from . import hypothesis_guard
    from . import dashboard_pages
    EVIDENCE_SYSTEM_AVAILABLE = True
except ImportError as e:
    EVIDENCE_SYSTEM_AVAILABLE = False
    _import_error = str(e)

__all__ = [
    # v0.2
    'eva_parser',
    'statistics',
    'rule_engine',
    'entropy',
    'corpus_compare',
    'report_writer',
    # v0.3
    'ingestion',
    'revalidation',
    'hypothesis_guard',
    'dashboard_pages',
    'EVIDENCE_SYSTEM_AVAILABLE',
]


# ============================================================================
# Module Availability Check
# ============================================================================

def check_dependencies():
    """Check if all required dependencies are available"""
    required = [
        'pandas',
        'numpy',
        'scipy',
        'sqlite3',
        'sklearn',
        'matplotlib',
        'plotly',
        'streamlit',
    ]

    missing = []
    for package in required:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)

    if missing:
        print(f"WARNING: Missing dependencies: {', '.join(missing)}")
        print(f"Install with: pip install {' '.join(missing)}")
        return False

    return True


def check_evidence_system():
    """Check if v0.3 evidence ingestion system is available"""
    if EVIDENCE_SYSTEM_AVAILABLE:
        print("Evidence Ingestion System: READY")
        print("  - ingestion.py: IngestionEngine")
        print("  - revalidation.py: RevalidationEngine")
        print("  - hypothesis_guard.py: HypothesisGuard")
        print("  - dashboard_pages.py: 6 Streamlit pages")
        return True
    else:
        print(f"Evidence Ingestion System: UNAVAILABLE ({_import_error if 'EVIDENCE_SYSTEM_AVAILABLE' in dir() else 'unknown'})")
        return False


if __name__ == "__main__":
    print(f"Voynich Reference Analyzer v{__version__}")
    print(__description__)
    print(f"\nCore Dependencies: {'OK' if check_dependencies() else 'MISSING'}")
    print(f"Evidence System: {'OK' if EVIDENCE_SYSTEM_AVAILABLE else 'UNAVAILABLE'}")
