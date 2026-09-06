import React from "react";
import { Loader2 } from "lucide-react";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

interface PlanetaryDynamicsPanelProps {
  isOpen: boolean;
  isLoading: boolean;
  text: string | null;
  onRefresh?: () => void;
}

export const PlanetaryDynamicsPanel: React.FC<PlanetaryDynamicsPanelProps> = ({
  isLoading,
  text,
  onRefresh,
}) => {
  return (
    <div className="w-full rounded-2xl border border-[#8c7f70]/15 bg-[#faf9f6] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#8c7f70]/10 bg-[#ede9de]/30">
        <h3 className="font-serif text-[#3c352d] text-sm tracking-wide">
          Dinâmicas Planetárias
        </h3>
        <p className="font-mono text-[9px] text-[#8c7f70] uppercase tracking-[0.2em] mt-0.5">
          Fluxos de Potência e Pontos de Lapidação
        </p>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-5 h-5 text-[#8c6239] animate-spin" />
            <p className="font-mono text-[10px] text-[#8c7f70] uppercase tracking-widest animate-pulse">
              Lendo a matriz estrutural do mapa...
            </p>
          </div>
        ) : text ? (
          <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-[#3c352d] prose-p:text-[#3c352d] prose-p:leading-relaxed prose-strong:text-[#5c4d66]">
            <Markdown rehypePlugins={[rehypeSanitize]}>{text}</Markdown>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="font-sans text-[12.5px] text-[#8c7f70]">
              Nenhuma leitura disponível no momento.
            </p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="font-mono text-[10px] text-[#8c6239] uppercase tracking-widest hover:text-[#3c352d] transition-colors"
              >
                ↺ Tentar novamente
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
