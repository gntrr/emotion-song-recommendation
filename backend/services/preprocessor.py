import base64
import logging

import cv2
import numpy as np

logger = logging.getLogger(__name__)

MIN_FRAME_WIDTH = 480
MIN_FRAME_HEIGHT = 360
MIN_BRIGHTNESS = 15
MIN_ROI_SIZE = 48


def decode_base64_image(base64_str: str) -> np.ndarray:
    """Decode a base64 PNG/JPEG string to an OpenCV BGR image."""
    # Strip data URI prefix if present (e.g. "data:image/jpeg;base64,")
    if "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]

    img_bytes = base64.b64decode(base64_str)
    nparr = np.frombuffer(img_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Failed to decode image from base64 string")
    return image


def validate_frame(image: np.ndarray) -> tuple[bool, str]:
    """Validate frame dimensions and brightness.

    Returns:
        (is_valid, error_message) — error_message is empty string when valid.
    """
    h, w = image.shape[:2]
    if w < MIN_FRAME_WIDTH or h < MIN_FRAME_HEIGHT:
        return False, f"Resolusi frame terlalu kecil ({w}x{h}). Minimum {MIN_FRAME_WIDTH}x{MIN_FRAME_HEIGHT}."

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))
    if brightness < MIN_BRIGHTNESS:
        return False, "Pencahayaan terlalu gelap. Pastikan cahaya cukup saat menggunakan kamera."

    return True, ""


def crop_roi(
    image: np.ndarray,
    bbox: list[float],
    padding: float = 0.1,
) -> np.ndarray | None:
    """Crop face ROI from image using bounding box [x1, y1, x2, y2] with padding.

    Returns None if the crop is too small (<48x48 pixels).
    """
    h, w = image.shape[:2]
    x1, y1, x2, y2 = [int(v) for v in bbox]

    pad_x = int((x2 - x1) * padding)
    pad_y = int((y2 - y1) * padding)

    x1 = max(0, x1 - pad_x)
    y1 = max(0, y1 - pad_y)
    x2 = min(w, x2 + pad_x)
    y2 = min(h, y2 + pad_y)

    if (x2 - x1) < MIN_ROI_SIZE or (y2 - y1) < MIN_ROI_SIZE:
        logger.debug("Cropped ROI too small: %dx%d", x2 - x1, y2 - y1)
        return None

    return image[y1:y2, x1:x2]


def prepare_for_emotion_model(roi: np.ndarray) -> np.ndarray:
    """Preprocess a face ROI for the Mini-Xception model.

    Steps: BGR → grayscale → resize 48×48 → normalize [0,1] → reshape (1,48,48,1).
    """
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (48, 48), interpolation=cv2.INTER_AREA)
    normalized = resized.astype(np.float32) / 255.0
    return normalized.reshape(1, 48, 48, 1)
