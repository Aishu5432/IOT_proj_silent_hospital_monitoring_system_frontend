"""Camera frame analysis helpers for person counting."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

try:
    import cv2
    import numpy as np
except ImportError:  # pragma: no cover - handled at runtime
    cv2 = None
    np = None


def utc_now_iso() -> str:
    """Return UTC timestamp in ISO-8601 Z format."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@dataclass(frozen=True)
class DetectionBox:
    """Detected person bounding box."""

    x: int
    y: int
    width: int
    height: int
    confidence: float


class CameraPersonCounter:
    """Count people from uploaded frames using OpenCV's HOG detector."""

    def __init__(self) -> None:
        self._hog = None
        if cv2 is not None:
            self._hog = cv2.HOGDescriptor()
            self._hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

    def _require_dependencies(self) -> None:
        if cv2 is None or np is None:
            raise RuntimeError(
                "Camera analysis requires opencv-python-headless and numpy to be installed."
            )

    def _decode_frame(self, frame_bytes: bytes):
        self._require_dependencies()
        if not frame_bytes:
            raise ValueError("Empty camera frame received.")

        buffer = np.frombuffer(frame_bytes, dtype=np.uint8)
        image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Unable to decode camera frame.")
        return image

    def count_people(self, frame_bytes: bytes) -> dict[str, Any]:
        """Count people in one image frame."""

        if self._hog is None:
            self._require_dependencies()

        image = self._decode_frame(frame_bytes)
        original_height, original_width = image.shape[:2]

        max_width = 960
        if original_width > max_width:
            scale = max_width / float(original_width)
            resized_width = max_width
            resized_height = max(1, int(original_height * scale))
            image = cv2.resize(image, (resized_width, resized_height))

        grayscale = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        rects, weights = self._hog.detectMultiScale(
            grayscale,
            winStride=(8, 8),
            padding=(8, 8),
            scale=1.05,
        )

        detections = []
        for (x, y, width, height), confidence in zip(rects, weights):
            detections.append(
                DetectionBox(
                    x=int(x),
                    y=int(y),
                    width=int(width),
                    height=int(height),
                    confidence=float(round(confidence, 4)),
                )
            )

        return {
            "person_count": len(detections),
            "detections": [d.__dict__ for d in detections],
            "frame_width": int(image.shape[1]),
            "frame_height": int(image.shape[0]),
            "timestamp": utc_now_iso(),
            "model": "opencv-hog",
        }
