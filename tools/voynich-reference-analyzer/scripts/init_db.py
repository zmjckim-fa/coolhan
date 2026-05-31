"""
Database Initialization Script - Voynich Reference Analyzer v0.3

Creates SQLite database from schema.sql (v0.2) and schema_v03.sql (v0.3).

Usage:
    python scripts/init_db.py
    python scripts/init_db.py --reset    # Drop and recreate all tables
"""

import sqlite3
import sys
import argparse
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
DATABASE_DIR = PROJECT_ROOT / "database"
DB_PATH = DATABASE_DIR / "voynich.sqlite"
SCHEMA_V02 = DATABASE_DIR / "schema.sql"
SCHEMA_V03 = DATABASE_DIR / "schema_v03.sql"


def init_database(reset: bool = False):
    """Initialize the database from both schema files."""
    DATABASE_DIR.mkdir(exist_ok=True, parents=True)

    if reset and DB_PATH.exists():
        DB_PATH.unlink()
        print(f"[init_db] Removed existing database: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")

    # Load v0.2 schema
    if SCHEMA_V02.exists():
        sql = SCHEMA_V02.read_text(encoding="utf-8")
        # Make CREATE INDEX statements idempotent
        sql = sql.replace("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS ")
        sql = sql.replace("CREATE UNIQUE INDEX ", "CREATE UNIQUE INDEX IF NOT EXISTS ")
        try:
            conn.executescript(sql)
            print(f"[init_db] Schema v0.2 applied: {SCHEMA_V02.name}")
        except sqlite3.OperationalError as e:
            print(f"[init_db] Schema v0.2 warning (already exists): {e}")
    else:
        print(f"[init_db] WARNING: {SCHEMA_V02} not found")

    # Load v0.3 schema
    if SCHEMA_V03.exists():
        sql = SCHEMA_V03.read_text(encoding="utf-8")
        sql = sql.replace("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS ")
        sql = sql.replace("CREATE UNIQUE INDEX ", "CREATE UNIQUE INDEX IF NOT EXISTS ")
        try:
            conn.executescript(sql)
            print(f"[init_db] Schema v0.3 applied: {SCHEMA_V03.name}")
        except sqlite3.OperationalError as e:
            print(f"[init_db] Schema v0.3 warning (already exists): {e}")
    else:
        print(f"[init_db] WARNING: {SCHEMA_V03} not found")

    conn.commit()

    # Verify
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [r[0] for r in cursor.fetchall()]
    print(f"\n[init_db] Database ready: {DB_PATH}")
    print(f"[init_db] Tables created: {len(tables)}")
    for t in tables:
        print(f"  - {t}")

    conn.close()
    return DB_PATH


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize Voynich Analyzer database")
    parser.add_argument("--reset", action="store_true", help="Drop and recreate all tables")
    args = parser.parse_args()
    init_database(reset=args.reset)
    print("\n[init_db] Done.")
