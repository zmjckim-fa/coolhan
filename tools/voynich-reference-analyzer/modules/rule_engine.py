"""
Rule Engine Module - Generate and validate rule candidates

A rule candidate is a linguistic pattern that appears regularly in the text.
Each rule tracks:
- Evidence count (how many times observed)
- Exception count (how many times violated)
- Confidence (% of pattern-matching contexts where rule applies)
- Validation status (candidate, validated, rejected, etc)
"""

from typing import List, Dict, Tuple, Optional
from collections import Counter
from dataclasses import dataclass, field
from enum import Enum
import sqlite3

from .eva_parser import PhysicalLine, Token

# ============================================================================
# DATA STRUCTURES
# ============================================================================

class ValidationStatus(Enum):
    """Rule validation status"""
    CANDIDATE = "candidate"
    VALIDATED = "validated"
    PARTIALLY_VALIDATED = "partially_validated"
    REJECTED = "rejected"
    NEEDS_REVIEW = "needs_review"

class RuleType(Enum):
    """Rule type classification"""
    POSITION_CONSTRAINT = "position_constraint"
    FREQUENCY_PATTERN = "frequency_pattern"
    WORD_FINAL_RULE = "word_final_rule"
    SECTION_SPECIFIC = "section_specific"
    TOKEN_FAMILY = "token_family"
    ENTROPY_PATTERN = "entropy_pattern"

@dataclass
class RuleCandidate:
    """Rule candidate with validation tracking"""
    rule_id: str
    rule_name: str
    rule_description: str
    rule_type: RuleType
    evidence_count: int = 0
    exception_count: int = 0
    confidence: float = 0.0  # evidence / (evidence + exception)
    validation_status: ValidationStatus = ValidationStatus.CANDIDATE
    affected_folios: List[str] = field(default_factory=list)
    affected_sections: List[str] = field(default_factory=list)
    counterexamples: List[str] = field(default_factory=list)
    notes: str = ""

    def update_confidence(self):
        """Update confidence score based on evidence/exceptions"""
        total = self.evidence_count + self.exception_count
        if total > 0:
            self.confidence = self.evidence_count / total
        else:
            self.confidence = 0.0

    def is_strong(self, min_evidence: int = 50, min_confidence: float = 0.70) -> bool:
        """Check if rule meets strength thresholds"""
        return self.evidence_count >= min_evidence and self.confidence >= min_confidence

# ============================================================================
# RULE ENGINE
# ============================================================================

