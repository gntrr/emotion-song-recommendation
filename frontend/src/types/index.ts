export interface Song {
  track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  popularity: number;
  emotion_category: string;
  spotify_embed_url: string;
  preview_url: string | null;
  // advanced endpoint only
  energy?: number;
  genre?: string;
}

export interface RecommendationResponse {
  songs: Song[];
  fallback_used: boolean;
  emotion_used: string;
  emotion_requested: string;
  fallback_from: string | null;
  total_results: number;
  message: string | null;
}

export interface DetectionResult {
  face_detected: boolean;
  bbox: [number, number, number, number] | null;
  emotion_label: string | null;
  confidence: number;
  all_scores: Record<string, number>;
  error: string | null;
}

export type EmotionLabel =
  | 'angry'
  | 'fear'
  | 'happy'
  | 'neutral'
  | 'sad'
  | 'surprise'
  | 'Tidak Terdeteksi'
  | null;

export interface KuesionerData {
  accuracy_rating: number;
  relevance_rating: number;
  ease_of_use_rating: number;
  overall_rating: number;
  notes?: string;
}
