import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Card, Tag, Typography } from 'antd';
import React, { useRef, useState } from 'react';

import type { Song } from '../../types';

const { Text, Title } = Typography;

interface SongCardProps {
  song: Song;
  index: number;
}

export const SongCard: React.FC<SongCardProps> = ({ song, index }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePreview = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      void audioRef.current.play();
    }
    setIsPlaying(prev => !prev);
  };

  return (
    <Card
      style={{
        marginBottom: 12,
        background: '#EDE8DD',
        border: '2px solid #225555',
        borderRadius: 18,
      }}
      styles={{ body: { padding: '12px 16px' } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag
            style={{
              background: '#225555',
              color: '#FAFAEE',
              border: 'none',
              borderRadius: 12,
              minWidth: 26,
              textAlign: 'center',
              fontWeight: 700,
            }}
          >
            {index + 1}
          </Tag>
          <Title level={5} style={{ margin: 0, color: '#225555', fontSize: 14 }} ellipsis>
            {song.track_name}
          </Title>
        </div>

        <Text style={{ color: '#51463B', fontSize: 13 }}>{song.artist_name}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Album: {song.album_name}
        </Text>
        <Text style={{ fontSize: 12, color: '#225555' }}>
          Popularitas: {song.popularity}/100
        </Text>

        {song.preview_url && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Button
              type="default"
              size="small"
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={togglePreview}
              style={{ borderRadius: 12, border: '2px solid #225555' }}
            >
              {isPlaying ? 'Pause' : 'Preview 30s'}
            </Button>
            <audio
              ref={audioRef}
              src={song.preview_url}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
        )}

        {song.spotify_embed_url && (
          <iframe
            src={song.spotify_embed_url}
            width="100%"
            height="84"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            style={{ borderRadius: 12, marginTop: 8, border: '2px solid #225555' }}
            title={`Spotify: ${song.track_name}`}
          />
        )}
      </div>
    </Card>
  );
};
