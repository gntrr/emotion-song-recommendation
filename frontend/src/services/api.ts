import type { DetectionResult, KuesionerData, RecommendationResponse } from '../types';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5000';
const SONG_API_BASE_URL = import.meta.env.VITE_SONG_API_BASE_URL || 'http://localhost:8000';

export const TOP_N_SONGS = 5;
export const RECOMMENDATION_DEBOUNCE = 3000;

export async function processFrame(imageBase64: string, frameCount: number): Promise<DetectionResult> {
  const response = await fetch(`${BACKEND_BASE_URL}/process-frame`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64, frame_count: frameCount }),
  });
  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }
  return response.json() as Promise<DetectionResult>;
}

export async function getRecommendations(emotion: string): Promise<RecommendationResponse> {
  const url = new URL(`${SONG_API_BASE_URL}/recommend`);
  url.searchParams.set('emotion', emotion);
  url.searchParams.set('top_n', String(TOP_N_SONGS));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Song API error: ${response.status}`);
  }
  return response.json() as Promise<RecommendationResponse>;
}

export async function submitKuesioner(
  data: KuesionerData,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BACKEND_BASE_URL}/submit-kuesioner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Submit error: ${response.status}`);
  }
  return response.json() as Promise<{ success: boolean; message: string }>;
}
