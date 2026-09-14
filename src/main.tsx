import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register Service Worker from vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register';

// Auto update SW
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] Có phiên bản cập nhật mới.');
  },
  onOfflineReady() {
    console.log('[PWA] Ứng dụng đã sẵn sàng hoạt động ngoại tuyến (Offline Ready).');
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
