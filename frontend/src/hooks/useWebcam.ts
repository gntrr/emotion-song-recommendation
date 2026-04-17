import { useCallback, useRef, useState } from 'react';

interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isStreaming: boolean;
  error: string | null;
  startWebcam: () => Promise<void>;
  stopWebcam: () => void;
  captureFrame: (canvasRef: React.RefObject<HTMLCanvasElement | null>) => string | null;
}

export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWebcam = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
    } catch (err: unknown) {
      const e = err as DOMException;
      if (e.name === 'NotAllowedError') {
        setError('Izin kamera diperlukan. Harap izinkan akses kamera di browser.');
      } else if (e.name === 'NotFoundError') {
        setError('Kamera tidak ditemukan. Pastikan perangkat kamera terhubung.');
      } else {
        setError(`Gagal mengakses kamera: ${e.message}`);
      }
      setIsStreaming(false);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const captureFrame = useCallback(
    (canvasRef: React.RefObject<HTMLCanvasElement | null>): string | null => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !isStreaming || video.readyState < 2) return null;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.8);
    },
    [isStreaming],
  );

  return { videoRef, isStreaming, error, startWebcam, stopWebcam, captureFrame };
}
