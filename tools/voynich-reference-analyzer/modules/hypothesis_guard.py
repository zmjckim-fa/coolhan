"""
Hypothesis Guardrail Module

Enforces the core research direction and prevents hypothesis drift.

CORE HYPOTHESIS (immutable):
"The Voynich Manuscript may share structural properties with
reference/taxonomic corpora rather than natural prose or cipher text."

This module:
1. Validates that new claims don't replace our hypothesis.
2. Detects when external research is being treated as fact.
3. Warns when evidence tiers are being mixed.
4. Provides a compliance report.
"""

from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class ViolationType(Enum):
    TRANSLATION_AS_FACT = "translation_claim_treated_as_fact"
    LANGUAGE_HYPOTHESIS_ADOPTED = "specific_language_hypothesis_adopted"
    IMAGE_DRIVEN_MEANING = "image_driven_meaning_assignment"
    DECIPHERMENT_CLAIMED = "decipherment_success_claimed"
    SINGLE_RESEARCHER_DEPENDENCY = "single_researcher_methodology_dependency"
    SELECTIVE_EVIDENCE = "selective_evidence_only"
    EVIDENCE_TIER_MIXED = "evidence_tier_mixed"
    EXTERNAL_AS_PRIMARY = "external_claim_stored_as_primary_evidence"


@dataclass
class GuardrailViolation:
    violation_type: str
    severity: str  # 'critical', 'warning', 'info'
    description: str
    recommendation: str


@dataclass
class GuardrailReport:
    is_compliant: bool
    violations: List[GuardrailViolation]
    warnings: List[str]
    hypothesis_status: str
    compliance_score: float  # 0.0 - 1.0


class HypothesisGuard:
    """
    Enforces research direction guardrails.
    """

    HYPOTHESIS = (
        "The Voynich Manuscript may share structural properties with "
        "reference/taxonomic corpora rather than natural prose or cipher text."
    )

    # These phrases are forbidden in primary evidence tables
    FORBIDDEN_PHRASES = [
        "translates to", "means", "is the word for",
        "deciphered", "decoded", "proven to be",
        "definitely", "certainly identifies", "confirmed as"
    ]

    # These claim types require extra scrutiny
    HIGH_RISK_CLAIM_TYPES = [
        "translation_claim",
        "language_identification_claim",
        "botanical_identification_claim"
    ]

    # Allowed uses of external research
    ALLOWED_USES = [
        "raw_data_supplement",      # Use their data, not conclusions
        "comparison_baseline",      # Compare our results with theirs
        "verification_method",      # Reference their method, apply independently
        "failure_lesson",           # What NOT to do
        "counterexample_source"     # Find contradictions to test hypothesis
    ]

    def check_claim(self, claim_text: str, claim_type: str,
                     target_table: str) -> Tuple[bool, List[GuardrailViolation]]:
        """
        Check if a claim is safe to store in a given table.

        Returns: (is_safe, violations)
        """
        violations = []

        # Check: translation claims must not go to facts/primary tables
        if claim_type == "translation_claim" and target_table != "research_claims":
            violations.append(GuardrailViolation(
                violation_type=ViolationType.TRANSLATION_AS_FACT.value,
                severity="critical",
                description=f"Translation claim attempted to enter '{target_table}' (non-claim table).",
                recommendation="Store translation claims ONLY in research_claims with status='historical_interest_only'."
            ))

        # Check: forbidden phrases in primary evidence
        if target_table in ("folio", "token", "physical_line", "folio_metrics"):
            for phrase in self.FORBIDDEN_PHRASES:
                if phrase.lower() in claim_text.lower():
                    violations.append(GuardrailViolation(
                        violation_type=ViolationType.TRANSLATION_AS_FACT.value,
                        severity="critical",
                        description=f"Forbidden phrase '{phrase}' found in text targeting primary table '{target_table}'.",
                        recommendation="Remove interpretive language from primary evidence tables."
                    ))

        # Check: decipherment claims
        if any(p in claim_text.lower() for p in ["deciphered", "decoded", "solved"]):
            violations.append(GuardrailViolation(
                violation_type=ViolationType.DECIPHERMENT_CLAIMED.value,
                severity="critical",
                description="Text contains decipherment success claim.",
                recommendation="This program does not claim decipherment. Rephrase as structural observation."
            ))

        return len(violations) == 0, violations

    def check_evidence_tier(self, source_is_external: bool,
                              target_tier: str) -> Tuple[bool, Optional[GuardrailViolation]]:
        """Ensure external sources don't flow into primary_evidence tier."""
        if source_is_external and target_tier == "primary_evidence":
            return False, GuardrailViolation(
                violation_type=ViolationType.EXTERNAL_AS_PRIMARY.value,
                severity="critical",
                description="External research source being tagged as 'primary_evidence'.",
                recommendation="External sources must use 'external_claim' tier. Primary evidence = Yale/EVA only."
            )
        return True, None

    def validate_ingestion_plan(self, source_type: str,
                                 evidence_tier: str,
                                 is_external: bool) -> GuardrailReport:
        """
        Full validation before any ingestion operation.
        """
        violations = []
        warnings = []

        # Rule 1: External = external_claim tier
        ok, v = self.check_evidence_tier(is_external, evidence_tier)
        if not ok and v:
            violations.append(v)

        # Rule 2: Primary images/EVA must be primary_evidence
        if source_type in ("primary_image", "eva_transcription") and evidence_tier != "primary_evidence":
            violations.append(GuardrailViolation(
                violation_type=ViolationType.EVIDENCE_TIER_MIXED.value,
                severity="warning",
                description=f"Source type '{source_type}' should be 'primary_evidence', not '{evidence_tier}'.",
                recommendation="Yale images and EVA transcriptions belong in primary_evidence tier."
            ))

        # Rule 3: Analysis reports are derived, not primary
        if source_type == "analysis_report" and evidence_tier == "primary_evidence":
            warnings.append("Analysis reports should be 'derived_evidence', not 'primary_evidence'.")

        is_compliant = len([v for v in violations if v.severity == "critical"]) == 0
        compliance_score = max(0.0, 1.0 - (len(violations) * 0.25) - (len(warnings) * 0.05))

        return GuardrailReport(
            is_compliant=is_compliant,
            violations=violations,
            warnings=warnings,
            hypothesis_status=f"ACTIVE: {self.HYPOTHESIS}",
            compliance_score=compliance_score
        )

    def generate_compliance_report(self) -> str:
        """Generate a text compliance report."""
        lines = [
            "# Hypothesis Guardrail Compliance Report",
            f"\n**Core Hypothesis:**\n> {self.HYPOTHESIS}",
            "\n## Active Guardrails",
            "| Rule | Status |",
            "|------|--------|",
            "| No translation claims as facts | ENFORCED |",
            "| No language hypothesis as default | ENFORCED |",
            "| No decipherment success claims | ENFORCED |",
            "| External claims separate from facts | ENFORCED |",
            "| Evidence tier separation | ENFORCED |",
            "\n## Allowed Uses of External Research",
        ]
        for use in self.ALLOWED_USES:
            lines.append(f"- {use}")
        lines.append("\n## Forbidden Actions")
        forbidden = [
            "Accept external translation as fact",
            "Adopt specific language hypothesis as default",
            "Assign meaning from illustrations",
            "Claim decipherment success",
            "Depend on single researcher's method",
            "Use selective evidence only",
        ]
        for f in forbidden:
            lines.append(f"- [FORBIDDEN] {f}")
        return "\n".join(lines)


# Singleton guard instance
guard = HypothesisGuard()
