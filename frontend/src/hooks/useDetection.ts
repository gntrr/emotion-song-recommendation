import { useCallback, useEffect, useRef, useState } from 'react';

import { processFrame } from '../services/api';
import type { DetectionResult } from '../types';

interface UseDetectionProps {
  isActive: boolean;
  captureFrame: (canvasRef: React.RefObject<HTMLCanvasElement | null>) => string | null;
  captureCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  onEmotionChange?: (emotion: string) => void;
}

interface UseDetectionReturn {
  detectionResult: DetectionResult | null;
  isProcessing: boolean;
  noFaceTimeout: boolean;
}

const FRAME_INTERVAL = 5;
const NO_FACE_TIMEOUT_MS = 5000;

export function useDetection({
  isActive,
  captureFrame,
  captureCanvasRef,
  onEmotionChange,
}: UseDetectionProps): UseDetectionReturn {
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [noFaceTimeout, setNoFaceTimeout] = useState(false);

  const frameCountRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const noFaceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmotionRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);

  const resetNoFaceTimer = useCallback(() => {
    if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
    setNoFaceTimeout(false);
    noFaceTimerRef.current = setTimeout(() => setNoFaceTimeout(true), NO_FACE_TIMEOUT_MS);
  }, []);

  const processLoop = useCallback(async () => {
    if (!isActive) return;

    frameCountRef.current += 1;

    if (frameCountRef.current % FRAME_INTERVAL === 0 && !isProcessingRef.current) {
      const frame = captureFrame(captureCanvasRef);
      if (frame) {
        isProcessingRef.current = true;
        setIsProcessing(true);
        try {
          const result = await processFrame(frame, frameCountRef.current);
          setDetectionResult(result);

          if (!result.face_detected) {
            resetNoFaceTimer();
          } else {
            if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
            setNoFaceTimeout(false);

            const emotion = result.emotion_label;
            if (emotion && emotion !== 'Tidak Terdeteksi' && emotion !== lastEmotionRef.current) {
              lastEmotionRef.current = emotion;
              onEmotionChange?.(emotion);
            }
          }
        } catch {
          // Silently ignore per-frame errors to not interrupt the loop
        } finally {
          isProcessingRef.current = false;
          setIsProcessing(false);
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(() => { void processLoop(); });
  }, [isActive, captureFrame, captureCanvasRef, onEmotionChange, resetNoFaceTimer]);

  useEffect(() => {
    if (isActive) {
      frameCountRef.current = 0;
      lastEmotionRef.current = null;
      animFrameRef.current = requestAnimationFrame(() => { void processLoop(); });
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
      setDetectionResult(null);
      setNoFaceTimeout(false);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
    };
  }, [isActive, processLoop]);

  return { detectionResult, isProcessing, noFaceTimeout };
}
