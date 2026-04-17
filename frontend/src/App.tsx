import { ConfigProvider } from 'antd';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { HomePage } from './pages/HomePage';
import { KuesionerPage } from './pages/KuesionerPage';
import cartoonTheme from './theme/cartoonTheme';

export default function App() {
  return (
    <ConfigProvider theme={cartoonTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/kuesioner" element={<KuesionerPage />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
