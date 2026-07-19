"""SQLite database connection and initialisation for txBOB."""

from __future__ import annotations

import logging
import sqlite3
from pathlib import Path

logger = logging.getLogger(__name__)

# Store the DB file at the backend root: backend/txbob.db
_DB_PATH = Path(__file__).resolve().parent.parent / "txbob.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS predictions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet          TEXT    NOT NULL DEFAULT '',
    fixture_id      INTEGER NOT NULL,
    match_name      TEXT    NOT NULL DEFAULT '',
    market_type     TEXT    NOT NULL DEFAULT '',
    market_label    TEXT    NOT NULL DEFAULT '',
    selection       TEXT    NOT NULL DEFAULT '',
    question        TEXT    NOT NULL DEFAULT '',
    odds            REAL    NOT NULL DEFAULT 0,
    amount          REAL    NOT NULL DEFAULT 0,
    status          TEXT    NOT NULL DEFAULT 'pending',
    result          TEXT    DEFAULT NULL,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    resolved_at     TEXT    DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS markets (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    fixture_id      INTEGER NOT NULL,
    market_type     TEXT    NOT NULL DEFAULT '',
    status          TEXT    NOT NULL DEFAULT 'active',
    resolved_at     TEXT    DEFAULT NULL,
    winner          TEXT    DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_predictions_wallet ON predictions(wallet);
CREATE INDEX IF NOT EXISTS idx_predictions_fixture ON predictions(fixture_id);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status);
CREATE INDEX IF NOT EXISTS idx_predictions_resolved ON predictions(resolved_at);
CREATE INDEX IF NOT EXISTS idx_markets_fixture ON markets(fixture_id);
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
"""


def get_db_path() -> Path:
    return _DB_PATH


def init_db() -> None:
    """Create tables and indexes if they don't already exist."""
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(_DB_PATH))
    try:
        conn.executescript(SCHEMA)
        conn.commit()

        # Migration: add resolved_at column if upgrading from older schema
        cols = conn.execute("PRAGMA table_info(predictions)").fetchall()
        col_names = {c[1] for c in cols}
        if "resolved_at" not in col_names:
            conn.execute("ALTER TABLE predictions ADD COLUMN resolved_at TEXT DEFAULT NULL")
            conn.commit()
            logger.info("Migration: added resolved_at column to predictions")

        logger.info("Database initialised at %s", _DB_PATH)
    finally:
        conn.close()


def get_connection() -> sqlite3.Connection:
    """Return a new SQLite connection (not shared across threads)."""
    conn = sqlite3.connect(str(_DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn
