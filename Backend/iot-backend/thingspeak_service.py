"""ThingSpeak fetch and sensor normalization helpers."""

from __future__ import annotations

import random
from datetime import datetime, timezone
from typing import Any

import requests


def utc_now_iso() -> str:
    """Return UTC timestamp in ISO-8601 Z format."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _to_float_or_none(value: Any) -> float | None:
    if value in (None, "", "null"):
        return None
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed


def _to_motion_int(value: Any) -> int:
    if value in (True, 1, "1", "true", "on"):
        return 1
    return 0


def normalize_sensor_payload(feed: dict[str, Any]) -> dict[str, Any]:
    """Map ThingSpeak fields to normalized sensor keys."""
    return {
        "temperature": _to_float_or_none(feed.get("field1")),
        "humidity": _to_float_or_none(feed.get("field2")),
        "distance": _to_float_or_none(feed.get("field3")),
        "sound_level": _to_float_or_none(feed.get("field4")),
        "motion": _to_motion_int(feed.get("field5")),
        "timestamp": feed.get("created_at") or utc_now_iso(),
    }


def validate_and_normalize_sensor_values(payload: dict[str, Any]) -> dict[str, Any]:
    """Constrain values to practical ranges to avoid noisy spikes."""
    normalized = dict(payload)

    def clamp(value: float | None, min_value: float, max_value: float) -> float | None:
        if value is None:
            return None
        return max(min(value, max_value), min_value)

    normalized["temperature"] = clamp(normalized.get("temperature"), -20.0, 80.0)
    normalized["humidity"] = clamp(normalized.get("humidity"), 0.0, 100.0)
    normalized["distance"] = clamp(normalized.get("distance"), 0.0, 800.0)
    normalized["sound_level"] = clamp(normalized.get("sound_level"), 0.0, 130.0)
    normalized["motion"] = 1 if normalized.get("motion") else 0

    return normalized


class ThingSpeakService:
    """Fetch latest feed from ThingSpeak with safe error handling."""

    def __init__(
        self,
        channel_id: str,
        read_api_key: str,
        timeout_seconds: int,
        demo_mode_enabled: bool,
    ) -> None:
        self.channel_id = channel_id
        self.read_api_key = read_api_key
        self.timeout_seconds = timeout_seconds
        self.demo_mode_enabled = demo_mode_enabled

    def _build_url(self) -> str:
        return (
            "https://api.thingspeak.com/channels/"
            f"{self.channel_id}/feeds.json?api_key={self.read_api_key}&results=1"
        )

    def _demo_payload(self) -> dict[str, Any]:
        """Return synthetic data so frontend testing can continue offline."""
        return {
            "temperature": round(random.uniform(23.0, 30.0), 2),
            "humidity": round(random.uniform(45.0, 78.0), 2),
            "distance": round(random.uniform(35.0, 120.0), 2),
            "sound_level": round(random.uniform(28.0, 72.0), 2),
            "motion": random.choice([0, 1]),
            "timestamp": utc_now_iso(),
            "source": "demo",
        }

    def fetch_latest(self) -> dict[str, Any] | None:
        """Fetch latest ThingSpeak feed and normalize fields.

        Returns None when data cannot be fetched and demo mode is disabled.
        """
        if not self.channel_id or not self.read_api_key:
            print("[ThingSpeak] Missing channel or API key.")
            if self.demo_mode_enabled:
                return self._demo_payload()
            return None

        try:
            response = requests.get(self._build_url(), timeout=self.timeout_seconds)
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as exc:
            print(f"[ThingSpeak] Network error: {exc}")
            if self.demo_mode_enabled:
                return self._demo_payload()
            return None
        except ValueError as exc:
            print(f"[ThingSpeak] JSON parse error: {exc}")
            if self.demo_mode_enabled:
                return self._demo_payload()
            return None

        feeds = data.get("feeds") if isinstance(data, dict) else None
        if not isinstance(feeds, list) or not feeds:
            print("[ThingSpeak] Empty feeds payload.")
            if self.demo_mode_enabled:
                return self._demo_payload()
            return None

        latest = feeds[-1]
        normalized = normalize_sensor_payload(latest)
        normalized = validate_and_normalize_sensor_values(normalized)
        normalized["source"] = "thingspeak"
        return normalized
