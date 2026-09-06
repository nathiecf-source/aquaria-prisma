import React from "react";
import { Loader2 } from "lucide-react";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Accordion } from "./Accordion";

interface PlanetaryDynamicsPanelProps {
  isOpen: boolean;
  isLoading: boolean;
  text: string | null;
  onRefresh?: () => void;
}

interface DynamicItem {
  id: string;
  title: string;
  body: string;
}

interface DynamicSection {
  title: string;
  intro: string;
  items: DynamicItem[];
}

function parseDynamics(text: string): { sections: DynamicSection[]; fallback?: string } {
  const sections: DynamicSection[] = [];
  const sectionRegex = /^✦\s*(Fluxos de Potência \(Yogas\)|Pontos de Lapidação \(Doshas\))[^\n]*\n+([^\[]*?)(?=\n\[ Tag: |\n✦ |$)/gims;

  let m: RegExpExecArray | null;
  while ((m = sectionRegex.exec(text)) !== null) {
    const sectionTitle = m[1].trim();
    const intro = m[2].trim();
    const start = m.index + m[0].length;
    const nextMatch = sectionRegex.exec(text);
    const end = nextMatch ? nextMatch.index : text.length;
    const body = text.slice(start, end);
    sectionRegex.lastIndex = end; // volta para continuar daqui

    const items: DynamicItem[] = [];
    const itemRegex = /^\[\s*Tag:\s*([^\]]+)\s*\]\s*(.+)$/gim;
    let im: RegExpExecArray | null;
    while ((im = itemRegex.exec(body)) !== null) {
      const tag = im[1].trim();
      const titleLine = im[2].trim();
      const itemStart = im.index + im[0].length;
      const nextItem = itemRegex.exec(body);
      const itemEnd = nextItem ? nextItem.index : body.length;
      const itemBody = body.slice(itemStart, itemEnd).trim();

      const themeMatch = itemBody.match(/^Tema:\s*(.+)$/m);
      const theme = themeMatch ? themeMatch[1].trim() : "";

      const synthMatch = itemBody.match(/^Síntese Terapêutica:\s*(.+?)(?=\n\[|\n✦|$)/ims);
      const synthesis = synthMatch ? synthMatch[1].trim() : "";

      const fullBody = [theme ? `✦ ${theme}` : "", synthesis].filter(Boolean).join("\n\n");

      items.push({
        id: `${sectionTitle}-${tag}-${items.length}`,
        title: `[ ${tag} ] ${titleLine}`,
        body: fullBody,
      });

      if (nextItem) itemRegex.lastIndex = nextItem.index;
    }

    if (items.length > 0) {
      sections.push({ title: `✦ ${sectionTitle}`, intro, items });
    }
  }

  if (sections.length === 0) {
    return { sections: [], fallback: text };
  }

  return { sections };
}

export const PlanetaryDynamicsPanel: React.FC<PlanetaryDynamicsPanelProps> = ({
  isLoading,
  text,
  onRefresh,
}) => {
  const { sections, fallback } = React.useMemo(() => {
    return text ? parseDynamics(text) : { sections: [] };
  }, [text]);

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

      <div className="p-5 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-5 h-5 text-[#8c6239] animate-spin" />
            <p className="font-mono text-[10px] text-[#8c7f70] uppercase tracking-widest animate-pulse">
              Lendo a matriz estrutural do mapa...
            </p>
          </div>
        ) : fallback ? (
          <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-[#3c352d] prose-p:text-[#3c352d] prose-p:leading-relaxed prose-strong:text-[#5c4d66]">
            <Markdown rehypePlugins={[rehypeSanitize]}>{fallback}</Markdown>
          </div>
        ) : sections.length > 0 ? (
          sections.map((section, sIdx) => (
            <div key={sIdx}>
              <h4 className="font-serif text-[#3c352d] text-[13px] tracking-wide mb-2">
                {section.title}
              </h4>
              {section.intro && (
                <p className="font-sans text-[12px] text-[#8c7f70] leading-relaxed mb-3">
                  {section.intro}
                </p>
              )}
              <Accordion
                items={section.items.map(item => ({
                  id: item.id,
                  title: item.title,
                  content: (
                    <div className="prose prose-sm max-w-none prose-p:text-[#3c352d] prose-p:leading-relaxed prose-strong:text-[#5c4d66]">
                      <Markdown rehypePlugins={[rehypeSanitize]}>{item.body}</Markdown>
                    </div>
                  ),
                }))}
                defaultOpen={[]}
              />
            </div>
          ))
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
