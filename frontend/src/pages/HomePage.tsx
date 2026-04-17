import { FormOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Layout, Row, Typography, message as antMessage } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ControlButtons } from '../components/ControlButtons';
import { EmotionBadge } from '../components/EmotionBadge';
import { RecommendationList } from '../components/RecommendationList';
import { WebcamPanel } from '../components/WebcamPanel';
import { useDetection } from '../hooks/useDetection';
import { useRecommendation } from '../hooks/useRecommendation';
import { useWebcam } from '../hooks/useWebcam';
import type { EmotionLabel } from '../types';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionLabel>(null);

  const {
    videoRef,
    isStreaming,
    error: webcamError,
    startWebcam,
    stopWebcam,
    captureFrame,
  } = useWebcam();

  const {
    recommendations,
    isLoading: recLoading,
    error: recError,
    triggerRecommendation,
    clearRecommendations,
  } = useRecommendation();

  const handleEmotionChange = useCallback(
    (emotion: string) => {
      setCurrentEmotion(emotion as EmotionLabel);
      triggerRecommendation(emotion);
      void antMessage.info(`Emosi terdeteksi: ${emotion}`, 2);
    },
    [triggerRecommendation],
  );

  const { detectionResult, noFaceTimeout } = useDetection({
    isActive: isDetecting,
    captureFrame,
    captureCanvasRef,
    onEmotionChange: handleEmotionChange,
  });

  const handleStart = useCallback(async () => {
    await startWebcam();
    setIsDetecting(true);
  }, [startWebcam]);

  const handleStop = useCallback(() => {
    setIsDetecting(false);
    stopWebcam();
  }, [stopWebcam]);

  const handleReset = useCallback(() => {
    setIsDetecting(false);
    stopWebcam();
    setCurrentEmotion(null);
    clearRecommendations();
  }, [stopWebcam, clearRecommendations]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#FAFAEE' }}>
      <Header
        style={{
          background: '#225555',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <Title level={3} style={{ color: '#FAFAEE', margin: 0, fontSize: 20 }}>
          Emotion Song Recommendation
        </Title>
        <Button
          icon={<FormOutlined />}
          onClick={() => navigate('/kuesioner')}
          style={{
            borderRadius: 12,
            background: '#FAFAEE',
            color: '#225555',
            border: '2px solid #FAFAEE',
          }}
        >
          Kuesioner
        </Button>
      </Header>

      <Content style={{ padding: '20px 16px' }}>
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <ControlButtons
            isStreaming={isStreaming}
            isDetecting={isDetecting}
            onStart={() => void handleStart()}
            onStop={handleStop}
            onReset={handleReset}
          />
        </div>

        {noFaceTimeout && isDetecting && (
          <Alert
            type="warning"
            title="Wajah tidak terdeteksi. Pastikan pencahayaan cukup dan wajah menghadap kamera."
            showIcon
            closable
            style={{ marginBottom: 16, borderRadius: 12 }}
          />
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <WebcamPanel
              videoRef={videoRef}
              captureCanvasRef={captureCanvasRef}
              isStreaming={isStreaming}
              detectionResult={detectionResult}
              error={webcamError}
            />

            {detectionResult?.face_detected && detectionResult.emotion_label && (
              <Card
                style={{
                  marginTop: 12,
                  background: '#BBAA99',
                  border: '2px solid #225555',
                  borderRadius: 18,
                }}
                styles={{ body: { padding: '12px 16px' } }}
              >
                <EmotionBadge
                  emotion={detectionResult.emotion_label as EmotionLabel}
                  confidence={detectionResult.confidence}
                />
              </Card>
            )}
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="Rekomendasi Lagu"
              style={{ background: '#BBAA99', border: '2px solid #225555', borderRadius: 18 }}
              styles={{
                header: {
                  background: '#BBAA99',
                  color: '#225555',
                  borderBottom: '2px solid #225555',
                },
              }}
            >
              <RecommendationList
                recommendations={recommendations}
                isLoading={recLoading}
                error={recError}
                currentEmotion={currentEmotion}
              />
            </Card>
          </Col>
        </Row>
      </Content>

      <Footer
        style={{
          background: '#FAFAEE',
          textAlign: 'center',
          color: '#51463B',
          borderTop: '2px solid #225555',
          padding: '12px 24px',
        }}
      >
        Emotion-Based Song Recommendation — Aprilia's Thesis Project © 2026
      </Footer>
    </Layout>
  );
};
