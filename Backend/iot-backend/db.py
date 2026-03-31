"""SQLite helpers for sensor data, occupancy state, and entry logs."""

from __future__ import annotations

import sqlite3
import threading
from pathlib import Path
from typing import Any

_DB_LOCK = threading.Lock()


def get_connection(db_path: str) -> sqlite3.Connection:
    """Create a SQLite connection with row access by column name."""
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    return connection


def init_db(connection: sqlite3.Connection) -> None:
    """Create required tables if they do not exist."""
    with _DB_LOCK:
        cursor = connection.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS sensor_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                temperature REAL,
                humidity REAL,
                distance REAL,
                sound_level REAL,
                motion INTEGER,
                estimated_occupancy INTEGER,
                entry_events INTEGER,
                timestamp TEXT
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS occupancy_state (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                current_count INTEGER,
                last_state TEXT,
                last_trigger_time TEXT,
                timestamp TEXT
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS entry_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT,
                distance REAL,
                timestamp TEXT
            )
            """
        )
        connection.commit()


def insert_sensor_data(connection: sqlite3.Connection, payload: dict[str, Any]) -> None:
    """Insert one sensor_data row."""
    with _DB_LOCK:
        connection.execute(
            """
            INSERT INTO sensor_data (
                temperature,
                humidity,
                distance,
                sound_level,
                motion,
                estimated_occupancy,
                entry_events,
                timestamp
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.get("temperature"),
                payload.get("humidity"),
                payload.get("distance"),
                payload.get("sound_level"),
                payload.get("motion"),
                payload.get("estimated_occupancy"),
                payload.get("entry_events"),
                payload.get("timestamp"),
            ),
        )
        connection.commit()


def insert_occupancy_state(connection: sqlite3.Connection, payload: dict[str, Any]) -> None:
    """Insert one occupancy_state row."""
    with _DB_LOCK:
        connection.execute(
            """
            INSERT INTO occupancy_state (
                current_count,
                last_state,
                last_trigger_time,
                timestamp
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                payload.get("current_count"),
                payload.get("last_state"),
                payload.get("last_trigger_time"),
                payload.get("timestamp"),
            ),
        )
        connection.commit()


def insert_entry_log(
    connection: sqlite3.Connection,
    event_type: str,
    distance: float | None,
    timestamp: str,
) -> None:
    """Insert one entry event row."""
    with _DB_LOCK:
        connection.execute(
            """
            INSERT INTO entry_logs (event_type, distance, timestamp)
            VALUES (?, ?, ?)
            """,
            (event_type, distance, timestamp),
        )
        connection.commit()


def fetch_latest_sensor_data(connection: sqlite3.Connection) -> dict[str, Any] | None:
    """Return latest sensor_data row as dict."""
    with _DB_LOCK:
        row = connection.execute(
            "SELECT * FROM sensor_data ORDER BY id DESC LIMIT 1"
        ).fetchone()
    return dict(row) if row else None


def fetch_sensor_history(connection: sqlite3.Connection, limit: int = 20) -> list[dict[str, Any]]:
    """Return recent sensor_data rows in descending order."""
    with _DB_LOCK:
        rows = connection.execute(
            "SELECT * FROM sensor_data ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]


def fetch_latest_occupancy_state(connection: sqlite3.Connection) -> dict[str, Any] | None:
    """Return latest occupancy_state row as dict."""
    with _DB_LOCK:
        row = connection.execute(
            "SELECT * FROM occupancy_state ORDER BY id DESC LIMIT 1"
        ).fetchone()
    return dict(row) if row else None


def fetch_entry_logs(connection: sqlite3.Connection, limit: int = 20) -> list[dict[str, Any]]:
    """Return recent entry logs in descending order."""
    with _DB_LOCK:
        rows = connection.execute(
            "SELECT * FROM entry_logs ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]
