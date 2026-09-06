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

function parseItemBody(body: string): string {
  const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
  const out: string[] = [];
  for (const line of lines) {
    if (line.toLowerCase().startsWith("tema:")) {
      const theme = line.replace(/^tema[:：]\s*/i, "").trim();
      if (theme) out.push(`✦ ${theme}`);
    } else if (line.toLowerCase().startsWith("síntese terapêutica:")) {
      const synth = line.replace(/^síntese terapêutica[:：]\s*/i, "").trim();
      if (synth) out.push(synth);
    } else if (line) {
      out.push(line);
    }
  }
  return out.join("\n\n");
}

function parseDynamics(text: string): { sections: DynamicSection[]; fallback?: string } {
  if (!text || typeof text !== "string") return { sections: [] };

  const sectionRegex = /^✦\s*(Fluxos de Potência \(Yogas\)|Pontos de Lapidação \(Doshas\))[^\n]*$/gim;
  const matches: { title: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  let safety = 0;
  while ((m = sectionRegex.exec(text)) !== null && safety++ < 100) {
    matches.push({ title: m[1].trim(), index: m.index });
  }

  if (matches.length === 0) {
    return { sections: [], fallback: text };
  }

  const sections: DynamicSection[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
    const block = text.slice(start, end).trim();

    const lines = block.split("\n");
    const title = lines[0].replace(/^✦\s*/, "").trim();
    const introLines: string[] = [];
    const itemBlocks: string[] = [];
    let currentItem: string[] = [];
    let inItem = false;

    for (let j = 1; j < lines.length; j++) {
      const line = lines[j].trim();
      if (!line) continue;

      if (line.startsWith("[ Tag:")) {
        if (inItem && currentItem.length > 0) {
          itemBlocks.push(currentItem.join("\n"));
        }
        inItem = true;
        currentItem = [line];
        continue;
      }

      if (inItem) {
        currentItem.push(line);
      } else if (line.toLowerCase().startsWith("alinhamentos nativos") || line.toLowerCase().startsWith("padrões estruturais")) {
        // introdução
      } else {
        introLines.push(line);
      }
    }

    if (inItem && currentItem.length > 0) {
      itemBlocks.push(currentItem.join("\n"));
    }

    const items: DynamicItem[] = [];
    for (const itemText of itemBlocks) {
      const itemLines = itemText.split("\n");
      const titleMatch = itemLines[0].match(/^\[\s*Tag:\s*([^\]]+)\s*\]\s*(.*)$/i);
      if (!titleMatch) continue;
      const tag = titleMatch[1].trim();
      const titleRest = titleMatch[2].trim();
      const body = parseItemBody(itemLines.slice(1).join("\n"));
      items.push({
        id: `${title}-${tag}-${items.length}`,
        title: `[ ${tag} ] ${titleRest}`,
        body,
      });
    }

    if (items.length > 0) {
      sections.push({ title: `✦ ${title}`, intro: introLines.join(" "), items });
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
