import { useCallback, useRef, useState } from 'react';

import { getRecommendations, RECOMMENDATION_DEBOUNCE } from '../services/api';
import type { RecommendationResponse } from '../types';

interface UseRecommendationReturn {
  recommendations: RecommendationResponse | null;
  isLoading: boolean;
  error: string | null;
  triggerRecommendation: (emotion: string) => void;
  clearRecommendations: () => void;
}

export function useRecommendation(): UseRecommendationReturn {
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmotionRef = useRef<string | null>(null);

  const triggerRecommendation = useCallback((emotion: string) => {
    if (emotion === lastEmotionRef.current) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      lastEmotionRef.current = emotion;
      setIsLoading(true);
      setError(null);
      try {
        const result = await getRecommendations(emotion);
        setRecommendations(result);
      } catch {
        setError('Layanan rekomendasi tidak tersedia. Pastikan API berjalan di localhost:8000.');
        setRecommendations(null);
      } finally {
        setIsLoading(false);
      }
    }, RECOMMENDATION_DEBOUNCE);
  }, []);

  const clearRecommendations = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setRecommendations(null);
    setError(null);
    lastEmotionRef.current = null;
  }, []);

  return { recommendations, isLoading, error, triggerRecommendation, clearRecommendations };
}
