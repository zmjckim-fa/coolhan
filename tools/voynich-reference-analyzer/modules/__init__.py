"""
Voynich Reference Analyzer - Core Modules

Version: 0.1
Purpose: Analyze Voynich Manuscript structure for reference/taxonomic system hypothesis
"""

__version__ = "0.1.0"
__author__ = "AI Research Team"

from . import db
from . import eva_parser
from . import metrics
from . import rule_engine
from . import corpus_compare
from . import report_writer

__all__ = [
    'db',
    'eva_parser',
    'metrics',
    'rule_engine',
    'corpus_compare',
    'report_writer'
]
