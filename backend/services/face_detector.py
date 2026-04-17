import logging

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class FaceDetector:
    """OpenCV Haar Cascade face detector (bundled with opencv-python, cross-platform)."""

    def __init__(self, model_path: str, confidence_threshold: float = 0.5) -> None:
        # model_path kept for API compatibility; cascade is loaded from OpenCV data dir
        self.confidence_threshold = confidence_threshold
        self.available = False
        self._cascade: cv2.CascadeClassifier | None = None

        try:
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            cascade = cv2.CascadeClassifier(cascade_path)
            if cascade.empty():
                raise RuntimeError("CascadeClassifier loaded but is empty")
            self._cascade = cascade
            self.available = True
            logger.info("OpenCV Haar Cascade face detector initialised")
        except Exception as exc:
            logger.warning("Failed to initialise face detector: %s", exc)

    def detect(self, image: np.ndarray) -> list[dict]:
        """Run face detection on a BGR image.

        Returns a list of dicts sorted by bounding-box area descending
        (Haar cascade does not produce confidence scores):
            [{"bbox": [x1, y1, x2, y2], "confidence": float}, ...]
        """
        if not self.available or self._cascade is None:
            return []

        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = self._cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(48, 48),
            )

            detections = []
            if len(faces):
                for x, y, w, h in faces:
                    detections.append({
                        "bbox": [float(x), float(y), float(x + w), float(y + h)],
                        "confidence": 1.0,  # Haar cascade has no per-detection score
                    })
                # Sort largest face first (proxy for "most prominent")
                detections.sort(key=lambda d: (d["bbox"][2] - d["bbox"][0]) * (d["bbox"][3] - d["bbox"][1]), reverse=True)

            return detections
        except Exception as exc:
            logger.error("Face detection error: %s", exc)
            return []

    def detect_best(self, image: np.ndarray) -> dict | None:
        """Return the largest detected face, or None."""
        detections = self.detect(image)
        return detections[0] if detections else None
