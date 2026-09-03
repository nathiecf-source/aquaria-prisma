import React from "react";

interface ShareInviteCardProps {
  onShare: () => void;
  onUnlock: () => void;
}

export const ShareInviteCard: React.FC<ShareInviteCardProps> = ({ onShare, onUnlock }) => {
  return (
    <div className="mt-8 p-5 rounded-xl border border-[#8c7f70]/20 bg-[#faf9f6] shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-8 h-8 rounded-full bg-[#ede9de] flex items-center justify-center shrink-0">
          <span className="text-[#8c6239] text-sm">✦</span>
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-sm sm:text-base font-medium tracking-[0.12em] uppercase text-[#3c352d] mb-2">
            APROFUNDE SUAS ESTRELAS-GUIAS (NAKSHATRAS)
          </h3>
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
