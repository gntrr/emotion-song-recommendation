import { PlayCircleOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import React from 'react';

interface ControlButtonsProps {
  isDetecting: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  isDetecting,
  onStart,
  onStop,
  onReset,
}) => (
  <Space wrap>
    {!isDetecting ? (
      <Button
        type="primary"
        icon={<PlayCircleOutlined />}
        onClick={onStart}
        size="large"
        style={{ borderRadius: 18, border: '2px solid #225555' }}
      >
        Mulai Deteksi
      </Button>
    ) : (
      <Button
        danger
        icon={<StopOutlined />}
        onClick={onStop}
        size="large"
        style={{ borderRadius: 18 }}
      >
        Hentikan Deteksi
      </Button>
    )}
    <Button
      icon={<ReloadOutlined />}
      onClick={onReset}
      size="large"
      style={{ borderRadius: 18, border: '2px solid #225555' }}
    >
      Reset
    </Button>
  </Space>
);
