"""
Voynich Reference Analyzer - Core Modules v0.2

Purpose: Analyze the structural properties of the Voynich Manuscript
to test whether it encodes a reference/taxonomic system.

Module Structure:
- eva_parser: Parse EVA (European Voynich Alphabet) notation
- statistics: Compute token/character/section statistics
- rule_engine: Generate and validate rule candidates
- entropy: Calculate entropy and statistical measures
- corpus_compare: Compare with reference corpora
- report_writer: Generate analysis reports

IMPORTANT: This is NOT a decipherment tool.
We analyze structure, not meaning.
"""

__version__ = "0.2"
__author__ = "AI Research Team"
__description__ = """
Voynich Reference Analyzer: Research tool for structural analysis
of the Voynich Manuscript using corpus linguistics and statistical
validation against reference corpora.
"""

# Core imports
from . import eva_parser
from . import statistics
from . import rule_engine
from . import entropy
from . import corpus_compare
from . import report_writer

__all__ = [
    'eva_parser',
    'statistics',
    'rule_engine',
    'entropy',
    'corpus_compare',
    'report_writer'
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
        'scikit-learn',
        'matplotlib',
        'plotly'
    ]

    missing = []
    for package in required:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)

    if missing:
        print(f"⚠️  Missing dependencies: {', '.join(missing)}")
        print(f"Install with: pip install {' '.join(missing)}")
        return False

    return True

if __name__ == "__main__":
    print(f"Voynich Reference Analyzer v{__version__}")
    print(__description__)
    print(f"\nDependencies: {'✓ All present' if check_dependencies() else '✗ Missing packages'}")
