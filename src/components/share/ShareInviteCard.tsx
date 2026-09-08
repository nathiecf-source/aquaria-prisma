import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface ShareInviteCardProps {
  onShare: () => void;
  onUnlock: () => void;
}

export const ShareInviteCard: React.FC<ShareInviteCardProps> = ({ onShare, onUnlock }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-8 p-5 rounded-xl border border-[#8c7f70]/20 bg-[#faf9f6] shadow-sm">
      {/* Mobile: titulo expansível / Desktop: sempre expandido */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="sm:hidden w-full flex items-center justify-between gap-3 text-left"
      >
        <h3 className="font-serif text-sm sm:text-base font-medium tracking-[0.12em] uppercase text-[#3c352d]">
          APROFUNDE SUAS ESTRELAS-GUIAS (NAKSHATRAS)
        </h3>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#8c7f70] shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#8c7f70] shrink-0" />
        )}
      </button>

      <div className="hidden sm:flex items-start gap-3">
        <div className="mt-0.5 w-8 h-8 rounded-full bg-[#ede9de] flex items-center justify-center shrink-0">
          <span className="text-[#8c6239] text-sm">✦</span>
        </div>
        <h3 className="font-serif text-sm sm:text-base font-medium tracking-[0.12em] uppercase text-[#3c352d] mb-2">
          APROFUNDE SUAS ESTRELAS-GUIAS (NAKSHATRAS)
        </h3>
      </div>

      <div className={`${isOpen ? "block" : "hidden"} sm:block mt-3 sm:mt-0`}>
        <div className="sm:pl-11">
          <p className="text-[11px] sm:text-xs text-[#6e6356] font-sans font-light leading-relaxed mb-4">
            Deseja guardar o resumo completo das estrelas que regem os seus planetas com um PDF
            exclusivo e personalizado?
          </p>
          <p className="text-[11px] sm:text-xs text-[#6e6356] font-sans font-light leading-relaxed mb-5">
            Compartilhe essa leitura nos seus Stories (Instagram ou TikTok) marcando{" "}
            <span className="text-[#8c6239] font-medium">@aquaria.app</span> para receber a senha de
            desbloqueio via Direct.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={onShare}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#3c352d] text-[#faf9f6] text-[11px] font-sans font-medium tracking-[0.1em] uppercase transition-colors hover:bg-[#2a2520]"
            >
              📸 Compartilhar Diagnóstico
            </button>
            <button
              onClick={onUnlock}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-[#8c7f70]/40 text-[#3c352d] text-[11px] font-sans font-medium tracking-[0.1em] uppercase transition-colors hover:bg-[#ede9de]/50"
            >
              🗝️ Já tenho a Senha (Inserir)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
