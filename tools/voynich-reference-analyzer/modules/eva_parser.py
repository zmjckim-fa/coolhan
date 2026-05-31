"""
EVA Parser Module - Parse European Voynich Alphabet Notation

Parses EVA transcriptions into structured components:
- Physical line (original transcription)
- EVA tokens (dot-separated words)
- Glyphs (individual characters)

CRITICAL: Distinguish between:
1. physical_line = 원본 전사 한 줄 (one line of original transcription)
2. EVA token = 점(.)으로 나뉜 단어 단위 (dot-separated word units)

This separation is crucial for accurate "Avg Len" analysis.
"""

import re
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

# ============================================================================
# DATA STRUCTURES
# ============================================================================

class TranscriberType(Enum):
    """Known transcribers in the Voynich Manuscript"""
    H = "H"  # Primary transcriber
    M = "M"  # Second transcriber
    A = "A"  # Annotation
    UNKNOWN = "Unknown"

@dataclass
class Glyph:
    """Single character/glyph in EVA"""
    char: str
    position: int
    in_token: bool = True

@dataclass
class Token:
    """EVA token (dot-separated word unit)"""
    text: str
    position: int
    glyphs: List[Glyph]
    contains_punctuation: bool = False

    @property
    def length(self) -> int:
        return len(self.text.replace(".", ""))

@dataclass
class PhysicalLine:
    """Physical line from original transcription"""
    folio_id: str
    paragraph: str
    line_number: int
    transcriber: str
    raw_text: str
    tokens: List[Token]

    @property
    def token_count(self) -> int:
        return len(self.tokens)

    @property
    def glyph_count(self) -> int:
        return sum(len(t.glyphs) for t in self.tokens)

    @property
    def avg_token_length(self) -> float:
        if not self.tokens:
            return 0.0
        return self.glyph_count / self.token_count

# ============================================================================
# EVA PARSER CLASS
# ============================================================================

