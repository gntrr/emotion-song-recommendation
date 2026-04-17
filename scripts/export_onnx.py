#!/usr/bin/env python3
"""Convert mini_xception_final.h5 → mini_xception_final.onnx.

Run once from repo root:
    pip install tf2onnx
    python scripts/export_onnx.py
"""
import os
import sys

# Allow importing from backend/services
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

ROOT = os.path.join(os.path.dirname(__file__), "..")
H5_PATH = os.path.abspath(os.path.join(ROOT, "models", "mini_xception_final.h5"))
ONNX_PATH = os.path.abspath(os.path.join(ROOT, "models", "mini_xception_final.onnx"))

if not os.path.exists(H5_PATH):
    sys.exit(f"[ERROR] Model not found: {H5_PATH}")

print(f"Loading weights from: {H5_PATH}")
from services.emotion_classifier import _build_mini_xception  # noqa: E402

model = _build_mini_xception()
model.load_weights(H5_PATH)
print(f"  params: {model.count_params():,}")

import tensorflow as tf  # noqa: E402
import tf2onnx  # noqa: E402

spec = (tf.TensorSpec((None, 48, 48, 1), tf.float32, name="input"),)
tf2onnx.convert.from_keras(model, input_signature=spec, output_path=ONNX_PATH)
print(f"ONNX saved → {ONNX_PATH}")
