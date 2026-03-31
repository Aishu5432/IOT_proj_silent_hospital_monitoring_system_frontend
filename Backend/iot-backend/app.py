"""Flask API server for smart hospital room monitoring."""

from __future__ import annotations

import atexit
import threading
import time
from datetime import datetime, timezone
from typing import Any

from flask import Flask, jsonify, request
from flask_cors import CORS

from config import config
from db import (
    fetch_entry_logs,
    fetch_latest_occupancy_state,
    fetch_latest_sensor_data,
    fetch_sensor_history,
    get_connection,
    init_db,
    insert_entry_log,
    insert_occupancy_state,
    insert_sensor_data,
)
from occupancy_logic import EntryOccupancyEstimator
from thingspeak_service import ThingSpeakService


def utc_now_iso() -> str:
    """Return UTC timestamp in ISO-8601 Z format."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def map_sensor_row_for_api(row: dict[str, Any] | None) -> dict[str, Any] | None:
    """Map DB row keys into stable frontend-friendly JSON keys."""
    if not row:
        return None

    return {
        "id": row.get("id"),
        "temperature": row.get("temperature"),
        "humidity": row.get("humidity"),
        "distance": row.get("distance"),
        "sound_level": row.get("sound_level"),
        "motion": bool(row.get("motion", 0)),
        "estimated_occupancy": row.get("estimated_occupancy", 0),
        "entry_events": row.get("entry_events", 0),
        "timestamp": row.get("timestamp"),
    }


class BackendRuntime:
    """Container for runtime services and background processing state."""

    def __init__(self) -> None:
        self.db_connection = get_connection(config.DATABASE_PATH)
        init_db(self.db_connection)

        self.occupancy_estimator = EntryOccupancyEstimator(
            entry_threshold=config.ENTRY_DISTANCE_THRESHOLD,
            cooldown_seconds=config.ENTRY_COOLDOWN_SECONDS,
            smoothing_window=config.DISTANCE_SMOOTHING_WINDOW,
            enable_exit_counting=config.ENABLE_EXIT_COUNTING,
        )
        self.thingspeak_service = ThingSpeakService(
            channel_id=config.THINGSPEAK_CHANNEL_ID,
            read_api_key=config.THINGSPEAK_READ_API_KEY,
            timeout_seconds=config.THINGSPEAK_TIMEOUT_SECONDS,
            demo_mode_enabled=config.DEMO_MODE_ENABLED,
        )

        self.worker_stop_event = threading.Event()
        self.worker_thread: threading.Thread | None = None

    def poll_once(self) -> dict[str, Any] | None:
        """Fetch one reading, run occupancy logic, and persist rows."""
        payload = self.thingspeak_service.fetch_latest()
        if not payload:
            print("[Worker] No payload available in this cycle.")
            return None

        # Use backend ingestion time for state transitions and dashboard freshness,
        # because ThingSpeak created_at can remain old when feed updates pause.
        timestamp = utc_now_iso()
        payload["timestamp"] = timestamp

        occupancy_update = self.occupancy_estimator.update(
            distance=payload.get("distance"),
            motion=int(payload.get("motion", 0)),
            timestamp=timestamp,
        )

        if occupancy_update.event_type in {"ENTRY", "EXIT"}:
            insert_entry_log(
                self.db_connection,
                event_type=occupancy_update.event_type,
                distance=payload.get("distance"),
                timestamp=timestamp,
            )
            print(f"[Occupancy] Event detected: {occupancy_update.event_type}")

        sensor_row = {
            "temperature": payload.get("temperature"),
            "humidity": payload.get("humidity"),
            "distance": payload.get("distance"),
            "sound_level": payload.get("sound_level"),
            "motion": int(payload.get("motion", 0)),
            "estimated_occupancy": occupancy_update.current_count,
            "entry_events": occupancy_update.event_count_total,
            "timestamp": timestamp,
        }
        insert_sensor_data(self.db_connection, sensor_row)

        occupancy_row = {
            "current_count": occupancy_update.current_count,
            "last_state": occupancy_update.last_state,
            "last_trigger_time": occupancy_update.last_trigger_time,
            "timestamp": timestamp,
        }
        insert_occupancy_state(self.db_connection, occupancy_row)

        if occupancy_update.current_count > config.CROWD_ALERT_THRESHOLD:
            print(
                "[Occupancy] Crowd Alert: estimated people count = "
                f"{occupancy_update.current_count}"
            )

        return {
            "sensor": sensor_row,
            "occupancy": occupancy_row,
            "event_type": occupancy_update.event_type,
            "source": payload.get("source", "thingspeak"),
        }

    def worker_loop(self) -> None:
        """Continuously poll ThingSpeak and persist data."""
        print("[Worker] Background polling started.")
        while not self.worker_stop_event.is_set():
            started_at = time.time()
            try:
                self.poll_once()
            except Exception as exc:  # pylint: disable=broad-except
                print(f"[Worker] Unexpected worker error: {exc}")

            elapsed = time.time() - started_at
            sleep_for = max(config.FETCH_INTERVAL_SECONDS - elapsed, 0.1)
            self.worker_stop_event.wait(timeout=sleep_for)
        print("[Worker] Background polling stopped.")

    def start_worker(self) -> None:
        """Start polling worker thread once."""
        if self.worker_thread and self.worker_thread.is_alive():
            return

        self.worker_stop_event.clear()
        self.worker_thread = threading.Thread(target=self.worker_loop, daemon=True)
        self.worker_thread.start()

    def stop_worker(self) -> None:
        """Stop polling worker thread."""
        self.worker_stop_event.set()
        if self.worker_thread:
            self.worker_thread.join(timeout=2)


runtime = BackendRuntime()
app = Flask(__name__)
CORS(app)


@app.route("/api/health", methods=["GET"])
def health() -> Any:
    """Health endpoint for backend status checks."""
    return jsonify({"status": "ok", "timestamp": utc_now_iso()})


@app.route("/api/latest", methods=["GET"])
def latest() -> Any:
    """Return latest sensor data plus occupancy info."""
    latest_sensor = map_sensor_row_for_api(fetch_latest_sensor_data(runtime.db_connection))
    latest_occupancy = fetch_latest_occupancy_state(runtime.db_connection)
    last_logs = fetch_entry_logs(runtime.db_connection, limit=1)

    if not latest_sensor:
        return jsonify(
            {
                "status": "empty",
                "message": "No sensor data available yet.",
                "data": None,
            }
        )

    response = {
        "temperature": latest_sensor["temperature"],
        "humidity": latest_sensor["humidity"],
        "distance": latest_sensor["distance"],
        "sound_level": latest_sensor["sound_level"],
        "motion": latest_sensor["motion"],
        "estimated_occupancy": latest_sensor["estimated_occupancy"],
        "current_count": (
            latest_occupancy.get("current_count")
            if latest_occupancy
            else latest_sensor["estimated_occupancy"]
        ),
        "last_event": last_logs[0].get("event_type") if last_logs else None,
        "timestamp": latest_sensor["timestamp"],
        "source": "backend",
    }
    return jsonify({"status": "ok", "data": response})


@app.route("/api/history", methods=["GET"])
def history() -> Any:
    """Return recent sensor history."""
    requested_limit = request.args.get("limit", default="50")
    try:
        limit = int(requested_limit)
    except ValueError:
        limit = 50
    limit = max(1, min(limit, 200))

    rows = fetch_sensor_history(runtime.db_connection, limit=limit)
    mapped = [map_sensor_row_for_api(row) for row in rows]

    return jsonify({
        "status": "ok",
        "count": len(mapped),
        "data": mapped,
    })


@app.route("/api/occupancy", methods=["GET"])
def occupancy() -> Any:
    """Return latest occupancy state."""
    state = fetch_latest_occupancy_state(runtime.db_connection)
    if not state:
        state = {
            "current_count": runtime.occupancy_estimator.current_count,
            "last_state": runtime.occupancy_estimator.last_state,
            "last_trigger_time": None,
            "timestamp": utc_now_iso(),
        }

    return jsonify({"status": "ok", "data": state})


@app.route("/api/entry-logs", methods=["GET"])
def entry_logs() -> Any:
    """Return recent occupancy entry/exit logs."""
    requested_limit = request.args.get("limit", default="20")
    try:
        limit = int(requested_limit)
    except ValueError:
        limit = 20
    limit = max(1, min(limit, 200))

    logs = fetch_entry_logs(runtime.db_connection, limit=limit)
    return jsonify({"status": "ok", "count": len(logs), "data": logs})


@app.route("/api/reset", methods=["POST"])
def reset_occupancy() -> Any:
    """Reset estimated occupancy to zero and log reset event."""
    timestamp = utc_now_iso()
    reset_state = runtime.occupancy_estimator.reset(timestamp=timestamp)

    insert_entry_log(
        runtime.db_connection,
        event_type="RESET",
        distance=None,
        timestamp=timestamp,
    )
    insert_occupancy_state(
        runtime.db_connection,
        {
            "current_count": reset_state.current_count,
            "last_state": reset_state.last_state,
            "last_trigger_time": reset_state.last_trigger_time,
            "timestamp": timestamp,
        },
    )

    return jsonify(
        {
            "status": "ok",
            "message": "Estimated occupancy reset to zero.",
            "data": {
                "current_count": reset_state.current_count,
                "last_state": reset_state.last_state,
                "last_trigger_time": reset_state.last_trigger_time,
                "timestamp": timestamp,
            },
        }
    )


@app.route("/api/config", methods=["GET"])
def config_endpoint() -> Any:
    """Return current runtime configuration for occupancy and polling."""
    return jsonify(
        {
            "status": "ok",
            "data": {
                "fetch_interval_seconds": config.FETCH_INTERVAL_SECONDS,
                "entry_distance_threshold": config.ENTRY_DISTANCE_THRESHOLD,
                "entry_clear_distance_threshold": config.ENTRY_CLEAR_DISTANCE_THRESHOLD,
                "entry_cooldown_seconds": config.ENTRY_COOLDOWN_SECONDS,
                "distance_smoothing_window": config.DISTANCE_SMOOTHING_WINDOW,
                "enable_exit_counting": config.ENABLE_EXIT_COUNTING,
                "crossing_max_seconds": config.CROSSING_MAX_SECONDS,
                "crowd_alert_threshold": config.CROWD_ALERT_THRESHOLD,
                "demo_mode_enabled": config.DEMO_MODE_ENABLED,
                "database_path": config.DATABASE_PATH,
            },
        }
    )


def _cleanup() -> None:
    runtime.stop_worker()


atexit.register(_cleanup)
runtime.start_worker()


if __name__ == "__main__":
    app.run(host=config.FLASK_HOST, port=config.FLASK_PORT, debug=False)
