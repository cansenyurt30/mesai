import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Service worker: uygulamayı önbelleğe alır, yeni sürüm gelince kendiliğinden günceller.
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Cihazda "hareketi azalt" açıksa animasyonlar otomatik sadeleşir */}
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
);
