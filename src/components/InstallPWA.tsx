import React, { useEffect, useState } from "react";
import { Download, Smartphone, Apple, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "aquaria_pwa_dismissed";

interface InstallPWAProps {
  userProfile?: any;
  onMarkSeen?: () => void;
}

export const InstallPWA: React.FC<InstallPWAProps> = ({ userProfile, onMarkSeen }) => {
  const [localDeferredPrompt, setLocalDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showAndroidFallback, setShowAndroidFallback] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window as any).standalone === true;
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    let wasDismissed = false;
    try {
      wasDismissed = localStorage.getItem(DISMISS_KEY) === "true";
    } catch {}

    if (!wasDismissed && userProfile?.has_seen_pwa === true) {
      wasDismissed = true;
    }

    setIsStandalone(standalone);
    setIsIOSDevice(iOS);
    setDismissed(wasDismissed);

    // Usa o prompt capturado em main.tsx, se disponível
    const globalPrompt = (window as any).__AQUARIA_INSTALL_PROMPT__ as BeforeInstallPromptEvent | null;
    if (globalPrompt) {
      setLocalDeferredPrompt(globalPrompt);
    }

    // Também escuta eventos futuros (caso o prompt seja disparado depois)
    const handler = (e: Event) => {
      e.preventDefault();
      setLocalDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const markDismissed = () => {
    setShowModal(false);
    setShowIOSInstructions(false);
    setShowAndroidFallback(false);
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {}
    onMarkSeen?.();
  };

  const handleAndroidInstall = async () => {
    const prompt = localDeferredPrompt || (window as any).__AQUARIA_INSTALL_PROMPT__ as BeforeInstallPromptEvent | null;

    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        setLocalDeferredPrompt(null);
        (window as any).__AQUARIA_INSTALL_PROMPT__ = null;
        setShowModal(false);
      }
    } else {
      // Fallback: abre instruções manuais
      setShowAndroidFallback(true);
    }
  };

  const openModal = () => {
    setShowAndroidFallback(false);
    setShowIOSInstructions(false);
    setShowModal(true);
  };

  const handleIOSClick = () => {
    setShowModal(false);
    setShowIOSInstructions(true);
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Botão fixo no rodapé */}
      {!dismissed && (
        <button
          onClick={openModal}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3c352d] text-[#f4f1eb] shadow-lg border border-[#c5a880]/30 text-xs font-bold uppercase tracking-widest hover:bg-[#5c4d66] transition-colors"
        >
          <Download className="w-4 h-4" />
          Baixar app
        </button>
      )}

      {/* Modal com caminhos Android / iOS */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#3c352d]/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl shadow-[0_20px_60px_rgba(60,53,45,0.18)] p-6 sm:p-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-[#8c7f70] hover:text-[#3c352d] transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-serif tracking-[0.12em] uppercase text-[#3c352d] mb-2">
              Instalar Aquar.IA
            </h2>
            <p className="text-xs text-[#6e6356] mb-6 leading-relaxed">
              Escolha seu dispositivo para continuar com a instalação.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleAndroidInstall}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[#e6e2d8] bg-white hover:bg-[#ede9de] transition-colors text-left"
              >
                <Smartphone className="w-5 h-5 text-[#8c6239]" />
                <div>
                  <p className="text-sm font-medium text-[#3c352d]">Android / Chrome</p>
                  <p className="text-[10px] text-[#6e6356]">Instale direto pelo navegador.</p>
                </div>
              </button>

              <button
                onClick={handleIOSClick}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[#e6e2d8] bg-white hover:bg-[#ede9de] transition-colors text-left"
              >
                <Apple className="w-5 h-5 text-[#3c352d]" />
                <div>
                  <p className="text-sm font-medium text-[#3c352d]">iPhone / iPad</p>
                  <p className="text-[10px] text-[#6e6356]">Veja as instruções para Safari.</p>
                </div>
              </button>
            </div>

            <button
              onClick={markDismissed}
              className="w-full mt-6 py-2.5 rounded-lg border border-[#e6e2d8] text-[#8c7f70] text-xs font-bold uppercase tracking-widest hover:bg-[#ede9de] transition-colors"
            >
              Não quero instalar agora
            </button>
          </div>
        </div>
      )}

      {/* Fallback Android / Chrome */}
      {showAndroidFallback && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-[#3c352d]/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl shadow-[0_20px_60px_rgba(60,53,45,0.18)] p-6 sm:p-8">
            <button
              onClick={() => setShowAndroidFallback(false)}
              className="absolute top-4 right-4 p-2 text-[#8c7f70] hover:text-[#3c352d] transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-serif tracking-[0.12em] uppercase text-[#3c352d] mb-4">
              Instalar no Android
            </h2>

            <ol className="space-y-3 text-sm text-[#4a3f35] leading-relaxed mb-6 list-decimal pl-4">
              <li>Toque no menu <strong>⋮</strong> (três pontinhos) no canto superior direito do Chrome.</li>
              <li>Selecione <strong>Adicionar à tela inicial</strong> ou <strong>Instalar app</strong>.</li>
              <li>Confirme tocando em <strong>Adicionar</strong> ou <strong>Instalar</strong>.</li>
            </ol>

            <button
              onClick={() => setShowAndroidFallback(false)}
              className="w-full py-2.5 rounded-lg bg-[#3c352d] text-[#f4f1eb] text-xs font-bold uppercase tracking-widest hover:bg-[#5c4d66] transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de instruções iOS */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-[#3c352d]/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl shadow-[0_20px_60px_rgba(60,53,45,0.18)] p-6 sm:p-8">
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-4 right-4 p-2 text-[#8c7f70] hover:text-[#3c352d] transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-serif tracking-[0.12em] uppercase text-[#3c352d] mb-4">
              Instalar no iPhone
            </h2>

            <ol className="space-y-3 text-sm text-[#4a3f35] leading-relaxed mb-6 list-decimal pl-4">
              <li>Toque no ícone de Compartilhar na barra do Safari.</li>
              <li>Role e selecione <strong>Adicionar à Tela de Início</strong>.</li>
              <li>Toque em <strong>Adicionar</strong> para confirmar.</li>
            </ol>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-2.5 rounded-lg bg-[#3c352d] text-[#f4f1eb] text-xs font-bold uppercase tracking-widest hover:bg-[#5c4d66] transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
