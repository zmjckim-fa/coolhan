"""
Voynich Reference Analyzer v0.2 - Configuration
"""

import os
from pathlib import Path

# ============================================================================
# PROJECT PATHS
# ============================================================================

PROJECT_ROOT = Path(__file__).parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
COMPARISON_CORPORA_DIR = DATA_DIR / "comparison_corpora"
DATABASE_DIR = PROJECT_ROOT / "database"
MODULES_DIR = PROJECT_ROOT / "modules"
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
DOCS_DIR = PROJECT_ROOT / "docs"

# Create directories if not exist
for directory in [DATA_DIR, RAW_DATA_DIR, PROCESSED_DATA_DIR,
                  COMPARISON_CORPORA_DIR, DATABASE_DIR]:
    directory.mkdir(exist_ok=True, parents=True)

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

DATABASE_PATH = DATABASE_DIR / "voynich.sqlite"
SCHEMA_PATH = DATABASE_DIR / "schema.sql"

# ============================================================================
# DATA SOURCES
# ============================================================================

EVA_TRANSCRIPTION_FILE = RAW_DATA_DIR / "IT2a-n.txt"
IMAGE_FOLIO_MAPPING_FILE = PROCESSED_DATA_DIR / "image_folio_mapping.csv"
YALE_IMAGES_DIR = RAW_DATA_DIR / "yale_beinecke_images"  # If available locally

# Comparison Corpora
COMPARISON_CORPORA = {
    "natural_language": {
        "file": COMPARISON_CORPORA_DIR / "english_natural.txt",
        "type": "natural_language",
        "description": "Natural English prose"
    },
    "herbal_description": {
        "file": COMPARISON_CORPORA_DIR / "herbal_descriptions.txt",
        "type": "herbal_description",
        "description": "Herbal/botanical descriptions"
    },
    "plant_list": {
        "file": COMPARISON_CORPORA_DIR / "plant_list.txt",
        "type": "plant_list",
        "description": "Plant names and catalogs"
    },
    "catalog_taxonomy": {
        "file": COMPARISON_CORPORA_DIR / "catalog_taxonomy.txt",
        "type": "catalog_taxonomy",
        "description": "Taxonomic catalogs and classifications"
    },
    "artificial_generated": {
        "file": COMPARISON_CORPORA_DIR / "artificial_generated.txt",
        "type": "artificial_generated",
        "description": "Artificially generated text"
    },
    "cipher_code": {
        "file": COMPARISON_CORPORA_DIR / "cipher_code.txt",
        "type": "cipher_code",
        "description": "Cipher and encoded text"
    }
}

# ============================================================================
# VOYNICH MANUSCRIPT STRUCTURE
# ============================================================================

VOYNICH_SECTIONS = [
    "Botanical",
    "Herbal",
    "Astronomical",
    "Biological",
    "Cosmological",
    "Pharmaceutical"
]

CURRIER_VERSIONS = ["A", "B", "unknown"]

# ============================================================================
# ANALYSIS PARAMETERS
# ============================================================================

# N-gram Analysis
NGRAM_SIZES = [1, 2, 3, 4]

# Word-final character positions (important for Voynich)
WORD_FINAL_CHARS = ["y", "r", "l", "n"]

# Common high-frequency tokens to track
TRACKED_TOKENS = ["chol", "daiin", "ch", "y", "dain", "ol"]

# Edit distance threshold for token family clustering
EDIT_DISTANCE_THRESHOLD = 0.85

# Entropy calculation parameters
ENTROPY_MIN_SAMPLE_SIZE = 10

# ============================================================================
# STATISTICAL TESTING
# ============================================================================

# Multiple comparison correction
MULTIPLE_COMPARISON_CORRECTION = "bonferroni"

# Confidence levels
CONFIDENCE_LEVEL = 0.95
P_VALUE_THRESHOLD = 0.05

# ============================================================================
# RULE CANDIDATE GENERATION
# ============================================================================

# Minimum evidence count for a rule to be "validated"
MIN_EVIDENCE_FOR_VALIDATION = 50

