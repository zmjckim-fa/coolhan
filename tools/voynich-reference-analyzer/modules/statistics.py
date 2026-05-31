"""
Statistics Module - Compute token/character/section statistics

Calculations:
- Token frequency & distribution
- Character frequency & n-grams
- Type-Token Ratio (TTR) & variants
- Hapax ratio (once-appearing tokens)
- Section-specific metrics
- Word-final character patterns
"""

from typing import List, Dict, Tuple, Optional
from collections import Counter
from dataclasses import dataclass
import sqlite3
import math

from .eva_parser import PhysicalLine, Token

# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class TokenStatistics:
    """Token-level statistics"""
    total_tokens: int
    unique_tokens: int
    token_type_ratio: float  # TTR: unique/total
    hapax_tokens: int  # Tokens appearing exactly once
    hapax_ratio: float  # hapax/unique
    avg_token_length: float
    top_tokens: List[Tuple[str, int]]  # Top 10 tokens with counts

@dataclass
class CharacterStatistics:
    """Character-level statistics"""
    char: str
    frequency: int
    relative_frequency: float
    folio_id: Optional[str] = None
    section: Optional[str] = None

@dataclass
class SectionMetrics:
    """Metrics for a manuscript section"""
    section: str
    total_tokens: int
    unique_tokens: int
    token_type_ratio: float
    hapax_ratio: float
    avg_token_length: float
    word_final_ratio: Dict[str, float]  # y, r, l, n ratios
    total_word_final_ratio: float
    ch_frequency: float
    daiin_frequency: float
    top_10_concentration: float  # % of top 10 tokens
    vocabulary_divergence: Optional[float] = None

# ============================================================================
# STATISTICS CALCULATOR
# ============================================================================

