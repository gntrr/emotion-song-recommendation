import logging
import os

import numpy as np

logger = logging.getLogger(__name__)


def _build_mini_xception(num_classes: int = 6, input_shape: tuple = (48, 48, 1)):
    """Rebuild Mini-Xception architecture in TF 2.10 Keras.

    Architecture (verified 57 264 total params with num_classes=6):
      - Entry: Conv2D(8,3,padding=same) → BN → ReLU → Conv2D(8,3,padding=same) → BN → ReLU
      - 4 × depthwise-separable Xception module (filters: 16, 32, 64, 128)
          each: SeparableConv2D(f,3,padding=same) → BN → ReLU
                SeparableConv2D(f,3,padding=same) → BN
                MaxPool2D(3,strides=2,padding=same)
                residual shortcut: Conv2D(f,1,strides=2,padding=same) → BN
                add residual
      - Conv2D(num_classes,3,padding=same) → GlobalAveragePooling2D → Flatten → Softmax
    """
    from tensorflow import keras  # type: ignore
    from tensorflow.keras import layers  # type: ignore

    inp = keras.Input(shape=input_shape)

    # ── Entry block ──────────────────────────────────────────────────────────
    x = layers.Conv2D(8, 3, padding="same", use_bias=False)(inp)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)

    x = layers.Conv2D(8, 3, padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)

    # ── Xception modules ─────────────────────────────────────────────────────
    for filters in (16, 32, 64, 128):
        residual = layers.Conv2D(filters, 1, strides=2, padding="same", use_bias=False)(x)
        residual = layers.BatchNormalization()(residual)

        x = layers.SeparableConv2D(filters, 3, padding="same", use_bias=False)(x)
        x = layers.BatchNormalization()(x)
        x = layers.Activation("relu")(x)

        x = layers.SeparableConv2D(filters, 3, padding="same", use_bias=False)(x)
        x = layers.BatchNormalization()(x)

        x = layers.MaxPooling2D(3, strides=2, padding="same")(x)
        x = layers.Add()([x, residual])

    # ── Output ───────────────────────────────────────────────────────────────
    x = layers.Conv2D(num_classes, 3, padding="same", use_bias=False)(x)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Flatten()(x)
    out = layers.Softmax()(x)

    return keras.Model(inp, out, name="mini_xception")


class _TFBackend:
    """TensorFlow/Keras inference backend (local dev, Intel Mac)."""

    def __init__(self, model_path: str) -> None:
        model = _build_mini_xception()
        model.load_weights(model_path)
        self._model = model

    def predict(self, inp: np.ndarray) -> np.ndarray:
        return self._model.predict(inp, verbose=0)[0]


class _OnnxBackend:
    """ONNX Runtime inference backend (Docker / servers without AVX/SSE4.1)."""

    def __init__(self, model_path: str) -> None:
        import onnxruntime as ort  # type: ignore

        self._session = ort.InferenceSession(model_path)
        self._input_name = self._session.get_inputs()[0].name

    def predict(self, inp: np.ndarray) -> np.ndarray:
        out = self._session.run(None, {self._input_name: inp.astype(np.float32)})[0]
        return out[0]


def _load_backend(model_path: str):
    """Pick ONNX backend if .onnx file exists, otherwise fall back to TF."""
    # Direct ONNX path
    if model_path.endswith(".onnx"):
        return _OnnxBackend(model_path)

    # .h5 given — prefer sibling .onnx file (cross-platform, no SSE4.1 needed)
    onnx_path = os.path.splitext(model_path)[0] + ".onnx"
    if os.path.exists(onnx_path):
        logger.info("ONNX model found, using ONNX Runtime backend: %s", onnx_path)
        return _OnnxBackend(onnx_path)

    # Fall back to TensorFlow (requires SSE4.1 on Linux x86-64)
    logger.info("Using TensorFlow backend: %s", model_path)
    return _TFBackend(model_path)


class EmotionClassifier:
    """Mini-Xception emotion classification wrapper.

    Automatically selects ONNX Runtime when a sibling .onnx file exists
    (avoids TF SSE4.1/AVX requirement on production servers).
    """

    def __init__(
        self,
        model_path: str,
        labels: list[str],
        confidence_threshold: float = 0.4,
    ) -> None:
        self.labels = labels
        self.confidence_threshold = confidence_threshold
        self._backend = None
        self._available = False

        try:
            self._backend = _load_backend(model_path)
            self._available = True
            logger.info("Emotion classifier ready (%s)", model_path)
        except ImportError as exc:
            logger.warning("ML backend unavailable: %s — emotion classification disabled", exc)
        except (FileNotFoundError, OSError):
            logger.warning("Emotion model not found: %s — classification disabled", model_path)
        except Exception as exc:
            logger.warning("Failed to load emotion model: %s — classification disabled", exc)

    def is_available(self) -> bool:
        return self._available

    def classify(self, preprocessed_input: np.ndarray) -> dict:
        """Run emotion classification inference.

        Args:
            preprocessed_input: Array of shape (1, 48, 48, 1), values in [0, 1].

        Returns:
            {
                "emotion_label": str,
                "confidence": float,
                "all_scores": {label: score, ...},
            }
        """
        if not self._available or self._backend is None:
            return {
                "emotion_label": "Tidak Terdeteksi",
                "confidence": 0.0,
                "all_scores": {label: 0.0 for label in self.labels},
            }

        try:
            preds = self._backend.predict(preprocessed_input)
            all_scores = {label: float(score) for label, score in zip(self.labels, preds)}
            max_idx = int(np.argmax(preds))
            max_conf = float(preds[max_idx])
            max_label = self.labels[max_idx]

            if max_conf < self.confidence_threshold:
                return {
                    "emotion_label": "Tidak Terdeteksi",
                    "confidence": max_conf,
                    "all_scores": all_scores,
                }

            return {
                "emotion_label": max_label,
                "confidence": max_conf,
                "all_scores": all_scores,
            }
        except Exception as exc:
            logger.error("Emotion classification error: %s", exc)
            return {
                "emotion_label": "Tidak Terdeteksi",
                "confidence": 0.0,
                "all_scores": {label: 0.0 for label in self.labels},
            }
