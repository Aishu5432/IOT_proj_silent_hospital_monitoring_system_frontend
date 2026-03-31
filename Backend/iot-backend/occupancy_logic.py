"""Entry-based occupancy estimation using ultrasonic distance transitions."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from statistics import mean
from typing import Iterable


STATE_CLEAR = "CLEAR"
STATE_OCCUPIED = "OCCUPIED"


@dataclass
class OccupancyUpdate:
    """Computed occupancy update from one distance sample."""

    current_count: int
    last_state: str
    last_trigger_time: str | None
    event_type: str | None
    event_count_total: int
    smoothed_distance: float | None
    previous_distance: float | None
    triggered: bool


class EntryOccupancyEstimator:
    """Estimate occupancy by detecting CLEAR->OCCUPIED transitions.

    This is entry-based occupancy estimation, not exact person counting.
    """

    def __init__(
        self,
        entry_threshold: float,
        cooldown_seconds: float,
        smoothing_window: int = 5,
        enable_exit_counting: bool = False,
    ) -> None:
        self.entry_threshold = entry_threshold
        self.cooldown_seconds = cooldown_seconds
        self.smoothing_window = max(1, smoothing_window)
        self.enable_exit_counting = enable_exit_counting

        self.current_count = 0
        self.last_state = STATE_CLEAR
        self.last_trigger_time: datetime | None = None
        self.event_count_total = 0
        self.triggered = False

        self._distance_window: deque[float] = deque(maxlen=self.smoothing_window)
        self._previous_smoothed_distance: float | None = None

    def _parse_timestamp(self, timestamp: str) -> datetime:
        if timestamp.endswith("Z"):
            timestamp = timestamp.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(timestamp)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed

    def _in_cooldown(self, now_ts: datetime) -> bool:
        if self.last_trigger_time is None:
            return False
        delta = (now_ts - self.last_trigger_time).total_seconds()
        return delta < self.cooldown_seconds

    def _classify_state(self, smoothed_distance: float) -> str:
        below_count = sum(1 for value in self._distance_window if value <= self.entry_threshold)
        below_ratio = below_count / len(self._distance_window) if self._distance_window else 0.0

        # Primary classifier uses smoothed average.
        # Secondary guard allows stable occupancy detection when a person crosses quickly
        # and historical high values still dominate the average window.
        occupied = (smoothed_distance <= self.entry_threshold) or (below_ratio >= 0.6)
        return STATE_OCCUPIED if occupied else STATE_CLEAR

    def _record_distance(self, distance: float | None) -> float | None:
        if distance is None:
            return mean(self._distance_window) if self._distance_window else None
        self._distance_window.append(distance)
        return mean(self._distance_window)

    def update(self, distance: float | None, motion: int, timestamp: str) -> OccupancyUpdate:
        """Apply one sample and produce a stable occupancy estimate."""
        now_ts = self._parse_timestamp(timestamp)
        event_type: str | None = None

        previous_distance = self._previous_smoothed_distance
        smoothed_distance = self._record_distance(distance)

        if smoothed_distance is not None:
            current_state = self._classify_state(smoothed_distance)

            # Count only at CLEAR -> OCCUPIED transition.
            if self.last_state == STATE_CLEAR and current_state == STATE_OCCUPIED:
                should_trigger = (not self.triggered) and (not self._in_cooldown(now_ts))

                if should_trigger:
                    # Exit logic is optional and disabled by default due to single-sensor ambiguity.
                    if self.enable_exit_counting and motion == 0 and self.current_count > 0:
                        self.current_count -= 1
                        event_type = "EXIT"
                    else:
                        self.current_count += 1
                        event_type = "ENTRY"
                        self.event_count_total += 1

                    self.current_count = max(0, self.current_count)
                    self.last_trigger_time = now_ts
                    self.triggered = True

            # Reset trigger latch once doorway becomes clear.
            if current_state == STATE_CLEAR:
                self.triggered = False

            self.last_state = current_state
            self._previous_smoothed_distance = smoothed_distance
        else:
            current_state = self.last_state

        trigger_text = "YES" if event_type else "NO"
        dist_text = "None" if smoothed_distance is None else f"{smoothed_distance:.2f}"
        prev_text = "None" if previous_distance is None else f"{previous_distance:.2f}"
        print(
            f"[DEBUG] dist={dist_text} prev={prev_text} state={current_state} "
            f"trigger={trigger_text} count={self.current_count}"
        )

        return OccupancyUpdate(
            current_count=self.current_count,
            last_state=self.last_state,
            last_trigger_time=(
                self.last_trigger_time.isoformat() if self.last_trigger_time else None
            ),
            event_type=event_type,
            event_count_total=self.event_count_total,
            smoothed_distance=smoothed_distance,
            previous_distance=previous_distance,
            triggered=self.triggered,
        )

    def reset(self, timestamp: str) -> OccupancyUpdate:
        """Reset occupancy estimate to zero."""
        self.current_count = 0
        self.last_state = STATE_CLEAR
        self.last_trigger_time = self._parse_timestamp(timestamp)
        self.triggered = False
        self._distance_window.clear()
        self._previous_smoothed_distance = None

        return OccupancyUpdate(
            current_count=self.current_count,
            last_state=self.last_state,
            last_trigger_time=self.last_trigger_time.isoformat(),
            event_type="RESET",
            event_count_total=self.event_count_total,
            smoothed_distance=None,
            previous_distance=None,
            triggered=self.triggered,
        )


def run_simulation_mode(
    sequence: Iterable[float],
    entry_threshold: float = 50.0,
    cooldown_seconds: float = 3.0,
    smoothing_window: int = 5,
) -> tuple[int, list[str | None]]:
    """Run a deterministic simulation over a distance sequence.

    Returns final count and event list so behavior can be asserted in tests.
    """
    estimator = EntryOccupancyEstimator(
        entry_threshold=entry_threshold,
        cooldown_seconds=cooldown_seconds,
        smoothing_window=smoothing_window,
        enable_exit_counting=False,
    )

    events: list[str | None] = []
    base_ts = datetime.now(timezone.utc)

    for index, distance in enumerate(sequence):
        ts = (base_ts.timestamp() + index * 1.0)
        iso_ts = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat().replace(
            "+00:00", "Z"
        )
        result = estimator.update(distance=distance, motion=1, timestamp=iso_ts)
        events.append(result.event_type)

    return estimator.current_count, events


if __name__ == "__main__":
    test_sequence = [200, 180, 150, 40, 35, 30, 120, 180]
    count, events = run_simulation_mode(test_sequence)
    print("Simulation sequence:", test_sequence)
    print("Simulation events:", events)
    print("Expected one ENTRY; final count should be 1")
    print("Final count:", count)
