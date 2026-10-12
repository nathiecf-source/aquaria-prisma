import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// O service worker do PWA é carregado via OneSignalSDKWorker.js (que importa /sw.js).
// O registro manual é desnecessário para não conflitar com o OneSignal.

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
