import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Service worker do PWA (cache offline + push FCM em segundo plano).
// No iOS nativo (WKWebView/Capacitor) não existe Push API — não registrar o SW
// de push para evitar erros silenciosos e fluxos quebrados.
import {isIosApp} from './lib/isTwa';
if ("serviceWorker" in navigator && !isIosApp()) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// Captura antecipadamente o evento de instalação do Chrome/Android
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

(window as any).__AQUARIA_INSTALL_PROMPT__ = null;
const handleBeforeInstallPrompt = (e: Event) => {
  e.preventDefault();
  (window as any).__AQUARIA_INSTALL_PROMPT__ = e as BeforeInstallPromptEvent;
  console.log('[PWA] beforeinstallprompt capturado');
};
window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
