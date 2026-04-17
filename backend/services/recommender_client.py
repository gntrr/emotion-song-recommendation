import logging

import requests

logger = logging.getLogger(__name__)


class RecommenderClient:
    """HTTP client for the Song Recommendation API."""

    def __init__(self, base_url: str, timeout: int = 5) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def get_recommendations(self, emotion: str, top_n: int = 5) -> dict | None:
        """Fetch song recommendations for a given emotion.

        Returns the parsed JSON response dict, or None on any error.
        Response shape (from Song Recommendation API):
            {
                "songs": [...],
                "fallback_used": bool,
                "emotion_used": str,
                "original_emotion": str | None,
                ...
            }
        """
        url = f"{self.base_url}/recommend"
        params = {"emotion": emotion, "top_n": top_n}
        try:
            response = requests.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ConnectionError:
            logger.error("Cannot connect to Song Recommendation API at %s", self.base_url)
        except requests.exceptions.Timeout:
            logger.error("Song Recommendation API request timed out after %ds", self.timeout)
        except requests.exceptions.HTTPError as exc:
            logger.error("Song Recommendation API returned HTTP error: %s", exc)
        except Exception as exc:
            logger.error("Unexpected error calling Song Recommendation API: %s", exc)
        return None
