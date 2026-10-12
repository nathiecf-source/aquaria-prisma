import React from "react";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Loader2, Sparkles } from "lucide-react";

interface ProfectionLord {
  name: string;
  source?: string;
  sign?: string;
  house?: number;
}

interface SenhorDoAnoCardProps {
  age: number;
  primaryLord: string;
  profectedHouse: number;
  sign: string;
  source?: string;
  lords?: ProfectionLord[];
  reading?: string;
  isLoading?: boolean;
}

const sourceLabel = (source?: string): string => {
  switch (source) {
    case "natal":
      return "a partir do mapa natal";
    case "solar-return":
      return "a partir da Revolução Solar";
    case "ruler":
      return "a partir da regência tradicional";
    default:
      return "";
  }
};

export const SenhorDoAnoCard: React.FC<SenhorDoAnoCardProps> = ({
  age,
  primaryLord,
  profectedHouse,
  sign,
  source,
  lords,
  reading,
  isLoading,
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const hasReading = !!reading && reading.trim().length > 0;

  const coLords = (lords || []).filter((l) => l.name !== primaryLord);

  return (
    <div className="mb-6 rounded-xl border border-[#8c6239]/20 bg-gradient-to-br from-[#f9f6f0] to-[#f4f1eb] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8c6239]/10 text-[#8c6239]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#8c6239]">
            ✦ Profecção — {age} anos
          </p>
          <h3 className="mt-1 font-serif text-lg font-medium text-[#3c352d]">
            O Regente do Ano: {primaryLord} <span className="text-[#8c7f70]">(Casa {profectedHouse})</span>
          </h3>
          <p className="mt-1 text-sm text-[#5c544d]">
            Casa {profectedHouse} em {sign}
            {source ? ` — ${sourceLabel(source)}` : ""}
          </p>
          {coLords.length > 0 && (
            <p className="mt-1 text-xs text-[#8c7f70]">
              Co-regentes: {coLords.map((l) => `${l.name}${l.sign ? ` (${l.sign})` : ""}`).join(", ")}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 flex items-center gap-2 text-[#8c7f70]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-mono text-xs uppercase tracking-wider">Sincronizando com o ciclo anual...</span>
        </div>
      ) : hasReading ? (
        <div className="mt-4">
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs font-mono uppercase tracking-wider text-[#8c6239] hover:text-[#3c352d] transition-colors"
          >
            {expanded ? "Recolher leitura" : "Ler a leitura do ano"}
          </button>
          {expanded && (
            <div className="mt-3 max-w-none text-sm leading-relaxed text-[#5c544d]">
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
        </div>
      ) : null}
    </div>
  );
};
