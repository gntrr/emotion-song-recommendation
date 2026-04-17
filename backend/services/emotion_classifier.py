import logging

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
      - GlobalAveragePooling2D → Flatten
      - Dense(num_classes, use_bias=False)
      - Softmax
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


def _load_model_compat(model_path: str):
    """Build Mini-Xception architecture then load weights from H5 file.

    Bypasses Keras model_config entirely — avoids all Keras 3 vs TF 2.10
    serialisation incompatibilities.
    """
    model = _build_mini_xception()
    param_count = model.count_params()
    logger.debug("Built Mini-Xception: %d params", param_count)

    model.load_weights(model_path)
    return model


class EmotionClassifier:
    """Mini-Xception emotion classification wrapper."""

    def __init__(
        self,
        model_path: str,
        labels: list[str],
        confidence_threshold: float = 0.4,
    ) -> None:
        self.labels = labels
        self.confidence_threshold = confidence_threshold
        self._model = None
        self._available = False

        try:
            self._model = _load_model_compat(model_path)
            self._available = True
            logger.info("Mini-Xception model loaded from: %s", model_path)
        except ImportError:
            logger.warning("TensorFlow/Keras not available — emotion classification disabled")
        except (FileNotFoundError, OSError):
            logger.warning("Emotion model file not found: %s — classification disabled", model_path)
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
        if not self._available or self._model is None:
            return {
                "emotion_label": "Tidak Terdeteksi",
                "confidence": 0.0,
                "all_scores": {label: 0.0 for label in self.labels},
            }

        try:
            preds = self._model.predict(preprocessed_input, verbose=0)[0]
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
