import React, { useEffect, useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const WHATSAPP_LINK = "https://chat.whatsapp.com/BuQ0JxIqiBQK4nf9upmYth";
const VISIT_COUNT_KEY = "aquaria_visit_count";
const SESSION_FLAG_KEY = "aquaria_this_session";
const DISMISS_KEY = "community_popup_dismissed";

interface CommunityPopupProps {
  isReady?: boolean;
}

export const CommunityPopup: React.FC<CommunityPopupProps> = ({ isReady = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Evita contar reloads dentro da mesma sessão/aba
    const alreadyThisSession = sessionStorage.getItem(SESSION_FLAG_KEY);
    if (!alreadyThisSession) {
      sessionStorage.setItem(SESSION_FLAG_KEY, "true");
      const current = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10);
      const next = current + 1;
      localStorage.setItem(VISIT_COUNT_KEY, String(next));

      if (next === 2) {
        const timeout = setTimeout(() => setIsOpen(true), 1500);
        return () => clearTimeout(timeout);
      }
    }
  }, [isReady]);

  const handleClose = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#3c352d]/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-[#fbf9f5] border border-[#e6e2d8] rounded-2xl shadow-[0_20px_60px_rgba(60,53,45,0.18)] p-6 sm:p-8 text-center">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-[#8c7f70] hover:text-[#3c352d] transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg sm:text-xl font-serif tracking-[0.1em] uppercase text-[#3c352d] mb-4 pr-6">
          Comunidade Aquar.IA
        </h2>

        <p className="text-sm text-[#5c544d] leading-relaxed mb-6">
          Entre para nossa comunidade <strong>Observatório Aquar.IA</strong> para
          acompanhar leituras do céu, insights dos astros, datas de eventuais
          oficinas ou encontros. Te aguardamos lá!
        </p>

        <div className="flex justify-center mb-6">
          <div className="p-3 bg-white rounded-xl border border-[#e6e2d8] shadow-sm">
            <QRCodeSVG
              value={WHATSAPP_LINK}
              size={180}
              level="M"
              bgColor="#ffffff"
              fgColor="#3c352d"
            />
          </div>
        </div>

        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClose}
          className="w-full py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-sans text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#25D366]/10 flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Entrar na comunidade
        </a>

        <p className="mt-4 text-[10px] text-[#8c7f70]">
          Link do grupo: <span className="font-mono break-all">{WHATSAPP_LINK}</span>
        </p>
      </div>
    </div>
  );
};
