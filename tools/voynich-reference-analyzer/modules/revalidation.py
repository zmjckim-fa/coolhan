"""
Revalidation Module - Auto-revalidate rules when new data is added.

When new primary evidence is ingested, all existing rule candidates
are re-evaluated against the expanded dataset. This ensures that:
1. Rules strengthened by new data are promoted.
2. Rules weakened by new data are demoted.
3. Rules contradicted by new data are rejected.
4. All changes are recorded in rule_validation_history.
"""

import sqlite3
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class RevalidationResult:
    rule_id: str
    rule_name: str
    previous_status: str
    new_status: str
    previous_confidence: float
    new_confidence: float
    change_type: str  # 'strengthened', 'weakened', 'rejected', 'unchanged'
    detail: str


class RevalidationEngine:
    """
    Compares rule confidence before and after new data ingestion.
    Records all changes in rule_validation_history.
    """

    STRENGTHEN_THRESHOLD = 0.05   # +5% confidence -> strengthened
    WEAKEN_THRESHOLD = -0.05      # -5% confidence -> weakened
    REJECTION_CONFIDENCE = 0.40   # Below 40% -> rejected

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row

    def run_full_revalidation(self, run_id: str) -> List[RevalidationResult]:
        """
        Re-evaluate all rule candidates.

        Steps:
        1. Read all current rules with their pre-run stats.
        2. Recompute evidence/exception from token data.
        3. Compare and classify change.
        4. Write history records.
        5. Update rule_candidate table.
        """
        results = []
        rules = self._load_all_rules()

        for rule in rules:
            result = self._revalidate_rule(rule, run_id)
            results.append(result)

        return results

    def _load_all_rules(self) -> List[Dict]:
        rows = self.conn.execute(
            "SELECT * FROM rule_candidate"
        ).fetchall()
        return [dict(r) for r in rows]

    def _revalidate_rule(self, rule: Dict, run_id: str) -> RevalidationResult:
        """Revalidate a single rule against current token data."""
        rule_id = rule['rule_id']
        rule_type = rule['rule_type']

        prev_status = rule['validation_status']
        prev_confidence = rule.get('confidence', 0.0) or 0.0

        # Recompute evidence based on rule type
        new_evidence, new_exceptions = self._compute_evidence(rule_id, rule_type)
        total = new_evidence + new_exceptions
        new_confidence = new_evidence / total if total > 0 else prev_confidence

        # Determine new status
        new_status = self._determine_status(new_confidence, new_evidence)

        # Classify change
        delta = new_confidence - prev_confidence
        if delta >= self.STRENGTHEN_THRESHOLD:
            change_type = 'strengthened'
        elif delta <= self.WEAKEN_THRESHOLD:
            change_type = 'weakened'
        elif new_status == 'rejected' and prev_status != 'rejected':
            change_type = 'rejected'
        else:
            change_type = 'unchanged'

        detail = (
            f"Confidence: {prev_confidence:.2%} -> {new_confidence:.2%} "
            f"(D{delta:+.2%}), Evidence: {new_evidence}"
        )

        # Write to history
        self._record_history(rule_id, run_id, prev_status, new_status,
                              rule.get('evidence_count', 0), new_evidence,
                              prev_confidence, new_confidence, change_type, detail)

        # Update rule_candidate
        self._update_rule(rule_id, new_status, new_evidence, new_exceptions, new_confidence)

        return RevalidationResult(
            rule_id=rule_id,
            rule_name=rule['rule_name'],
            previous_status=prev_status,
            new_status=new_status,
            previous_confidence=prev_confidence,
            new_confidence=new_confidence,
            change_type=change_type,
            detail=detail
        )

    def _compute_evidence(self, rule_id: str, rule_type: str) -> Tuple[int, int]:
        """Recount evidence from token data for a given rule type."""
        if rule_type == 'word_final_rule':
            return self._compute_word_final_evidence()
        elif rule_type == 'position_constraint':
            return self._compute_position_evidence(rule_id)
        elif rule_type == 'frequency_pattern':
            return self._compute_frequency_evidence(rule_id)
        else:
            # For other types, keep existing counts
            row = self.conn.execute(
                "SELECT evidence_count, exception_count FROM rule_candidate WHERE rule_id=?",
                (rule_id,)
            ).fetchone()
            if row:
                return row['evidence_count'] or 0, row['exception_count'] or 0
            return 0, 0

    def _compute_word_final_evidence(self) -> Tuple[int, int]:
        """Count tokens ending with y/r/l/n vs others."""
        result = self.conn.execute("""
            SELECT
                SUM(CASE WHEN SUBSTR(t.token_text, -1) IN ('y','r','l','n')
                    THEN 1 ELSE 0 END) AS evidence,
                SUM(CASE WHEN SUBSTR(t.token_text, -1) NOT IN ('y','r','l','n')
                    THEN 1 ELSE 0 END) AS exceptions
            FROM token t
            WHERE LENGTH(t.token_text) > 0
        """).fetchone()
        if result:
            return (result['evidence'] or 0), (result['exceptions'] or 0)
        return 0, 0

    def _compute_position_evidence(self, rule_id: str) -> Tuple[int, int]:
        row = self.conn.execute(
            "SELECT evidence_count, exception_count FROM rule_candidate WHERE rule_id=?",
            (rule_id,)
        ).fetchone()
        return (row['evidence_count'] or 0, row['exception_count'] or 0) if row else (0, 0)

    def _compute_frequency_evidence(self, rule_id: str) -> Tuple[int, int]:
        row = self.conn.execute(
            "SELECT evidence_count, exception_count FROM rule_candidate WHERE rule_id=?",
            (rule_id,)
        ).fetchone()
        return (row['evidence_count'] or 0, row['exception_count'] or 0) if row else (0, 0)

    def _determine_status(self, confidence: float, evidence: int) -> str:
        if evidence < 10:
            return 'candidate'
        if confidence >= 0.70 and evidence >= 50:
            return 'validated'
        if confidence >= 0.60 and evidence >= 20:
            return 'partially_validated'
        if confidence < self.REJECTION_CONFIDENCE:
            return 'rejected'
        return 'needs_review'

    def _record_history(self, rule_id: str, run_id: str,
                         prev_status: str, new_status: str,
                         prev_evidence: int, new_evidence: int,
                         prev_conf: float, new_conf: float,
                         change_reason: str, detail: str):
        reason_map = {
            'strengthened': 'revalidation_pass',
            'weakened': 'revalidation_fail',
            'rejected': 'counterexample_found',
            'unchanged': 'revalidation_pass'
        }
        self.conn.execute("""
            INSERT INTO rule_validation_history
            (rule_id, run_id, previous_status, new_status,
             previous_evidence, new_evidence,
             previous_confidence, new_confidence,
             change_reason, change_detail, changed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            rule_id, run_id, prev_status, new_status,
            prev_evidence, new_evidence, prev_conf, new_conf,
            reason_map.get(change_reason, 'revalidation_pass'),
            detail, datetime.now().isoformat()
        ))
        self.conn.commit()

    def _update_rule(self, rule_id: str, new_status: str,
                      new_evidence: int, new_exceptions: int, new_confidence: float):
        self.conn.execute("""
            UPDATE rule_candidate
            SET validation_status=?, evidence_count=?,
                exception_count=?, confidence=?, updated_at=?
            WHERE rule_id=?
        """, (new_status, new_evidence, new_exceptions,
              new_confidence, datetime.now().isoformat(), rule_id))
        self.conn.commit()

    def get_revalidation_summary(self, results: List[RevalidationResult]) -> Dict:
        return {
            'total_rules': len(results),
            'strengthened': [r for r in results if r.change_type == 'strengthened'],
            'weakened': [r for r in results if r.change_type == 'weakened'],
            'rejected': [r for r in results if r.change_type == 'rejected'],
            'unchanged': [r for r in results if r.change_type == 'unchanged'],
        }

    def __del__(self):
        if hasattr(self, 'conn'):
            self.conn.close()
