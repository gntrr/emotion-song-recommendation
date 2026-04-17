import { Alert, Button, Card, Divider, Form, Input, Rate, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { submitKuesioner } from '../services/api';
import type { KuesionerData } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const QUESTIONS = [
  {
    field: 'accuracy_rating',
    label: 'Akurasi Deteksi Emosi',
    desc: 'Seberapa akurat sistem mendeteksi emosi Anda?',
  },
  {
    field: 'relevance_rating',
    label: 'Relevansi Rekomendasi Lagu',
    desc: 'Seberapa relevan lagu yang direkomendasikan dengan emosi Anda?',
  },
  {
    field: 'ease_of_use_rating',
    label: 'Kemudahan Penggunaan',
    desc: 'Seberapa mudah sistem ini digunakan?',
  },
  {
    field: 'overall_rating',
    label: 'Kepuasan Keseluruhan',
    desc: 'Bagaimana kepuasan Anda secara keseluruhan?',
  },
];

export const KuesionerPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const data: KuesionerData = {
        accuracy_rating: values.accuracy_rating as number,
        relevance_rating: values.relevance_rating as number,
        ease_of_use_rating: values.ease_of_use_rating as number,
        overall_rating: values.overall_rating as number,
        notes: (values.notes as string) || undefined,
      };
      await submitKuesioner(data);
      setSubmitSuccess(true);
      form.resetFields();
    } catch {
      setSubmitError('Gagal menyimpan kuesioner. Pastikan backend berjalan di localhost:5000.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAFAEE',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 600 }}>
        <Card
          title={
            <Title level={4} style={{ margin: 0, color: '#225555' }}>
              Kuesioner Kepuasan Pengguna
            </Title>
          }
          style={{ background: '#BBAA99', border: '2px solid #225555', borderRadius: 18 }}
          styles={{
            header: {
              background: '#BBAA99',
              borderBottom: '2px solid #225555',
              borderRadius: '16px 16px 0 0',
            },
          }}
        >
          {submitSuccess ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Alert
                type="success"
                title="Terima kasih!"
                description="Kuesioner berhasil disimpan. Feedback Anda sangat berarti untuk pengembangan sistem."
                showIcon
                style={{ marginBottom: 20, borderRadius: 12 }}
              />
              <Space>
                <Button
                  type="primary"
                  onClick={() => navigate('/')}
                  style={{ borderRadius: 12 }}
                >
                  Kembali ke Beranda
                </Button>
                <Button onClick={() => setSubmitSuccess(false)} style={{ borderRadius: 12 }}>
                  Isi Lagi
                </Button>
              </Space>
            </div>
          ) : (
            <>
              <Text style={{ color: '#51463B', display: 'block', marginBottom: 20 }}>
                Silakan berikan penilaian Anda terhadap sistem ini menggunakan skala bintang (1–5).
              </Text>

              {submitError && (
                <Alert
                  type="error"
                  title={submitError}
                  showIcon
                  style={{ marginBottom: 16, borderRadius: 12 }}
                />
              )}

              <Form
                form={form}
                layout="vertical"
                onFinish={(values) => void handleSubmit(values)}
              >
                {QUESTIONS.map(q => (
                  <Form.Item
                    key={q.field}
                    name={q.field}
                    label={
                      <Text strong style={{ color: '#225555' }}>
                        {q.label}
                      </Text>
                    }
                    rules={[{ required: true, message: 'Wajib diisi' }]}
                    extra={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {q.desc}
                      </Text>
                    }
                  >
                    <Rate style={{ color: '#225555' }} />
                  </Form.Item>
                ))}

                <Divider style={{ borderColor: '#225555' }} />

                <Form.Item
                  name="notes"
                  label={
                    <Text strong style={{ color: '#225555' }}>
                      Catatan / Saran (opsional)
                    </Text>
                  }
                >
                  <TextArea
                    rows={4}
                    placeholder="Tuliskan saran atau catatan Anda…"
                    style={{ borderRadius: 12, border: '2px solid #225555' }}
                  />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isSubmitting}
                      size="large"
                      style={{ borderRadius: 18, border: '2px solid #225555' }}
                    >
                      Kirim Kuesioner
                    </Button>
                    <Button
                      onClick={() => navigate('/')}
                      size="large"
                      style={{ borderRadius: 18 }}
                    >
                      Kembali
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