class StatisticsCalculator:
    """Compute detailed statistics from parsed Voynich data"""

    def __init__(self, word_final_chars: List[str] = None):
        """
        Initialize calculator

        Args:
            word_final_chars: Characters to track as word-final (default: y, r, l, n)
        """
        self.word_final_chars = word_final_chars or ['y', 'r', 'l', 'n']

    # ========================================================================
    # TOKEN STATISTICS
    # ========================================================================

    def calculate_token_statistics(self, lines: List[PhysicalLine]) -> TokenStatistics:
        """
        Calculate comprehensive token statistics

        Args:
            lines: List of parsed PhysicalLine objects

        Returns:
            TokenStatistics object
        """
        all_tokens = []

        for line in lines:
            all_tokens.extend([t.text for t in line.tokens])

        if not all_tokens:
            return TokenStatistics(0, 0, 0.0, 0, 0.0, 0.0, [])

        token_counter = Counter(all_tokens)
        unique_count = len(token_counter)
        total_count = len(all_tokens)

        # Calculate hapax (once-appearing tokens)
        hapax_count = sum(1 for count in token_counter.values() if count == 1)

        # Token lengths
        avg_length = sum(len(t) for t in all_tokens) / total_count if all_tokens else 0

        # TTR and hapax ratio
        ttr = unique_count / total_count if total_count > 0 else 0
        hapax_ratio = hapax_count / unique_count if unique_count > 0 else 0

        # Top tokens
        top_tokens = token_counter.most_common(10)

        return TokenStatistics(
            total_tokens=total_count,
            unique_tokens=unique_count,
            token_type_ratio=ttr,
            hapax_tokens=hapax_count,
            hapax_ratio=hapax_ratio,
            avg_token_length=avg_length,
            top_tokens=top_tokens
        )

    # ========================================================================
    # CHARACTER STATISTICS
    # ========================================================================

    def calculate_character_frequency(self, lines: List[PhysicalLine]) -> Dict[str, int]:
        """
        Calculate character frequency

        Args:
            lines: List of parsed PhysicalLine objects

        Returns:
            Dictionary of character → count
        """
        char_counter = Counter()

        for line in lines:
            for token in line.tokens:
                for glyph in token.glyphs:
                    char_counter[glyph.char] += 1

        return dict(char_counter)

    def get_character_statistics(self, char_freq: Dict[str, int]) -> Dict:
        """
        Get relative frequencies for characters

        Args:
            char_freq: Character frequency dictionary

        Returns:
            Dictionary with absolute & relative frequencies
        """
        total = sum(char_freq.values())

        return {
            char: {
                "frequency": count,
                "relative_frequency": count / total if total > 0 else 0
            }
            for char, count in sorted(char_freq.items(), key=lambda x: x[1], reverse=True)
        }

    # ========================================================================
    # N-GRAM ANALYSIS
    # ========================================================================

    def calculate_ngram_frequency(
        self,
        lines: List[PhysicalLine],
        n: int = 2
    ) -> Dict[str, int]:
        """
        Calculate n-gram frequency

        Args:
            lines: List of parsed lines
            n: N-gram size (1, 2, 3, 4)

        Returns:
            Dictionary of n-gram → count
        """
        ngram_counter = Counter()
        all_chars = []

        # Collect all characters
        for line in lines:
            for token in line.tokens:
                for glyph in token.glyphs:
                    all_chars.append(glyph.char)

        # Generate n-grams
        for i in range(len(all_chars) - n + 1):
            ngram = ''.join(all_chars[i:i + n])
            ngram_counter[ngram] += 1

        return dict(ngram_counter)

    # ========================================================================
    # WORD-FINAL ANALYSIS
    # ========================================================================

    def analyze_word_final_patterns(
        self,
        lines: List[PhysicalLine]
    ) -> Dict[str, Dict]:
        """
        Analyze word-final character distribution

        Args:
            lines: List of parsed lines

        Returns:
            Dictionary of character → {count, percentage}
        """
        word_final_counter = Counter()
        total_tokens = 0

        for line in lines:
            for token in line.tokens:
                if token.glyphs:
                    final_char = token.glyphs[-1].char
                    if final_char in self.word_final_chars:
                        word_final_counter[final_char] += 1
                total_tokens += 1

        # Calculate percentages
        result = {}
        for char in self.word_final_chars:
            count = word_final_counter.get(char, 0)
            percentage = (count / total_tokens * 100) if total_tokens > 0 else 0
            result[char] = {
                "count": count,
                "percentage": percentage
            }

        # Total word-final ratio
        total_word_final = sum(word_final_counter.values())
        total_ratio = (total_word_final / total_tokens * 100) if total_tokens > 0 else 0
        result['total'] = {
            "count": total_word_final,
            "percentage": total_ratio
        }

        return result

    # ========================================================================
    # SECTION-LEVEL METRICS
    # ========================================================================

    def calculate_section_metrics(
        self,
        section_lines: Dict[str, List[PhysicalLine]],
        sections: List[str]
    ) -> Dict[str, SectionMetrics]:
        """
        Calculate metrics for each manuscript section

        Args:
            section_lines: Dictionary of section → lines
            sections: List of section names

        Returns:
            Dictionary of section → SectionMetrics
        """
        section_metrics = {}

        for section in sections:
            if section not in section_lines:
                continue

            lines = section_lines[section]
            token_stats = self.calculate_token_statistics(lines)
            char_freq = self.calculate_character_frequency(lines)
            word_final = self.analyze_word_final_patterns(lines)

            # Calculate top-10 concentration
            all_tokens = [t.text for line in lines for t in line.tokens]
            token_counter = Counter(all_tokens)
            top_10_tokens = sum(count for _, count in token_counter.most_common(10))
            top_10_conc = (top_10_tokens / len(all_tokens) * 100) if all_tokens else 0

            # Specific tokens
            ch_count = char_freq.get('c', 0) + char_freq.get('h', 0) - char_freq.get('ch', 0)
            ch_freq = (ch_count / sum(char_freq.values()) * 100) if char_freq else 0

            daiin_count = all_tokens.count('daiin')
            daiin_freq = (daiin_count / len(all_tokens) * 100) if all_tokens else 0

            metrics = SectionMetrics(
                section=section,
                total_tokens=token_stats.total_tokens,
                unique_tokens=token_stats.unique_tokens,
                token_type_ratio=token_stats.token_type_ratio,
                hapax_ratio=token_stats.hapax_ratio,
                avg_token_length=token_stats.avg_token_length,
                word_final_ratio={
                    char: word_final[char]['percentage']
                    for char in self.word_final_chars
                },
                total_word_final_ratio=word_final['total']['percentage'],
                ch_frequency=ch_freq,
                daiin_frequency=daiin_freq,
                top_10_concentration=top_10_conc
            )

            section_metrics[section] = metrics

        return section_metrics

    # ========================================================================
    # CORRECTED TTR (FOR FAIRNESS)
    # ========================================================================

    def calculate_corrected_ttr(
        self,
        total_tokens: int,
        unique_tokens: int
    ) -> float:
        """
        Calculate Corrected Type-Token Ratio (CTTR)

        Formula: CTTR = unique_tokens / sqrt(2 * total_tokens)

        This accounts for text length differences.

        Args:
            total_tokens: Total token count
            unique_tokens: Unique token count

        Returns:
            Corrected TTR value
        """
        if total_tokens == 0:
            return 0.0

        return unique_tokens / math.sqrt(2 * total_tokens)

    # ========================================================================
    # DATABASE STORAGE
    # ========================================================================

    def store_statistics(
        self,
        db_connection: sqlite3.Connection,
        folio_id: str,
        stats: TokenStatistics,
        char_freq: Dict[str, int],
        word_final: Dict
    ):
        """
        Store statistics in database

        Args:
            db_connection: SQLite connection
            folio_id: Folio ID
            stats: TokenStatistics object
            char_freq: Character frequency dictionary
            word_final: Word-final analysis dictionary
        """
        cursor = db_connection.cursor()

        # Store folio metrics
        cttr = self.calculate_corrected_ttr(
            stats.total_tokens,
            stats.unique_tokens
        )

        cursor.execute("""
            INSERT OR REPLACE INTO folio_metrics
            (folio_id, total_tokens, unique_tokens, token_type_ratio,
             hapax_tokens, hapax_ratio, avg_token_length,
             word_final_y_ratio, word_final_r_ratio, word_final_l_ratio,
             word_final_n_ratio, total_word_final_ratio)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            folio_id,
            stats.total_tokens,
            stats.unique_tokens,
            cttr,
            stats.hapax_tokens,
            stats.hapax_ratio,
            stats.avg_token_length,
            word_final.get('y', {}).get('percentage', 0),
            word_final.get('r', {}).get('percentage', 0),
            word_final.get('l', {}).get('percentage', 0),
            word_final.get('n', {}).get('percentage', 0),
            word_final.get('total', {}).get('percentage', 0)
        ))

        # Store character frequencies
        total_chars = sum(char_freq.values())
        for char, count in char_freq.items():
            cursor.execute("""
                INSERT OR REPLACE INTO character_frequency
                (char, frequency, relative_frequency, folio_id)
                VALUES (?, ?, ?, ?)
            """, (
                char,
                count,
                count / total_chars if total_chars > 0 else 0,
                folio_id
            ))

        db_connection.commit()

if __name__ == "__main__":
    from eva_parser import parse_eva_file

    # Example
    test_file = "data/raw/IT2a-n.txt"
    try:
        lines, _ = parse_eva_file(test_file)
        calculator = StatisticsCalculator()

        stats = calculator.calculate_token_statistics(lines)
        print(f"Total tokens: {stats.total_tokens}")
        print(f"Unique tokens: {stats.unique_tokens}")
        print(f"TTR: {stats.token_type_ratio:.3f}")
        print(f"Hapax ratio: {stats.hapax_ratio:.3f}")
        print(f"Top tokens: {stats.top_tokens[:5]}")
    except Exception as e:
        print(f"Error: {e}")
