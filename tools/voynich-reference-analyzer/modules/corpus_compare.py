"""
Corpus Comparison Module - Compare Voynich with reference corpora

CRITICAL FEATURE: This is what transforms "Voynich is special" into
"Voynich is special LIKE A REFERENCE SYSTEM, not like natural language"

Metrics:
- Type-Token Ratio (TTR) / Corrected TTR
- Hapax ratio
- Word-final character concentration
- N-gram entropy
- Conditional entropy
- Top-10 token concentration
- Section divergence
- Token family density
- Position bias (leading/trailing character patterns)
"""

from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import math

from .eva_parser import PhysicalLine
from .statistics import StatisticsCalculator, TokenStatistics
from .entropy import EntropyCalculator, EntropyMetrics

# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class CorpusSimilarity:
    """Similarity between Voynich and reference corpus on one metric"""
    metric_name: str
    voynich_value: float
    corpus_name: str
    corpus_value: float
    distance: float  # Absolute difference
    similarity_score: float  # 0-1, where 1 = identical
    interpretation: str  # Human-readable interpretation

@dataclass
class CorpusProfile:
    """Complete statistical profile of a corpus"""
    corpus_name: str
    corpus_type: str
    total_tokens: int
    unique_tokens: int
    token_type_ratio: float
    corrected_ttr: float
    hapax_ratio: float
    avg_token_length: float
    word_final_ratio: float
    entropy_1gram: float
    entropy_2gram: float
    conditional_entropy: float
    top_10_concentration: float
    section_divergence: Optional[float] = None
    token_family_density: Optional[float] = None
    position_bias: Optional[float] = None

# ============================================================================
# CORPUS COMPARISON ENGINE
# ============================================================================

