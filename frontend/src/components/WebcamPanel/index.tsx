import { Alert, Card } from 'antd';
import React, { useEffect, useRef } from 'react';

import type { DetectionResult } from '../../types';

const EMOTION_COLORS: Record<string, string> = {
  happy: '#52c41a',
  sad: '#1890ff',
  angry: '#ff4d4f',
  neutral: '#8c8c8c',
  fear: '#722ed1',
  surprise: '#fa8c16',
};

const EMOTION_LABELS_ID: Record<string, string> = {
  happy: 'Senang',
  sad: 'Sedih',
  angry: 'Marah',
  neutral: 'Netral',
  fear: 'Takut',
  surprise: 'Terkejut',
};

interface WebcamPanelProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  captureCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  isStreaming: boolean;
  detectionResult: DetectionResult | null;
  error: string | null;
}

export const WebcamPanel: React.FC<WebcamPanelProps> = ({
  videoRef,
  captureCanvasRef,
  isStreaming,
  detectionResult,
  error,
}) => {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isStreaming) return;

    let animId: number;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detectionResult?.face_detected && detectionResult.bbox) {
        const [x1, y1, x2, y2] = detectionResult.bbox;
        const label = detectionResult.emotion_label;
        const color = label ? (EMOTION_COLORS[label] ?? '#225555') : '#225555';

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        (ctx as CanvasRenderingContext2D & { roundRect?: (...args: unknown[]) => void }).roundRect?.(
          x1, y1, x2 - x1, y2 - y1, 8,
        );
        ctx.stroke();

        if (label && label !== 'Tidak Terdeteksi') {
          const displayLabel = EMOTION_LABELS_ID[label] ?? label;
          const conf = Math.round(detectionResult.confidence * 100);
          const text = `${displayLabel} ${conf}%`;
          const boxW = Math.max(x2 - x1, ctx.measureText(text).width + 16);
          ctx.fillStyle = color;
          ctx.fillRect(x1, y1 - 28, boxW, 28);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText(text, x1 + 6, y1 - 8);
        }
      }
    };

    const loop = () => {
      draw();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isStreaming, detectionResult, videoRef]);

  return (
    <Card
      title="Video Feed"
      style={{ background: '#BBAA99', border: '2px solid #225555', borderRadius: 18 }}
      styles={{
        header: {
          background: '#BBAA99',
          color: '#225555',
          borderBottom: '2px solid #225555',
          borderRadius: '16px 16px 0 0',
        },
      }}
    >
      {error && (
        <Alert
          type="error"
          title={error}
          showIcon
          style={{ marginBottom: 12, borderRadius: 12 }}
        />
      )}

      <div
        style={{
          position: 'relative',
          background: '#1a1a1a',
          borderRadius: 12,
          overflow: 'hidden',
          minHeight: 300,
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: '100%', display: 'block', borderRadius: 12 }}
        />
        <canvas
          ref={overlayCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
        {!isStreaming && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ccc',
              fontSize: 16,
              background: 'rgba(0,0,0,0.6)',
            }}
          >
            Kamera belum aktif — klik "Mulai Deteksi"
          </div>
        )}
      </div>

      {/* Hidden canvas used only for capturing frames to send to backend */}
      <canvas ref={captureCanvasRef} style={{ display: 'none' }} />
    </Card>
  );
};
