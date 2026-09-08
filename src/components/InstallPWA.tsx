import React, { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window as any).standalone === true;
    const iOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOSDevice);

    if (isStandalone) return;

    // No iOS, o evento beforeinstallprompt não existe; mostramos banner manualmente.
    if (iOSDevice) {
      setShowBanner(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("[PWA] Instalação aceita");
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleIOSClick = () => {
    setShowBanner(false);
    setShowIOSModal(true);
  };

  if (!showBanner && !showIOSModal) return null;

  return (
    <>
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-20 sm:max-w-sm z-50 p-4 rounded-2xl bg-[#3c352d] text-[#f4f1eb] shadow-2xl border border-[#c5a880]/30 flex items-start gap-3">
          <div className="mt-0.5">
            <Download className="w-5 h-5 text-[#c5a880]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium leading-snug">
              Baixar App Aquar.IA
            </p>
            <p className="text-[10px] text-[#c5a880] mt-0.5">
              Instale na tela inicial para acessar com um toque.
            </p>
            <div className="flex items-center gap-2 mt-3">
              {isIOS ? (
                <button
                  onClick={handleIOSClick}
                  className="px-4 py-2 rounded-lg bg-[#8c6239] hover:bg-[#6b4a2b] text-white text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  Instalar
                </button>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="px-4 py-2 rounded-lg bg-[#8c6239] hover:bg-[#6b4a2b] text-white text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  Baixar
                </button>
              )}
              <button
                onClick={() => setShowBanner(false)}
                className="px-4 py-2 rounded-lg border border-[#c5a880]/30 text-[#c5a880] hover:bg-[#f4f1eb]/10 text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Depois
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-[#c5a880] hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showIOSModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#3c352d]/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl shadow-[0_20px_60px_rgba(60,53,45,0.18)] p-6 sm:p-8">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-2 text-[#8c7f70] hover:text-[#3c352d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-serif tracking-[0.12em] uppercase text-[#3c352d] mb-4">
              Instalar no iPhone
            </h2>

            <ol className="space-y-3 text-sm text-[#4a3f35] leading-relaxed mb-6 list-decimal pl-4">
              <li>Toque no ícone de Compartilhar <Share className="inline w-4 h-4 mx-1 text-[#8c6239]" /> na barra do Safari.</li>
              <li>Role e selecione <strong>Adicionar à Tela de Início</strong>.</li>
              <li>Toque em <strong>Adicionar</strong> para confirmar.</li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
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
