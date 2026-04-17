import { Alert, Empty, Spin, Typography } from 'antd';
import React from 'react';

import type { EmotionLabel, RecommendationResponse } from '../../types';
import { SongCard } from '../SongCard';

const { Title } = Typography;

const EMOTION_LABELS_ID: Record<string, string> = {
  happy: 'Senang',
  sad: 'Sedih',
  angry: 'Marah',
  neutral: 'Netral',
  fear: 'Takut',
  surprise: 'Terkejut',
};

interface RecommendationListProps {
  recommendations: RecommendationResponse | null;
  isLoading: boolean;
  error: string | null;
  currentEmotion: EmotionLabel;
}

export const RecommendationList: React.FC<RecommendationListProps> = ({
  recommendations,
  isLoading,
  error,
  currentEmotion,
}) => {
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
        <div style={{ marginTop: 12, color: '#51463B' }}>Memuat rekomendasi lagu…</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error" title={error} showIcon style={{ borderRadius: 12 }} />
    );
  }

  if (!recommendations) {
    return (
      <Empty
        description="Mulai deteksi untuk mendapatkan rekomendasi lagu"
        style={{ color: '#51463B' }}
      />
    );
  }

  const { songs, fallback_used, emotion_used, fallback_from } = recommendations;

  return (
    <div>
      {currentEmotion && currentEmotion !== 'Tidak Terdeteksi' && (
        <Title level={4} style={{ color: '#225555', marginBottom: 12 }}>
          Rekomendasi untuk: {EMOTION_LABELS_ID[currentEmotion] ?? currentEmotion}
        </Title>
      )}

      {fallback_used && fallback_from && (
        <Alert
          type="info"
          title={`Emosi ${EMOTION_LABELS_ID[fallback_from] ?? fallback_from} terdeteksi. Menampilkan lagu untuk emosi ${EMOTION_LABELS_ID[emotion_used] ?? emotion_used}.`}
          showIcon
          style={{ marginBottom: 12, borderRadius: 12, border: '2px solid #9CD3D3' }}
        />
      )}

      {songs.length === 0 ? (
        <Alert
          type="warning"
          title="Tidak ada rekomendasi lagu yang tersedia untuk emosi ini saat ini."
          showIcon
          style={{ borderRadius: 12 }}
        />
      ) : (
        songs.map((song, index) => (
          <SongCard key={`${song.track_name}-${index}`} song={song} index={index} />
        ))
      )}
    </div>
  );
};