class CorpusComparator:
    """Compare Voynich with reference corpora"""

    def __init__(self):
        """Initialize comparator"""
        self.stats_calculator = StatisticsCalculator()
        self.entropy_calculator = EntropyCalculator()

    # ========================================================================
    # PROFILE GENERATION
    # ========================================================================

    def build_voynich_profile(self, lines: List[PhysicalLine]) -> CorpusProfile:
        """
        Build complete statistical profile for Voynich

        Args:
            lines: List of parsed Voynich lines

        Returns:
            CorpusProfile object
        """
        # Token statistics
        token_stats = self.stats_calculator.calculate_token_statistics(lines)

        # Entropy analysis
        entropy_metrics = self.entropy_calculator.analyze_entropy(lines)

        # Character frequencies
        char_freq = self.stats_calculator.calculate_character_frequency(lines)

        # Word-final analysis
        word_final = self.stats_calculator.analyze_word_final_patterns(lines)
        word_final_ratio = word_final['total']['percentage'] / 100

        # Top-10 concentration
        all_tokens = [t.text for line in lines for t in line.tokens]
        from collections import Counter
        token_counter = Counter(all_tokens)
        top_10_count = sum(count for _, count in token_counter.most_common(10))
        top_10_conc = (top_10_count / len(all_tokens) * 100) if all_tokens else 0

        # Corrected TTR
        corrected_ttr = self.stats_calculator.calculate_corrected_ttr(
            token_stats.total_tokens,
            token_stats.unique_tokens
        )

        return CorpusProfile(
            corpus_name="Voynich Manuscript",
            corpus_type="unknown",
            total_tokens=token_stats.total_tokens,
            unique_tokens=token_stats.unique_tokens,
            token_type_ratio=token_stats.token_type_ratio,
            corrected_ttr=corrected_ttr,
            hapax_ratio=token_stats.hapax_ratio,
            avg_token_length=token_stats.avg_token_length,
            word_final_ratio=word_final_ratio,
            entropy_1gram=entropy_metrics.entropy_1gram,
            entropy_2gram=entropy_metrics.entropy_2gram,
            conditional_entropy=entropy_metrics.conditional_entropy,
            top_10_concentration=top_10_conc
        )

    def build_reference_profile(
        self,
        lines: List[PhysicalLine],
        corpus_name: str,
        corpus_type: str
    ) -> CorpusProfile:
        """
        Build profile for reference corpus

        Args:
            lines: List of parsed lines from reference corpus
            corpus_name: Name of corpus
            corpus_type: Type (natural_language, catalog, etc)

        Returns:
            CorpusProfile object
        """
        # Same calculations as Voynich
        token_stats = self.stats_calculator.calculate_token_statistics(lines)
        entropy_metrics = self.entropy_calculator.analyze_entropy(lines)
        char_freq = self.stats_calculator.calculate_character_frequency(lines)
        word_final = self.stats_calculator.analyze_word_final_patterns(lines)
        word_final_ratio = word_final['total']['percentage'] / 100

        all_tokens = [t.text for line in lines for t in line.tokens]
        from collections import Counter
        token_counter = Counter(all_tokens)
        top_10_count = sum(count for _, count in token_counter.most_common(10))
        top_10_conc = (top_10_count / len(all_tokens) * 100) if all_tokens else 0

        corrected_ttr = self.stats_calculator.calculate_corrected_ttr(
            token_stats.total_tokens,
            token_stats.unique_tokens
        )

        return CorpusProfile(
            corpus_name=corpus_name,
            corpus_type=corpus_type,
            total_tokens=token_stats.total_tokens,
            unique_tokens=token_stats.unique_tokens,
            token_type_ratio=token_stats.token_type_ratio,
            corrected_ttr=corrected_ttr,
            hapax_ratio=token_stats.hapax_ratio,
            avg_token_length=token_stats.avg_token_length,
            word_final_ratio=word_final_ratio,
            entropy_1gram=entropy_metrics.entropy_1gram,
            entropy_2gram=entropy_metrics.entropy_2gram,
            conditional_entropy=entropy_metrics.conditional_entropy,
            top_10_concentration=top_10_conc
        )

    # ========================================================================
    # SIMILARITY CALCULATION
    # ========================================================================

    def compare_metric(
        self,
        metric_name: str,
        voynich_value: float,
        corpus_value: float
    ) -> CorpusSimilarity:
        """
        Compare a single metric

        Args:
            metric_name: Name of metric
            voynich_value: Value for Voynich
            corpus_value: Value for corpus

        Returns:
            CorpusSimilarity object
        """
        # Calculate distance
        distance = abs(voynich_value - corpus_value)

        # Calculate similarity (0-1, where 1 = identical)
        max_possible = max(voynich_value, corpus_value) if max(voynich_value, corpus_value) > 0 else 1
        similarity = 1.0 - (distance / max_possible)
        similarity = max(0.0, min(1.0, similarity))  # Clamp to [0, 1]

        # Generate interpretation
        if similarity > 0.9:
            interpretation = "Nearly identical"
        elif similarity > 0.75:
            interpretation = "Very similar"
        elif similarity > 0.6:
            interpretation = "Moderately similar"
        elif similarity > 0.4:
            interpretation = "Somewhat different"
        else:
            interpretation = "Significantly different"

        return CorpusSimilarity(
            metric_name=metric_name,
            voynich_value=voynich_value,
            corpus_name="",  # Set by caller
            corpus_value=corpus_value,
            distance=distance,
            similarity_score=similarity,
            interpretation=interpretation
        )

    def compare_profiles(
        self,
        voynich_profile: CorpusProfile,
        reference_profiles: Dict[str, CorpusProfile]
    ) -> Dict[str, List[CorpusSimilarity]]:
        """
        Compare Voynich against all reference corpora

        Args:
            voynich_profile: Voynich profile
            reference_profiles: Dict of corpus_name → CorpusProfile

        Returns:
            Dict of corpus_name → [CorpusSimilarity results]
        """
        # Metrics to compare
        metrics_to_compare = [
            ('token_type_ratio', 'Type-Token Ratio'),
            ('corrected_ttr', 'Corrected TTR'),
            ('hapax_ratio', 'Hapax Ratio'),
            ('avg_token_length', 'Avg Token Length'),
            ('word_final_ratio', 'Word-Final Concentration'),
            ('entropy_1gram', 'Entropy (1-gram)'),
            ('entropy_2gram', 'Entropy (2-gram)'),
            ('conditional_entropy', 'Conditional Entropy'),
            ('top_10_concentration', 'Top-10 Concentration')
        ]

        results = {}

        for corpus_name, ref_profile in reference_profiles.items():
            similarities = []

            for attr_name, display_name in metrics_to_compare:
                voynich_val = getattr(voynich_profile, attr_name, 0)
                corpus_val = getattr(ref_profile, attr_name, 0)

                similarity = self.compare_metric(display_name, voynich_val, corpus_val)
                similarity.corpus_name = corpus_name

                similarities.append(similarity)

            results[corpus_name] = similarities

        return results

    # ========================================================================
    # RANKINGS & RECOMMENDATIONS
    # ========================================================================

    def rank_corpora_by_similarity(
        self,
        comparison_results: Dict[str, List[CorpusSimilarity]]
    ) -> List[Tuple[str, float]]:
        """
        Rank reference corpora by overall similarity to Voynich

        Args:
            comparison_results: Results from compare_profiles()

        Returns:
            List of (corpus_name, avg_similarity_score), sorted descending
        """
        corpus_scores = {}

        for corpus_name, similarities in comparison_results.items():
            avg_similarity = sum(s.similarity_score for s in similarities) / len(similarities)
            corpus_scores[corpus_name] = avg_similarity

        # Sort by similarity (descending)
        ranked = sorted(corpus_scores.items(), key=lambda x: x[1], reverse=True)

        return ranked

    def get_closest_match(
        self,
        comparison_results: Dict[str, List[CorpusSimilarity]]
    ) -> Tuple[str, float]:
        """
        Get corpus most similar to Voynich

        Args:
            comparison_results: Results from compare_profiles()

        Returns:
            (corpus_name, similarity_score)
        """
        ranked = self.rank_corpora_by_similarity(comparison_results)

        if ranked:
            return ranked[0]
        else:
            return ("Unknown", 0.0)

    # ========================================================================
    # INTERPRETATION
    # ========================================================================

    @staticmethod
    def interpret_comparison(
        voynich_profile: CorpusProfile,
        closest_match: str,
        closest_similarity: float
    ) -> Dict[str, str]:
        """
        Interpret comparison results in linguistic terms

        Args:
            voynich_profile: Voynich profile
            closest_match: Name of most similar corpus
            closest_similarity: Similarity score

        Returns:
            Dictionary of interpretations
        """
        interpretations = {}

        # Overall interpretation
        if closest_similarity > 0.85:
            interpretations['overall'] = f"Voynich is structurally very similar to {closest_match}"
        elif closest_similarity > 0.70:
            interpretations['overall'] = f"Voynich shows significant structural similarity to {closest_match}"
        elif closest_similarity > 0.50:
            interpretations['overall'] = f"Voynich has moderate structural similarity to {closest_match}"
        else:
            interpretations['overall'] = f"Voynich is structurally distinct from {closest_match}"

        # TTR interpretation
        if voynich_profile.token_type_ratio > 0.60:
            interpretations['ttr'] = "High vocabulary diversity (more like reference systems than natural language)"
        elif voynich_profile.token_type_ratio < 0.40:
            interpretations['ttr'] = "Low vocabulary diversity (restricted vocabulary)"
        else:
            interpretations['ttr'] = "Moderate vocabulary diversity"

        # Entropy interpretation
        if voynich_profile.entropy_1gram < 4.0:
            interpretations['entropy'] = "Low entropy (highly structured)"
        elif voynich_profile.entropy_1gram > 6.0:
            interpretations['entropy'] = "High entropy (less structured)"
        else:
            interpretations['entropy'] = "Moderate entropy"

        return interpretations

if __name__ == "__main__":
    from eva_parser import parse_eva_file

    # Example
    test_file = "data/raw/IT2a-n.txt"
    try:
        lines, _ = parse_eva_file(test_file)
        comparator = CorpusComparator()

        voynich_profile = comparator.build_voynich_profile(lines)
        print(f"Voynich Profile:")
        print(f"  Tokens: {voynich_profile.total_tokens}")
        print(f"  Unique: {voynich_profile.unique_tokens}")
        print(f"  TTR: {voynich_profile.token_type_ratio:.3f}")
        print(f"  Entropy: {voynich_profile.entropy_1gram:.2f} bits")
    except Exception as e:
        print(f"Error: {e}")
