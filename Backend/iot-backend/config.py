"""Application configuration for the IoT backend."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent / ".env")


def _to_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Config:
    """Runtime settings loaded from environment variables."""

    THINGSPEAK_CHANNEL_ID: str = os.getenv("THINGSPEAK_CHANNEL_ID", "")
    THINGSPEAK_READ_API_KEY: str = os.getenv("THINGSPEAK_READ_API_KEY", "")
    FETCH_INTERVAL_SECONDS: int = int(os.getenv("FETCH_INTERVAL_SECONDS", "15"))
    ENTRY_DISTANCE_THRESHOLD: float = float(os.getenv("ENTRY_DISTANCE_THRESHOLD", "50.0"))
    ENTRY_COOLDOWN_SECONDS: float = float(os.getenv("ENTRY_COOLDOWN_SECONDS", "3"))
    DISTANCE_SMOOTHING_WINDOW: int = int(os.getenv("DISTANCE_SMOOTHING_WINDOW", "5"))
    ENABLE_EXIT_COUNTING: bool = _to_bool(os.getenv("ENABLE_EXIT_COUNTING"), default=False)
    DATABASE_PATH: str = os.getenv(
        "DATABASE_PATH",
        str(Path(__file__).resolve().parent / "data" / "iot.db"),
    )
    FLASK_HOST: str = os.getenv("FLASK_HOST", "0.0.0.0")
    FLASK_PORT: int = int(os.getenv("FLASK_PORT", "5000"))

    # Optional resilience and behavior toggles.
    THINGSPEAK_TIMEOUT_SECONDS: int = int(os.getenv("THINGSPEAK_TIMEOUT_SECONDS", "10"))
    DEMO_MODE_ENABLED: bool = _to_bool(os.getenv("DEMO_MODE_ENABLED"), default=True)
    ENTRY_CLEAR_DISTANCE_THRESHOLD: float = float(
        os.getenv("ENTRY_CLEAR_DISTANCE_THRESHOLD", "55.0")
    )
    CROSSING_MAX_SECONDS: float = float(os.getenv("CROSSING_MAX_SECONDS", "4.0"))
    CROWD_ALERT_THRESHOLD: int = int(os.getenv("CROWD_ALERT_THRESHOLD", "3"))


config = Config()
