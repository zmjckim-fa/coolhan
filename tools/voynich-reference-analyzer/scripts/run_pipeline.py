"""
Full Analysis Pipeline - Voynich Reference Analyzer v0.3

Orchestrates the complete analysis workflow:
1. Initialize database (if needed)
2. Parse EVA transcription file
3. Compute token/character/section statistics
4. Generate rule candidates
5. Calculate entropy metrics
6. Compare with reference corpora
7. Generate analysis run record
8. Export reports

Usage:
    python scripts/run_pipeline.py
    python scripts/run_pipeline.py --eva-file data/raw/IT2a-n.txt
    python scripts/run_pipeline.py --demo    # Use demo seed data
"""

import sqlite3
import sys
import argparse
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

DB_PATH = PROJECT_ROOT / "database" / "voynich.sqlite"


def check_db():
    if not DB_PATH.exists():
        print("[pipeline] Database not found. Initializing...")
        from scripts.init_db import init_database
        init_database()


def run_full_pipeline(eva_file: Path = None, demo: bool = False):
    """Run the complete analysis pipeline."""
    print("=" * 70)
    print("Voynich Reference Analyzer v0.3 - Analysis Pipeline")
    print("=" * 70)

    # Step 0: Ensure database exists
    check_db()
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys=ON")

    # Step 1: Create analysis run record
    run_id = f"RUN-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    data_version = "demo-v0.3" if demo else "0.3"
    triggered_by = "demo" if demo else "manual"

    conn.execute("""
        INSERT OR IGNORE INTO analysis_runs
        (run_id, run_date, data_version, triggered_by, status)
        VALUES (?, ?, ?, ?, 'running')
    """, (run_id, datetime.now().isoformat(), data_version, triggered_by))
    conn.commit()
    print(f"\n[pipeline] Run ID: {run_id}")

    # Step 2: Load demo seed or parse EVA
    if demo:
        print("\n[pipeline] Step 2: Loading demo seed data...")
        from scripts.demo_seed import run_seed
        run_seed()
    elif eva_file and Path(eva_file).exists():
        print(f"\n[pipeline] Step 2: Parsing EVA file: {eva_file}")
        _parse_eva_file(conn, eva_file)
    else:
        # Check if data already exists
        count = conn.execute("SELECT COUNT(*) FROM token").fetchone()[0]
        if count == 0:
            print("\n[pipeline] No EVA data found. Running demo seed...")
            from scripts.demo_seed import run_seed
            run_seed()
        else:
            print(f"\n[pipeline] Step 2: Using existing data ({count} tokens)")

    # Step 3: Compute statistics
    print("\n[pipeline] Step 3: Computing statistics...")
    token_count = conn.execute("SELECT COUNT(*) FROM token").fetchone()[0]
    folio_count = conn.execute("SELECT COUNT(*) FROM folio").fetchone()[0]
    rule_count = conn.execute("SELECT COUNT(*) FROM rule_candidate").fetchone()[0]
    print(f"  Folios: {folio_count}")
    print(f"  Tokens: {token_count}")
    print(f"  Rules:  {rule_count}")

    # Step 4: Update run record
    conn.execute("""
        UPDATE analysis_runs
        SET status='complete', folio_count=?, token_count=?, rule_count=?, notes=?
        WHERE run_id=?
    """, (folio_count, token_count, rule_count,
          f"Pipeline complete. Demo={demo}", run_id))
    conn.commit()

    # Step 5: Print summary
    print("\n[pipeline] Step 5: Analysis Summary")
    print("-" * 40)
    sections = conn.execute(
        "SELECT section, total_tokens FROM section_metrics ORDER BY total_tokens DESC"
    ).fetchall()
    if sections:
        for section, total in sections:
            print(f"  {section}: {total} tokens")

    top_rules = conn.execute("""
        SELECT rule_name, confidence, validation_status
        FROM rule_candidate
        WHERE validation_status IN ('validated', 'partially_validated')
        ORDER BY confidence DESC LIMIT 5
    """).fetchall()
    if top_rules:
        print("\n  Top Validated Rules:")
        for name, conf, status in top_rules:
            print(f"    [{status[:8]}] {name[:50]} ({conf:.1%})")

    conn.close()

    print("\n" + "=" * 70)
    print(f"[pipeline] COMPLETE -- Run ID: {run_id}")
    print(f"[pipeline] Launch dashboard: streamlit run app.py")
    print("=" * 70)
    return run_id


def _parse_eva_file(conn, eva_file: Path):
    """Parse a real EVA transcription file into the database."""
    from modules.eva_parser import EVAParser
    parser = EVAParser()
    lines, stats = parser.parse_file(str(eva_file))

    if not lines:
        print(f"  [pipeline] WARNING: No lines parsed from {eva_file}")
        return

    # Insert folios discovered in the file
    folio_ids = set(line.folio_id for line in lines)
    for folio_id in folio_ids:
        conn.execute("""
            INSERT OR IGNORE INTO folio (folio_id, section, currier_version)
            VALUES (?, 'unknown', 'unknown')
        """, (folio_id,))

    # Insert lines, tokens, glyphs
    token_total = 0
    for line in lines:
        cursor = conn.execute("""
            INSERT OR IGNORE INTO physical_line
            (folio_id, paragraph, line_number, transcriber, raw_text)
            VALUES (?, ?, ?, ?, ?)
        """, (line.folio_id, line.paragraph, line.line_number,
              line.transcriber, line.raw_text))
        line_id = cursor.lastrowid
        if line_id:
            for pos, tok in enumerate(line.tokens):
                tc = conn.execute("""
                    INSERT OR IGNORE INTO token
                    (physical_line_id, token_text, token_position, token_length, contains_punctuation)
                    VALUES (?, ?, ?, ?, ?)
                """, (line_id, tok.text, pos, len(tok.text), tok.contains_punctuation))
                tok_id = tc.lastrowid
                if tok_id:
                    for g_pos, glyph in enumerate(tok.glyphs):
                        conn.execute("""
                            INSERT OR IGNORE INTO glyph (token_id, glyph_char, glyph_position)
                            VALUES (?, ?, ?)
                        """, (tok_id, glyph.char, g_pos))
                    token_total += 1

    conn.commit()
    print(f"  [pipeline] Parsed: {len(lines)} lines, {token_total} tokens")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Voynich analysis pipeline")
    parser.add_argument("--eva-file", help="Path to EVA transcription file")
    parser.add_argument("--demo", action="store_true", help="Use demo seed data")
    args = parser.parse_args()
    run_full_pipeline(
        eva_file=Path(args.eva_file) if args.eva_file else None,
        demo=args.demo
    )
