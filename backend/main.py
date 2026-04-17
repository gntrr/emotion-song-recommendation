import csv
import logging
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

import config
from services.emotion_classifier import EmotionClassifier
from services.face_detector import FaceDetector
from services.preprocessor import (
    crop_roi,
    decode_base64_image,
    prepare_for_emotion_model,
    validate_frame,
)
from services.recommender_client import RecommenderClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Singletons (initialised in lifespan)
# ---------------------------------------------------------------------------
face_detector: FaceDetector | None = None
emotion_classifier: EmotionClassifier | None = None
recommender_client: RecommenderClient | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global face_detector, emotion_classifier, recommender_client

    logger.info("Initialising services…")

    face_detector = FaceDetector(
        model_path=config.YOLO_MODEL_PATH,
        confidence_threshold=config.YOLO_CONFIDENCE_THRESHOLD,
    )
    emotion_classifier = EmotionClassifier(
        model_path=config.EMOTION_MODEL_PATH,
        labels=config.EMOTION_LABELS,
        confidence_threshold=config.EMOTION_CONFIDENCE_THRESHOLD,
    )
    recommender_client = RecommenderClient(
        base_url=config.SONG_API_BASE_URL,
        timeout=config.SONG_API_TIMEOUT,
    )

    os.makedirs(config.DATA_DIR, exist_ok=True)

    logger.info("Services ready — face_detector=%s, emotion_classifier=%s",
                face_detector.available, emotion_classifier.is_available())

    yield

    logger.info("Shutting down…")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Emotion Song Recommendation — Backend",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class ProcessFrameRequest(BaseModel):
    image: str
    frame_count: int = 0


class ProcessFrameResponse(BaseModel):
    face_detected: bool
    bbox: Optional[list[float]] = None
    emotion_label: Optional[str] = None
    confidence: float = 0.0
    all_scores: dict[str, float] = {}
    error: Optional[str] = None


class KuesionerRequest(BaseModel):
    accuracy_rating: int = Field(..., ge=1, le=5)
    relevance_rating: int = Field(..., ge=1, le=5)
    ease_of_use_rating: int = Field(..., ge=1, le=5)
    overall_rating: int = Field(..., ge=1, le=5)
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "face_detector_available": face_detector.available if face_detector else False,
        "emotion_classifier_available": emotion_classifier.is_available() if emotion_classifier else False,
    }


@app.post("/process-frame", response_model=ProcessFrameResponse)
async def process_frame(req: ProcessFrameRequest):
    # Decode image
    try:
        image = decode_base64_image(req.image)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {exc}")

    # Validate frame
    is_valid, validation_error = validate_frame(image)
    if not is_valid:
        return ProcessFrameResponse(face_detected=False, error=validation_error)

    # Face detection
    if not face_detector or not face_detector.available:
        return ProcessFrameResponse(
            face_detected=False,
            error="Deteksi wajah tidak tersedia (model tidak dimuat).",
        )

    best_face = face_detector.detect_best(image)
    if best_face is None:
        return ProcessFrameResponse(face_detected=False)

    bbox = best_face["bbox"]

    # Crop ROI
    roi = crop_roi(image, bbox)
    if roi is None:
        return ProcessFrameResponse(face_detected=True, bbox=bbox)

    # Emotion classification
    if not emotion_classifier or not emotion_classifier.is_available():
        return ProcessFrameResponse(
            face_detected=True,
            bbox=bbox,
            emotion_label="Tidak Terdeteksi",
            confidence=0.0,
            error="Klasifikasi emosi tidak tersedia (model tidak dimuat).",
        )

    prepared = prepare_for_emotion_model(roi)
    result = emotion_classifier.classify(prepared)

    return ProcessFrameResponse(
        face_detected=True,
        bbox=bbox,
        emotion_label=result["emotion_label"],
        confidence=result["confidence"],
        all_scores=result["all_scores"],
    )


@app.get("/recommend")
async def recommend(emotion: str, top_n: int = 5):
    if not recommender_client:
        raise HTTPException(status_code=503, detail="Layanan rekomendasi tidak tersedia.")
    data = recommender_client.get_recommendations(emotion=emotion, top_n=top_n)
    if data is None:
        raise HTTPException(status_code=502, detail="Gagal menghubungi Song API.")
    return data


@app.post("/submit-kuesioner")
async def submit_kuesioner(req: KuesionerRequest):
    file_exists = os.path.isfile(config.KUESIONER_CSV_PATH)

    try:
        with open(config.KUESIONER_CSV_PATH, "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "accuracy_rating",
                    "relevance_rating",
                    "ease_of_use_rating",
                    "overall_rating",
                    "notes",
                ],
            )
            if not file_exists:
                writer.writeheader()
            writer.writerow({
                "accuracy_rating": req.accuracy_rating,
                "relevance_rating": req.relevance_rating,
                "ease_of_use_rating": req.ease_of_use_rating,
                "overall_rating": req.overall_rating,
                "notes": req.notes or "",
            })
        logger.info("Kuesioner saved to %s", config.KUESIONER_CSV_PATH)
    except Exception as exc:
        logger.error("Failed to save kuesioner: %s", exc)
        raise HTTPException(status_code=500, detail="Gagal menyimpan kuesioner.")

    return {"success": True, "message": "Kuesioner berhasil disimpan"}
