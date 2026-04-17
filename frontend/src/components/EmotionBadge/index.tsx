import { Progress, Tag } from 'antd';
import React from 'react';

import type { EmotionLabel } from '../../types';

interface EmotionBadgeProps {
  emotion: EmotionLabel;
  confidence: number;
}

const EMOTION_COLORS: Record<string, string> = {
  happy: '#52c41a',
  sad: '#1890ff',
  angry: '#ff4d4f',
  neutral: '#8c8c8c',
  fear: '#722ed1',
  surprise: '#fa8c16',
  'Tidak Terdeteksi': '#d9d9d9',
};

const EMOTION_LABELS_ID: Record<string, string> = {
  happy: 'Senang',
  sad: 'Sedih',
  angry: 'Marah',
  neutral: 'Netral',
  fear: 'Takut',
  surprise: 'Terkejut',
  'Tidak Terdeteksi': 'Tidak Terdeteksi',
};

export const EmotionBadge: React.FC<EmotionBadgeProps> = ({ emotion, confidence }) => {
  if (!emotion) return null;

  const color = EMOTION_COLORS[emotion] ?? '#d9d9d9';
  const label = EMOTION_LABELS_ID[emotion] ?? emotion;
  const percentage = Math.round(confidence * 100);

  return (
    <div style={{ marginBottom: 4 }}>
      <Tag
        color={color}
        style={{
          fontSize: 15,
          padding: '4px 14px',
          marginBottom: 10,
          border: '2px solid #225555',
          borderRadius: 18,
          fontWeight: 600,
        }}
      >
        {label}
      </Tag>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#51463B', minWidth: 90, flexShrink: 0 }}>
          Keyakinan:
        </span>
        <Progress
          percent={percentage}
          strokeColor={color}
          trailColor="#e8e0d0"
          style={{ flex: 1, margin: 0 }}
          strokeWidth={14}
          showInfo
          format={p => `${p}%`}
        />
      </div>
    </div>
  );
};
