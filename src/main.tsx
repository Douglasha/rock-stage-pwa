import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Registro automático do Service Worker para suporte offline PWA
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] Nova versão disponível. O app atualizará automaticamente.');
  },
  onOfflineReady() {
    console.log('[PWA] Conteúdo em cache. Pronto para uso 100% offline no palco!');
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
