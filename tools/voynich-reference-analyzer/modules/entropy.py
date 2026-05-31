"""
Entropy Analysis Module - Calculate information entropy and regularity

Entropy measures the disorder/regularity of a text:
- Higher entropy = more random, less structured
- Lower entropy = more regular, more structured

Measurements:
- Shannon entropy (1-gram, 2-gram)
- Conditional entropy (what comes after X?)
- Redundancy (predictability)
- Randomness score
"""

from typing import List, Dict, Tuple
from collections import Counter
import math
from dataclasses import dataclass

from .eva_parser import PhysicalLine

# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class EntropyMetrics:
    """Entropy analysis results"""
    entropy_1gram: float  # Single character entropy
    entropy_2gram: float  # Two-character sequence entropy
    conditional_entropy: float  # H(X|Y) - uncertainty of X given Y
    redundancy: float  # 1 - (H / H_max) - how predictable is text?
    randomness_score: float  # 0-1, where 1 = completely random
    max_entropy: float  # Maximum possible entropy

# ============================================================================
# ENTROPY CALCULATOR
# ============================================================================

class EntropyCalculator:
    """Calculate Shannon entropy and related measures"""

    @staticmethod
    def calculate_probability_distribution(items: List[str]) -> Dict[str, float]:
        """
        Calculate probability distribution from items

        Args:
            items: List of items (characters, tokens, n-grams)

        Returns:
            Dictionary of item → probability
        """
        if not items:
            return {}

        total = len(items)
        counter = Counter(items)

        return {item: count / total for item, count in counter.items()}

    @staticmethod
    def shannon_entropy(items: List[str]) -> float:
        """
        Calculate Shannon entropy H(X) = -Σ p(x) * log2(p(x))

        Args:
            items: List of items

        Returns:
            Entropy value in bits
        """
        if not items or len(items) < 2:
            return 0.0

        probabilities = EntropyCalculator.calculate_probability_distribution(items)

        entropy = 0.0
        for prob in probabilities.values():
            if prob > 0:
                entropy -= prob * math.log2(prob)

        return entropy

    @staticmethod
    def max_entropy(n_unique: int) -> float:
        """
        Calculate maximum possible entropy

        Max entropy = log2(n), where n is number of unique items

        Args:
            n_unique: Number of unique items

        Returns:
            Maximum entropy in bits
        """
        if n_unique <= 1:
            return 0.0

        return math.log2(n_unique)

    @staticmethod
    def calculate_ngrams(text: str, n: int) -> List[str]:
        """
        Generate n-grams from text

        Args:
            text: Input text (concatenated glyphs)
            n: N-gram size

        Returns:
            List of n-grams
        """
        ngrams = []

        for i in range(len(text) - n + 1):
            ngrams.append(text[i:i + n])

        return ngrams

    # ========================================================================
    # ENTROPY ANALYSIS
    # ========================================================================

    def analyze_entropy(self, lines: List[PhysicalLine]) -> EntropyMetrics:
        """
        Comprehensive entropy analysis

        Args:
            lines: List of parsed lines

        Returns:
            EntropyMetrics object
        """
        # Collect all glyphs in sequence
        all_chars = []

        for line in lines:
            for token in line.tokens:
                for glyph in token.glyphs:
                    all_chars.append(glyph.char)

        if len(all_chars) < 2:
            return EntropyMetrics(0.0, 0.0, 0.0, 0.0, 0.0, 0.0)

        # 1-gram entropy
        entropy_1gram = self.shannon_entropy(all_chars)

        # 2-gram entropy
        bigrams = self.calculate_ngrams(''.join(all_chars), 2)
        entropy_2gram = self.shannon_entropy(bigrams)

        # Conditional entropy H(X|Y) - entropy of next character given previous
        conditional = self._calculate_conditional_entropy(all_chars)

        # Maximum possible entropy
        unique_chars = len(set(all_chars))
        max_ent = self.max_entropy(unique_chars)

        # Redundancy: how much lower is actual entropy than maximum?
        redundancy = 1.0 - (entropy_1gram / max_ent) if max_ent > 0 else 0.0

        # Randomness score (inverse of redundancy)
        randomness = 1.0 - redundancy

        return EntropyMetrics(
            entropy_1gram=entropy_1gram,
            entropy_2gram=entropy_2gram,
            conditional_entropy=conditional,
            redundancy=redundancy,
            randomness_score=randomness,
            max_entropy=max_ent
        )

    def _calculate_conditional_entropy(self, chars: List[str]) -> float:
        """
        Calculate conditional entropy H(X|Y)

        This measures: given character Y, how uncertain is the next character X?

        Args:
            chars: List of characters in sequence

        Returns:
            Conditional entropy value
        """
        if len(chars) < 2:
            return 0.0

        # Build conditional probability table: P(next | current)
        transitions = {}  # {current_char: {next_char: count}}

        for i in range(len(chars) - 1):
            current = chars[i]
            next_char = chars[i + 1]

            if current not in transitions:
                transitions[current] = Counter()

            transitions[current][next_char] += 1

        # Calculate H(X|Y) = Σ p(y) * H(X|Y=y)
        conditional_entropy = 0.0
        total_pairs = len(chars) - 1

        for current, next_chars in transitions.items():
            # Probability of this character appearing
            p_current = sum(next_chars.values()) / total_pairs

            # Entropy of next characters given current
            total_next = sum(next_chars.values())
            h_x_given_y = 0.0

            for count in next_chars.values():
                p_next = count / total_next
                if p_next > 0:
                    h_x_given_y -= p_next * math.log2(p_next)

            conditional_entropy += p_current * h_x_given_y

        return conditional_entropy

    # ========================================================================
    # COMPARISON ANALYSIS
    # ========================================================================

    def compare_entropy(
        self,
        voynich_metrics: EntropyMetrics,
        comparison_metrics: Dict[str, EntropyMetrics]
    ) -> Dict[str, Dict]:
        """
        Compare Voynich entropy with other texts

        Args:
            voynich_metrics: EntropyMetrics for Voynich
            comparison_metrics: Dict of name → EntropyMetrics for comparison texts

        Returns:
            Comparison results with distances
        """
        results = {}

        metrics_to_compare = [
            ('entropy_1gram', 'H(1-gram)'),
            ('entropy_2gram', 'H(2-gram)'),
            ('conditional_entropy', 'H(X|Y)'),
            ('redundancy', 'Redundancy'),
            ('randomness_score', 'Randomness')
        ]

        for metric_name, metric_label in metrics_to_compare:
            voynich_value = getattr(voynich_metrics, metric_name)
            comparison_results = {}

            for corpus_name, metrics in comparison_metrics.items():
                corpus_value = getattr(metrics, metric_name)

                # Calculate distance (absolute difference)
                distance = abs(voynich_value - corpus_value)

                # Similarity score (0-1, where 1 = identical)
                max_possible = max(voynich_value, corpus_value) if max(voynich_value, corpus_value) > 0 else 1
                similarity = 1.0 - (distance / max_possible)

                comparison_results[corpus_name] = {
                    'voynich_value': voynich_value,
                    'corpus_value': corpus_value,
                    'distance': distance,
                    'similarity': similarity
                }

            results[metric_label] = comparison_results

        return results

    # ========================================================================
    # INTERPRETATION
    # ========================================================================

    @staticmethod
    def interpret_entropy(metrics: EntropyMetrics) -> Dict[str, str]:
        """
        Interpret entropy metrics in linguistic terms

        Args:
            metrics: EntropyMetrics object

        Returns:
            Dictionary of interpretations
        """
        interpretations = {}

        # 1-gram entropy interpretation
        if metrics.entropy_1gram < 3.0:
            interpretations['1gram'] = "Very constrained (low diversity)"
        elif metrics.entropy_1gram < 4.5:
            interpretations['1gram'] = "Moderately constrained (structured)"
        elif metrics.entropy_1gram < 6.0:
            interpretations['1gram'] = "Moderate structure"
        else:
            interpretations['1gram'] = "High entropy (less structured)"

        # Redundancy interpretation
        if metrics.redundancy > 0.8:
            interpretations['redundancy'] = "Very predictable (high redundancy)"
        elif metrics.redundancy > 0.6:
            interpretations['redundancy'] = "Predictable (formal structure)"
        elif metrics.redundancy > 0.4:
            interpretations['redundancy'] = "Moderate redundancy"
        else:
            interpretations['redundancy'] = "Low redundancy (less predictable)"

        # Randomness interpretation
        if metrics.randomness_score < 0.2:
            interpretations['randomness'] = "Highly structured"
        elif metrics.randomness_score < 0.4:
            interpretations['randomness'] = "Mostly structured"
        elif metrics.randomness_score < 0.6:
            interpretations['randomness'] = "Moderately random"
        else:
            interpretations['randomness'] = "Largely random"

        # Comparison to natural language
        # Natural English: H ≈ 4.5 bits (1-gram), H ≈ 10.5 bits (2-gram)
        if 4.0 < metrics.entropy_1gram < 5.5 and metrics.redundancy > 0.5:
            interpretations['language_type'] = "Consistent with natural language patterns"
        elif metrics.entropy_1gram < 3.5:
            interpretations['language_type'] = "More constrained than natural language (structured system)"
        elif metrics.entropy_1gram > 6.0:
            interpretations['language_type'] = "More random than natural language (less structured)"
        else:
            interpretations['language_type'] = "Intermediate entropy (mixed characteristics)"

        return interpretations

    # ========================================================================
    # STATISTICS FOR DIFFERENT TEXTS
    # ========================================================================

    @staticmethod
    def expected_entropy_ranges() -> Dict[str, Dict[str, float]]:
        """
        Expected entropy ranges for different text types

        Returns:
            Dictionary of text type → {entropy_1gram, entropy_2gram}
        """
        return {
            'natural_english': {
                'entropy_1gram': 4.5,
                'entropy_2gram': 10.5,
                'redundancy': 0.75
            },
            'random_text': {
                'entropy_1gram': 4.7,
                'entropy_2gram': 9.4,
                'redundancy': 0.0
            },
            'catalog_taxonomy': {
                'entropy_1gram': 3.8,
                'entropy_2gram': 7.8,
                'redundancy': 0.85
            },
            'cipher_code': {
                'entropy_1gram': 3.5,
                'entropy_2gram': 7.2,
                'redundancy': 0.88
            }
        }

if __name__ == "__main__":
    from eva_parser import parse_eva_file

    # Example
    test_file = "data/raw/IT2a-n.txt"
    try:
        lines, _ = parse_eva_file(test_file)
        calculator = EntropyCalculator()

        metrics = calculator.analyze_entropy(lines)
        print(f"1-gram entropy: {metrics.entropy_1gram:.2f} bits")
        print(f"2-gram entropy: {metrics.entropy_2gram:.2f} bits")
        print(f"Conditional entropy: {metrics.conditional_entropy:.2f} bits")
        print(f"Redundancy: {metrics.redundancy:.1%}")
        print(f"Randomness: {metrics.randomness_score:.1%}")

        interpretations = EntropyCalculator.interpret_entropy(metrics)
        for key, value in interpretations.items():
            print(f"{key}: {value}")
    except Exception as e:
        print(f"Error: {e}")