class EVAParser:
    """
    Parse EVA (European Voynich Alphabet) notation

    Format: <folio.paragraph.line;transcriber> token.token.token...

    Example:
        <f1r.P1.1;H> fachys.ykal.ar.ataiin.shol.shory.cth!res.y.kor.sholdy
    """

    # Valid EVA characters (20 base characters + variants)
    VALID_EVA_CHARS = set('abcdefghijklmnopqrstuvy')

    # Special markers
    PUNCTUATION_MARKERS = set('!&?*#')

    # Line header pattern: <folio.paragraph.line;transcriber>
    HEADER_PATTERN = re.compile(
        r'<([a-z][\d]+[rv])\.([A-Z][\d]+)\.([0-9]+);([HMA]?)>'
    )

    def __init__(self, strict_mode: bool = False):
        """
        Initialize parser

        Args:
            strict_mode: If True, reject lines that don't match perfectly.
                        If False, attempt to parse malformed input.
        """
        self.strict_mode = strict_mode
        self.parse_errors = []

    def parse_line(self, raw_line: str) -> Optional[PhysicalLine]:
        """
        Parse a single EVA transcription line

        Args:
            raw_line: Raw EVA line (e.g., "<f1r.P1.1;H> fachys.ykal...")

        Returns:
            PhysicalLine object or None if parsing fails
        """
        raw_line = raw_line.strip()

        if not raw_line or raw_line.startswith("#"):
            return None

        # Extract header
        header_match = self.HEADER_PATTERN.match(raw_line)
        if not header_match:
            error = f"Invalid line format: {raw_line[:50]}"
            self.parse_errors.append(error)
            if self.strict_mode:
                raise ValueError(error)
            return None

        folio_id, paragraph, line_num, transcriber = header_match.groups()
        transcriber = transcriber or "Unknown"

        # Extract token text (after '>')
        token_section_start = raw_line.find('>')
        if token_section_start == -1:
            return None

        token_text = raw_line[token_section_start + 1:].strip()

        # Parse tokens (dot-separated words)
        tokens = self._parse_tokens(token_text)

        if not tokens:
            return None

        return PhysicalLine(
            folio_id=folio_id,
            paragraph=paragraph,
            line_number=int(line_num),
            transcriber=transcriber,
            raw_text=token_text,
            tokens=tokens
        )

    def _parse_tokens(self, token_text: str) -> List[Token]:
        """
        Parse dot-separated tokens into Token objects

        Args:
            token_text: Text portion after header (e.g., "fachys.ykal.ar...")

        Returns:
            List of Token objects
        """
        tokens = []
        token_strings = token_text.split('.')
        position = 0

        for token_str in token_strings:
            if not token_str:
                continue

            # Check for punctuation
            has_punctuation = any(c in token_str for c in self.PUNCTUATION_MARKERS)

            # Remove punctuation for glyph analysis
            clean_token = ''.join(
                c for c in token_str
                if c not in self.PUNCTUATION_MARKERS
            )

            if not clean_token:
                continue

            # Parse glyphs
            glyphs = self._parse_glyphs(clean_token)

            token = Token(
                text=clean_token,
                position=position,
                glyphs=glyphs,
                contains_punctuation=has_punctuation
            )

            tokens.append(token)
            position += 1

        return tokens

    def _parse_glyphs(self, token_str: str) -> List[Glyph]:
        """
        Parse individual glyphs from a token string

        Args:
            token_str: Single token (e.g., "fachys")

        Returns:
            List of Glyph objects
        """
        glyphs = []

        for pos, char in enumerate(token_str):
            glyph = Glyph(
                char=char.lower(),
                position=pos,
                in_token=True
            )
            glyphs.append(glyph)

        return glyphs

    def validate_token(self, token: Token) -> bool:
        """
        Validate that a token contains only valid EVA characters

        Args:
            token: Token to validate

        Returns:
            True if valid, False otherwise
        """
        for glyph in token.glyphs:
            if glyph.char not in self.VALID_EVA_CHARS:
                return False

        return True

    # ========================================================================
    # BATCH PARSING
    # ========================================================================

    def parse_file(self, filepath: str) -> List[PhysicalLine]:
        """
        Parse entire EVA transcription file

        Args:
            filepath: Path to EVA file

        Returns:
            List of PhysicalLine objects
        """
        lines = []

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                for line_num, raw_line in enumerate(f, 1):
                    parsed_line = self.parse_line(raw_line)
                    if parsed_line:
                        lines.append(parsed_line)
        except FileNotFoundError:
            raise FileNotFoundError(f"EVA file not found: {filepath}")
        except Exception as e:
            raise RuntimeError(f"Error parsing EVA file: {e}")

        return lines

    # ========================================================================
    # STATISTICS
    # ========================================================================

    def get_statistics(self, lines: List[PhysicalLine]) -> Dict:
        """
        Compute statistics from parsed lines

        Args:
            lines: List of PhysicalLine objects

        Returns:
            Dictionary of statistics
        """
        if not lines:
            return {}

        all_tokens = []
        all_glyphs = []

        for line in lines:
            all_tokens.extend(line.tokens)
            for token in line.tokens:
                all_glyphs.extend([g.char for g in token.glyphs])

        token_texts = [t.text for t in all_tokens]
        unique_tokens = set(token_texts)

        # Word-final character analysis
        word_final_chars = {}
        for token in all_tokens:
            if token.glyphs:
                final_char = token.glyphs[-1].char
                word_final_chars[final_char] = word_final_chars.get(final_char, 0) + 1

        return {
            "total_lines": len(lines),
            "total_tokens": len(all_tokens),
            "unique_tokens": len(unique_tokens),
            "total_glyphs": len(all_glyphs),
            "avg_token_length": sum(t.length for t in all_tokens) / len(all_tokens) if all_tokens else 0,
            "avg_line_tokens": sum(line.token_count for line in lines) / len(lines),
            "word_final_distribution": word_final_chars,
            "parsing_errors": len(self.parse_errors)
        }

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def parse_eva_file(filepath: str, strict: bool = False) -> Tuple[List[PhysicalLine], Dict]:
    """
    Convenience function to parse EVA file and get statistics

    Args:
        filepath: Path to EVA transcription file
        strict: Strict parsing mode

    Returns:
        Tuple of (parsed lines, statistics dictionary)
    """
    parser = EVAParser(strict_mode=strict)
    lines = parser.parse_file(filepath)
    stats = parser.get_statistics(lines)

    return lines, stats

if __name__ == "__main__":
    # Test example
    test_line = "<f1r.P1.1;H> fachys.ykal.ar.ataiin.shol.shory.cth!res.y.kor.sholdy"

    parser = EVAParser()
    parsed = parser.parse_line(test_line)

    if parsed:
        print(f"Folio: {parsed.folio_id}")
        print(f"Paragraph: {parsed.paragraph}")
        print(f"Line: {parsed.line_number}")
        print(f"Transcriber: {parsed.transcriber}")
        print(f"Tokens: {len(parsed.tokens)}")
        print(f"Glyphs: {parsed.glyph_count}")
        print(f"Avg Token Length: {parsed.avg_token_length:.2f}")
        print(f"\nTokens:")
        for token in parsed.tokens:
            print(f"  - {token.text} (len={token.length})")
