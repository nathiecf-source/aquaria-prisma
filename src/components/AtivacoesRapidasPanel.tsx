import React from "react";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Loader2, Zap } from "lucide-react";

interface RapidActivation {
  type: string;
  planet: string;
  description: string;
  aspect?: string;
  target?: string;
  house?: number;
  sign?: string;
}

interface AtivacoesRapidasPanelProps {
  activations?: RapidActivation[];
  reading?: string;
  isLoading?: boolean;
}

const typeLabel = (type: string): string => {
  switch (type) {
    case "invasao":
      return "Entrada no território";
    case "toque-no-regente":
      return "Toque no regente";
    case "senhor-em-movimento":
      return "Regente em movimento";
    default:
      return type;
  }
};

export const AtivacoesRapidasPanel: React.FC<AtivacoesRapidasPanelProps> = ({
  activations,
  reading,
  isLoading,
}) => {
  const hasActivations = (activations || []).length > 0;

  return (
    <div className="mt-6 rounded-xl border border-[#5c4d66]/15 bg-[#f9f7f3] p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-4 w-4 text-[#5c4d66]" />
        <h4 className="font-serif text-sm uppercase tracking-widest text-[#3c352d]">
          Ativações Rápidas
        </h4>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-[#8c7f70]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-mono text-xs uppercase tracking-wider">Mapeando janelas de ignição...</span>
        </div>
      ) : hasActivations ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {(activations || []).map((a, idx) => (
              <div
                key={idx}
                className="rounded-full border border-[#5c4d66]/10 bg-[#5c4d66]/5 px-3 py-1.5 text-xs text-[#3c352d]"
              >
                <span className="font-medium">{a.planet}</span>
                <span className="mx-1.5 text-[#8c7f70]">·</span>
                <span className="text-[#5c4d66]">{typeLabel(a.type)}</span>
                {a.house ? (
                  <span className="ml-1.5 text-[#8c7f70]">Casa {a.house}</span>
                ) : null}
              </div>
            ))}
          </div>
          {reading && (
            <div className="max-w-none text-sm leading-relaxed text-[#5c544d]">
              <Markdown
                rehypePlugins={[rehypeSanitize]}
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-[#3c352d]">{children}</strong>,
                }}
              >
                {reading}
              </Markdown>
            </div>
          )}
        </>
      ) : (
        <p className="py-2 text-sm text-[#8c7f70]">
          Nenhuma ativação rápida ativa no momento. O céu ainda aquece o palco do ano.
        </p>
      )}
    </div>
  );
};