# Minimum confidence for a rule
MIN_CONFIDENCE = 0.70

# Rule types
RULE_TYPES = [
    "position_constraint",
    "frequency_pattern",
    "word_final_rule",
    "section_specific",
    "token_family",
    "entropy_pattern"
]

# ============================================================================
# VISUALIZATION
# ============================================================================

# Color palette for visualization
COLOR_VOYNICH = "#2c3e50"
COLOR_NATURAL = "#3498db"
COLOR_CATALOG = "#e74c3c"
COLOR_CIPHER = "#f39c12"
COLOR_ARTIFICIAL = "#95a5a6"

# Plot style
PLOT_STYLE = "seaborn-v0_8-darkgrid"
FIGURE_SIZE = (12, 6)
DPI = 100

# ============================================================================
# REPORT GENERATION
# ============================================================================

# Report templates
REPORT_OUTPUT_DIR = PROJECT_ROOT / "reports"
REPORT_OUTPUT_DIR.mkdir(exist_ok=True, parents=True)

REPORT_FORMATS = ["markdown", "pdf", "html"]

# ============================================================================
# STREAMLIT CONFIGURATION
# ============================================================================

STREAMLIT_PAGE_CONFIG = {
    "page_title": "Voynich Reference Analyzer",
    "page_icon": "📜",
    "layout": "wide",
    "initial_sidebar_state": "expanded"
}

# ============================================================================
# LOGGING
# ============================================================================

LOG_DIR = PROJECT_ROOT / "logs"
LOG_DIR.mkdir(exist_ok=True, parents=True)

LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# ============================================================================
# IMPORTANT DISCLAIMER
# ============================================================================

PROGRAM_DISCLAIMER = """
⚠️  IMPORTANT: This is NOT a decipherment tool.

This program does NOT:
- Translate Voynichese
- Claim to have decoded the manuscript
- Assign fixed meanings to words
- Make definitive claims about authorship

This program DOES:
- Analyze document structure
- Extract candidate rules with evidence
- Compare structural patterns with reference corpora
- Provide statistical validation
- Produce reproducible analysis
"""

# ============================================================================
# VERSION & METADATA
# ============================================================================

VERSION = "0.2"
AUTHOR = "AI Research Team"
DESCRIPTION = """
Voynich Reference Analyzer: A research tool for analyzing the structural
properties of the Voynich Manuscript and testing whether it encodes a
reference/taxonomic system similar to catalogs, classifications, or
formal databases.
"""

# ============================================================================
# DEBUG MODE
# ============================================================================

DEBUG = os.getenv("DEBUG", "False").lower() == "true"
VERBOSE = os.getenv("VERBOSE", "False").lower() == "true"

# ============================================================================
# SANITY CHECKS
# ============================================================================

def verify_config():
    """Verify that all required paths and configurations are valid"""
    issues = []

    if not DATABASE_DIR.exists():
        issues.append(f"Database directory does not exist: {DATABASE_DIR}")

    if not SCHEMA_PATH.exists():
        issues.append(f"Database schema not found: {SCHEMA_PATH}")

    if issues:
        print("⚠️  Configuration Issues Found:")
        for issue in issues:
            print(f"  - {issue}")
        return False

    return True

if __name__ == "__main__":
    print("=" * 70)
    print("Voynich Reference Analyzer v0.2 - Configuration Report")
    print("=" * 70)
    print(f"\nProject Root: {PROJECT_ROOT}")
    print(f"Database: {DATABASE_PATH}")
    print(f"EVA Transcription: {EVA_TRANSCRIPTION_FILE}")
    print(f"Comparison Corpora: {COMPARISON_CORPORA_DIR}")
    print(f"\nVoynich Sections: {', '.join(VOYNICH_SECTIONS)}")
    print(f"Tracked Tokens: {', '.join(TRACKED_TOKENS)}")
    print(f"Word-final Characters: {', '.join(WORD_FINAL_CHARS)}")
    print(f"\nDatabase Status: {'✓ Ready' if verify_config() else '✗ Issues Found'}")
    print("=" * 70)