class RuleEngine:
    """Generate and manage rule candidates"""

    def __init__(self, word_final_chars: List[str] = None):
        """
        Initialize rule engine

        Args:
            word_final_chars: Characters to track as word-final
        """
        self.word_final_chars = word_final_chars or ['y', 'r', 'l', 'n']
        self.rules: Dict[str, RuleCandidate] = {}
        self.rule_counter = 0

    # ========================================================================
    # RULE GENERATION
    # ========================================================================

    def generate_all_candidates(self, lines: List[PhysicalLine]) -> List[RuleCandidate]:
        """
        Generate all rule candidates from text

        Args:
            lines: List of parsed lines

        Returns:
            List of RuleCandidate objects
        """
        candidates = []

        # Rule 1: Word-final character constraint
        candidates.append(self._generate_word_final_rule(lines))

        # Rule 2: Position constraints (q→o, etc)
        candidates.extend(self._generate_position_rules(lines))

        # Rule 3: High-frequency tokens
        candidates.extend(self._generate_frequency_rules(lines))

        # Rule 4: Section-specific vocabulary
        candidates.append(self._generate_section_specificity_rule(lines))

        # Rule 5: Token families
        candidates.extend(self._generate_token_family_rules(lines))

        # Rule 6: Character frequency patterns
        candidates.extend(self._generate_frequency_pattern_rules(lines))

        # Store and return
        for rule in candidates:
            if rule:
                self.rules[rule.rule_id] = rule

        return candidates

    def _generate_word_final_rule(self, lines: List[PhysicalLine]) -> Optional[RuleCandidate]:
        """Generate rule: words tend to end with y/r/l/n"""
        rule_id = self._next_rule_id()
        evidence = 0
        exceptions = 0
        affected_folios = set()

        for line in lines:
            for token in line.tokens:
                if token.glyphs:
                    final_char = token.glyphs[-1].char
                    if final_char in self.word_final_chars:
                        evidence += 1
                    else:
                        exceptions += 1
                    affected_folios.add(line.folio_id)

        rule = RuleCandidate(
            rule_id=rule_id,
            rule_name="Word-Final Constraint",
            rule_description=f"Words tend to end with {', '.join(self.word_final_chars)}",
            rule_type=RuleType.WORD_FINAL_RULE,
            evidence_count=evidence,
            exception_count=exceptions,
            affected_folios=list(affected_folios)
        )

        rule.update_confidence()
        return rule

    def _generate_position_rules(self, lines: List[PhysicalLine]) -> List[RuleCandidate]:
        """Generate position constraint rules (X followed by Y)"""
        rules = []
        position_patterns = Counter()
        pattern_evidence = {}  # {pattern: {evidence: count, exceptions: count}}

        # Collect character sequences
        for line in lines:
            for token in line.tokens:
                for i in range(len(token.glyphs) - 1):
                    current = token.glyphs[i].char
                    next_char = token.glyphs[i + 1].char
                    pattern = f"{current}→{next_char}"
                    position_patterns[pattern] += 1

        # Create rules for most common patterns
        for pattern, count in position_patterns.most_common(10):
            if count < 5:  # Minimum occurrences
                break

            rule_id = self._next_rule_id()
            rule = RuleCandidate(
                rule_id=rule_id,
                rule_name=f"Position Constraint: {pattern}",
                rule_description=f"Character sequence '{pattern}' appears {count} times",
                rule_type=RuleType.POSITION_CONSTRAINT,
                evidence_count=count,
                exception_count=0  # Unknown without full analysis
            )

            rules.append(rule)

        return rules

    def _generate_frequency_rules(self, lines: List[PhysicalLine]) -> List[RuleCandidate]:
        """Generate rules about high-frequency tokens"""
        rules = []

        # Count token frequencies
        all_tokens = []
        for line in lines:
            all_tokens.extend([t.text for t in line.tokens])

        token_counter = Counter(all_tokens)
        tracked_tokens = ['chol', 'daiin', 'dain', 'ch', 'y']

        for token_text, count in token_counter.most_common(20):
            if count < 10:
                break

            rule_id = self._next_rule_id()
            rule = RuleCandidate(
                rule_id=rule_id,
                rule_name=f"High-Frequency Token: '{token_text}'",
                rule_description=f"Token '{token_text}' appears {count} times",
                rule_type=RuleType.FREQUENCY_PATTERN,
                evidence_count=count,
                exception_count=0
            )

            rules.append(rule)

        return rules

    def _generate_section_specificity_rule(self, lines: List[PhysicalLine]) -> RuleCandidate:
        """Generate rule: vocabulary differs significantly by section"""
        rule_id = self._next_rule_id()

        # This is a structural observation, not counted as evidence/exceptions
        return RuleCandidate(
            rule_id=rule_id,
            rule_name="Section-Specific Vocabulary",
            rule_description="Each manuscript section has distinct vocabulary distribution",
            rule_type=RuleType.SECTION_SPECIFIC,
            evidence_count=6,  # 6 sections
            exception_count=0
        )

    def _generate_token_family_rules(self, lines: List[PhysicalLine]) -> List[RuleCandidate]:
        """Generate rules about token families (similar words)"""
        rules = []

        # This would require edit distance analysis (Levenshtein, etc)
        # Placeholder for now
        rule_id = self._next_rule_id()
        rule = RuleCandidate(
            rule_id=rule_id,
            rule_name="Token Family Clustering",
            rule_description="Words cluster into families with similar forms",
            rule_type=RuleType.TOKEN_FAMILY,
            evidence_count=0,  # Would need edit distance calculation
            exception_count=0
        )

        rules.append(rule)
        return rules

    def _generate_frequency_pattern_rules(self, lines: List[PhysicalLine]) -> List[RuleCandidate]:
        """Generate rules about character frequency patterns"""
        rules = []

        # Collect character frequencies
        char_freq = Counter()
        for line in lines:
            for token in line.tokens:
                for glyph in token.glyphs:
                    char_freq[glyph.char] += 1

        total_chars = sum(char_freq.values())

        # Create rules for dominant characters
        for char, count in char_freq.most_common(5):
            percentage = (count / total_chars) * 100

            rule_id = self._next_rule_id()
            rule = RuleCandidate(
                rule_id=rule_id,
                rule_name=f"Character Frequency: '{char}'",
                rule_description=f"Character '{char}' appears in {percentage:.1f}% of text",
                rule_type=RuleType.FREQUENCY_PATTERN,
                evidence_count=count
            )

            rules.append(rule)

        return rules

    # ========================================================================
    # VALIDATION & STRENGTH
    # ========================================================================

    def validate_rule(
        self,
        rule: RuleCandidate,
        min_evidence: int = 50,
        min_confidence: float = 0.70
    ):
        """
        Update rule validation status based on evidence

        Args:
            rule: RuleCandidate to validate
            min_evidence: Minimum evidence count for validation
            min_confidence: Minimum confidence for validation
        """
        if rule.evidence_count < 10:
            rule.validation_status = ValidationStatus.CANDIDATE
        elif rule.evidence_count >= min_evidence and rule.confidence >= min_confidence:
            rule.validation_status = ValidationStatus.VALIDATED
        elif rule.evidence_count >= min_evidence:
            rule.validation_status = ValidationStatus.PARTIALLY_VALIDATED
        elif rule.confidence < 0.5:
            rule.validation_status = ValidationStatus.REJECTED
        else:
            rule.validation_status = ValidationStatus.NEEDS_REVIEW

    def get_strongest_rules(
        self,
        min_evidence: int = 50,
        min_confidence: float = 0.70,
        limit: int = 10
    ) -> List[RuleCandidate]:
        """
        Get strongest (most validated) rules

        Args:
            min_evidence: Minimum evidence count
            min_confidence: Minimum confidence
            limit: Maximum number of rules to return

        Returns:
            List of RuleCandidate objects, sorted by strength
        """
        strong_rules = [
            rule for rule in self.rules.values()
            if rule.evidence_count >= min_evidence and rule.confidence >= min_confidence
        ]

        strong_rules.sort(
            key=lambda r: (r.confidence, r.evidence_count),
            reverse=True
        )

        return strong_rules[:limit]

    # ========================================================================
    # DATABASE STORAGE
    # ========================================================================

    def store_rules(self, db_connection: sqlite3.Connection):
        """
        Store rules in database

        Args:
            db_connection: SQLite connection
        """
        cursor = db_connection.cursor()

        for rule in self.rules.values():
            cursor.execute("""
                INSERT OR REPLACE INTO rule_candidate
                (rule_id, rule_name, rule_description, rule_type,
                 evidence_count, exception_count, confidence,
                 validation_status, affected_folios, affected_sections, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                rule.rule_id,
                rule.rule_name,
                rule.rule_description,
                rule.rule_type.value,
                rule.evidence_count,
                rule.exception_count,
                rule.confidence,
                rule.validation_status.value,
                ','.join(rule.affected_folios),
                ','.join(rule.affected_sections),
                rule.notes
            ))

        db_connection.commit()

    # ========================================================================
    # UTILITIES
    # ========================================================================

    def _next_rule_id(self) -> str:
        """Generate next rule ID"""
        self.rule_counter += 1
        return f"RULE-{self.rule_counter:03d}"

    def summary(self) -> Dict:
        """Get summary of all rules"""
        return {
            'total_rules': len(self.rules),
            'validated': sum(
                1 for r in self.rules.values()
                if r.validation_status == ValidationStatus.VALIDATED
            ),
            'candidates': sum(
                1 for r in self.rules.values()
                if r.validation_status == ValidationStatus.CANDIDATE
            ),
            'rejected': sum(
                1 for r in self.rules.values()
                if r.validation_status == ValidationStatus.REJECTED
            )
        }

if __name__ == "__main__":
    from eva_parser import parse_eva_file

    # Example
    test_file = "data/raw/IT2a-n.txt"
    try:
        lines, _ = parse_eva_file(test_file)
        engine = RuleEngine()

        rules = engine.generate_all_candidates(lines)
        print(f"Generated {len(rules)} rule candidates")

        # Validate all rules
        for rule in rules:
            engine.validate_rule(rule)

        print(f"\nSummary:")
        print(engine.summary())

        print(f"\nTop 5 rules:")
        for rule in engine.get_strongest_rules(limit=5):
            print(f"  - {rule.rule_name}: {rule.evidence_count} evidence, {rule.confidence:.1%} confidence")
    except Exception as e:
        print(f"Error: {e}")
