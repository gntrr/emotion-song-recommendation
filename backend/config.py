import os
from dotenv import load_dotenv

load_dotenv()

YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", "../models/yolov10n-fallback.pt")
EMOTION_MODEL_PATH: str = os.getenv("EMOTION_MODEL_PATH", "../models/mini_xception_final.h5")

YOLO_CONFIDENCE_THRESHOLD: float = float(os.getenv("YOLO_CONFIDENCE_THRESHOLD", "0.5"))
EMOTION_CONFIDENCE_THRESHOLD: float = float(os.getenv("EMOTION_CONFIDENCE_THRESHOLD", "0.4"))
FRAME_PROCESSING_INTERVAL: int = int(os.getenv("FRAME_PROCESSING_INTERVAL", "5"))
SONG_API_TIMEOUT: int = int(os.getenv("SONG_API_TIMEOUT", "5"))

CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
SONG_API_BASE_URL: str = os.getenv("SONG_API_BASE_URL", "http://localhost:8000")

EMOTION_LABELS: list[str] = ["angry", "fear", "happy", "neutral", "sad", "surprise"]
FALLBACK_MAP: dict[str, str] = {"surprise": "happy", "fear": "sad"}

# Resolve model paths relative to the backend directory
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
YOLO_MODEL_PATH = os.path.normpath(os.path.join(_BACKEND_DIR, YOLO_MODEL_PATH))
EMOTION_MODEL_PATH = os.path.normpath(os.path.join(_BACKEND_DIR, EMOTION_MODEL_PATH))

DATA_DIR = os.path.join(_BACKEND_DIR, "data")
KUESIONER_CSV_PATH = os.path.join(DATA_DIR, "hasil_kuesioner.csv")
