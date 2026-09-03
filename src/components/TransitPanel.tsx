import React from "react";
import { Loader2, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { SenhorDoAnoCard } from "./SenhorDoAnoCard";
import { AtivacoesRapidasPanel } from "./AtivacoesRapidasPanel";

export interface ActiveTransit {
  planetaTransito: string;
  planetaNatal: string;
  casaNatal: number;
  aspecto: string;
  ritmoTempo: string;
}

interface TransitPanelProps {
  isOpen: boolean;
  isLoading: boolean;
  text: string | null;
  dashaText?: string | null;
  isLoadingDashas?: boolean;
  profile: any;
  userId?: string | null;
  onActiveTransitChange: (t: ActiveTransit | null) => void;
  onClose: () => void;
  onRefresh?: () => void;
  onRefreshDashas?: () => void;
  age?: number;
  profectionData?: any;
  rapidActivationsData?: any;
  isFetchingProfection?: boolean;
  isFetchingRapidActivations?: boolean;
}

const PLANET_ICONS: Record<string, string> = {
  Sol: "☀️", Lua: "🌙", "Mercúrio": "☿", "Vênus": "♀️", Marte: "♂️",
  "Júpiter": "♃", Saturno: "♄", Urano: "⛢", Netuno: "♆", "Plutão": "♇",
};

const EXCLUSIONS = /Nodo|Node|Lilith|Ascendente|Ascendant|Meio do Céu|MC|Parte|Fortuna|Rahu|Ketu/i;

const HOUSE_SPHERES: Record<number, string> = {
  1:  "Esfera da Identidade e Presença Física",
  2:  "Esfera dos Valores e Recursos Naturais",
  3:  "Esfera da Mente e das Trocas Imediatas",
  4:  "Esfera do Lar e Fundações Emocionais",
  5:  "Esfera da Criatividade e Expressão Pessoal",
  6:  "Esfera da Rotina, Corpo e Serviço",
  7:  "Esfera do Outro e dos Relacionamentos",
  8:  "Esfera das Sombras, Entregas e Renascimentos",
  9:  "Esfera das Visões e Expansão de Consciência",
  10: "Esfera da Realização e Legado",
  11: "Esfera do Coletivo e Visão de Futuro",
  12: "Esfera do Inconsciente e Espiritualidade",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ParsedTransit {
  planetaTransito: string;
  planetaNatal: string;
  casaNatal: number;
  aspecto: string;
  ritmoTempo: string;
  tituloLudico: string;
  blocks: { label: string; content: string }[];
  rawTitle: string;
}

// ─── Parser de Markdown ───────────────────────────────────────────────────────

function parseTransitsFromMarkdown(text: string): ParsedTransit[] {
  const result: ParsedTransit[] = [];
  const sections = text.split(/(?=####\s)/);

  for (const section of sections) {
    if (!section.trim() || !section.startsWith("####")) continue;

    const lines = section.split("\n");
    const titleLine = lines[0].replace(/^####\s*/, "").trim();

    // Padrões aceitos (com ou sem "(Casa X)", com "o seu" ou "a sua"):
    // ♄ **Saturno** em Quadratura com o seu **Marte Natal**
    // ♆ **Netuno** em Quadratura com a sua **Lua Natal**
    // ♄ **Saturno** em Quadratura com o seu **Marte Natal** (Casa 5)  ← formato legado
    const titleMatch =
      titleLine.match(/\*\*([^*]+)\*\*\s+em\s+(\S+)\s+com\s+(?:o\s+seu|a\s+sua)\s+\*\*([^\s*]+)\s*Natal\*\*(?:\s+\(Casa\s+(\d+)\))?/i) ||
      titleLine.match(/\*\*([^*]+)\*\*\s+em\s+(\S+)\s+com\s+(?:o\s+seu|a\s+sua)\s+\*\*([^*]+?)\s*Natal\*\*(?:\s+\(Casa\s+(\d+)\))?/i) ||
      titleLine.match(/([A-Za-zÀ-ÿ]+)\s+em\s+([A-Za-zÀ-ÿ]+)\s+com\s+(?:o\s+seu|a\s+sua)\s+([A-Za-zÀ-ÿ]+)\s+Natal(?:\s+\(Casa\s+(\d+)\))?/i);

    if (!titleMatch) {
      console.warn("[TransitPanel] titleLine sem match:", JSON.stringify(titleLine));
      continue;
    }

    const planetaTransito = titleMatch[1].trim();
    const aspecto         = titleMatch[2].trim();
    const planetaNatal    = titleMatch[3].trim();
    const casaNatal       = parseInt(titleMatch[4] ?? "0", 10);

    if (EXCLUSIONS.test(planetaTransito) || EXCLUSIONS.test(planetaNatal)) continue;

    const body = lines.slice(1).join("\n");

    // Extrai título lúdico da linha "> **Título:** ..."
    let tituloLudico = "";
    const tituloMatch = body.match(/^>\s*\*\*T[íi]tulo[:：]?\*\*\s*(.+)/m);
    if (tituloMatch) tituloLudico = tituloMatch[1].trim();

    // Extrai blocos **Label:** conteúdo (ignora "Título" que é metadata)
    const LABEL_SKIP = /^(T[íi]tulo)/i;
    const blockRegex = /\*\*([^*]+)\*\*[:\s]*([\s\S]*?)(?=\n\*\*[^*]+\*\*[:\s]|\n---|\n####|$)/g;
    const blocks: { label: string; content: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = blockRegex.exec(body)) !== null) {
      const label = m[1].trim();
      const content = m[2].trim();
      if (content && !LABEL_SKIP.test(label)) blocks.push({ label, content });
    }

    // Extrai ritmo_tempo: primeiro do bloco "Tempo de Maturação", depois de "Integração"
    let ritmoTempo = "";
    const maturBlock = blocks.find(b => b.label.includes("Matura"));
    if (maturBlock) {
      const first = maturBlock.content.split(".")[0].trim();
      if (first) ritmoTempo = first;
    }
    if (!ritmoTempo) {
      const intBlock = blocks.find(b => b.label.includes("Integra"));
      if (intBlock) {
        const rm = intBlock.content.match(/\*((?:Longo|M[eé]dio|Curto) prazo[^*]*)\*/);
        if (rm) ritmoTempo = rm[1];
      }
    }

    result.push({ planetaTransito, planetaNatal, casaNatal, aspecto, ritmoTempo, tituloLudico, blocks, rawTitle: titleLine });
  }

  return result;
}

// ─── Helpers de cor ───────────────────────────────────────────────────────────

function getRitmoColor(ritmo: string): string {
  if (ritmo.startsWith("Longo")) return "text-[#5c4d66]";
  if (ritmo.startsWith("M")) return "text-[#8c6239]";
  return "text-[#3c6e4a]";
}

function getRitmoBadge(ritmo: string): string {
  if (ritmo.startsWith("Longo")) return "bg-[#3c2e4a]/10 text-[#5c4d66] border-[#5c4d66]/20";
  if (ritmo.startsWith("M")) return "bg-[#8c6239]/10 text-[#8c6239] border-[#8c6239]/20";
  return "bg-[#3c6e4a]/10 text-[#3c6e4a] border-[#3c6e4a]/20";
}

// ─── Parser e componente para Dashas ─────────────────────────────────────────

interface DashaSection {
  title: string;
  content: string;
  planet?: string;
  index: number;
}

const TOP_LEVEL_DASHA_HEADINGS = [
  "sua fase atual",
  "o grande oceano",
  "a correnteza",
  "a onda",
  "o desafio",
  "a sintese",
];

function normalizeHeading(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function parseDashaSections(text: string): DashaSection[] {
  const sections: DashaSection[] = [];
  // Remove o título H3 inicial
  const body = text.replace(/^###\s.*\n+/, "").trim();
  const blocks = body.split(/\n(?=\*\*[^*]+\*\*)/);

  let currentSection: { title: string; lines: string[] } | null = null;
  let index = 0;

  blocks.forEach((block) => {
    const lines = block.trim().split("\n");
    const titleMatch = lines[0].match(/^\*\*([^*]+)\*\*/);
    const title = titleMatch ? titleMatch[1].trim() : "";
    const normalizedTitle = normalizeHeading(title);

    if (TOP_LEVEL_DASHA_HEADINGS.includes(normalizedTitle)) {
      // Fecha a seção anterior, se existir
      if (currentSection) {
        const content = currentSection.lines.slice(1).join("\n").trim();
        const planetMatch = content.match(/^([A-Za-zÀ-ÿ\s]+):\s*/);
        const planet = planetMatch ? planetMatch[1].trim() : undefined;
        sections.push({
          title: currentSection.title,
          content,
          planet,
          index: ++index,
        });
      }
      currentSection = { title, lines };
    } else if (currentSection) {
      // Subtítulo ou conteúdo interno: anexa à seção atual
      currentSection.lines.push(...lines);
    } else {
      // Conteúdo antes do primeiro título reconhecido — inicia uma seção genérica
      currentSection = { title: title || "Introdução", lines };
    }
  });

  // Fecha a última seção
  if (currentSection) {
    const content = currentSection.lines.slice(1).join("\n").trim();
    const planetMatch = content.match(/^([A-Za-zÀ-ÿ\s]+):\s*/);
    const planet = planetMatch ? planetMatch[1].trim() : undefined;
    sections.push({
      title: currentSection.title,
      content,
      planet,
      index: currentSection.title ? ++index : 0,
    });
  }

  return sections;
}

function splitDashaGeography(content: string): { body: string; geography?: string } {
  const match = content.match(/\n(?:\*\*)?A geografia de ([^\n]+) no mapa natal(?:\*\*)?\n/);
  if (!match || match.index === undefined) return { body: content };
  const body = content.slice(0, match.index).trim();
  const rawHeading = match[0].trim().replace(/^\*\*|\*\*$/g, "");
  const heading = `**${rawHeading}**`;
  const geography = heading + "\n\n" + content.slice(match.index + match[0].length).trim();
  return { body, geography };
}

const DashaAccordion: React.FC<{ section: DashaSection }> = ({ section }) => {
  const [expanded, setExpanded] = React.useState(true);
  const icon = section.planet ? (PLANET_ICONS[section.planet] || "✦") : "";
  const { body, geography } = splitDashaGeography(section.content);

  return (
    <div className="rounded-xl border border-[#8c7f70]/15 bg-[#faf9f6] hover:bg-[#f4f1eb]/60 transition-all duration-300 overflow-hidden mb-3">
      <button
        onClick={() => setExpanded(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-[#8c7f70] text-[11px] tabular-nums flex-shrink-0">{section.index}.</span>
          {icon && <span className="text-base leading-none flex-shrink-0">{icon}</span>}
          <span className="font-serif text-[#3c352d] text-[13.5px] leading-snug">
            {section.title}
          </span>
        </div>
        <span className="text-[#8c7f70] flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-5 pb-5 border-t border-[#8c7f70]/10 pt-4">
          <div className="prose prose-sm max-w-none text-[#5c544d] font-sans leading-relaxed text-[13.5px]">
            <Markdown
              rehypePlugins={[rehypeSanitize]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-[#3c352d]">{children}</strong>,
                em: ({ children }) => <em className="italic text-[#8c6239]/80">{children}</em>,
              }}>
              {body}
            </Markdown>
            {geography && (
              <div className="mt-4 p-4 rounded-xl border border-[#8c7f70]/20 bg-[#f4f1eb]/50">
                <Markdown
                  rehypePlugins={[rehypeSanitize]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-[#3c352d]">{children}</strong>,
                    em: ({ children }) => <em className="italic text-[#8c6239]/80">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                    li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
                  }}>
                  {geography}
                </Markdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Campo de Insight interativo ────────────────────────────────────────────

const InsightField: React.FC<{ transitKey: string; userId: string | null }> = ({ transitKey, userId }) => {
  const [text, setText] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved]   = React.useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      if (isSupabaseConfigured && userId) {
        await (supabase as any)
          .from("user_insights")
          .insert({ user_id: userId, insight_text: text.trim(), transit_key: transitKey });
      } else {
        const stored = JSON.parse(localStorage.getItem("user_insights") || "[]");
        stored.unshift({ id: Date.now(), user_id: userId || "anon", insight_text: text.trim(), transit_key: transitKey, created_at: new Date().toISOString() });
        localStorage.setItem("user_insights", JSON.stringify(stored));
      }
      setText("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("[InsightField] Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <p className="font-mono text-[9px] uppercase tracking-widest text-[#8c7f70]">
        Sinta, volte e anote
      </p>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setSaved(false); }}
        rows={3}
        placeholder="Sinta, volte e anote o que acessou..."
        className="w-full resize-none rounded-lg border border-[#8c7f70]/20 bg-[#faf9f6] px-4 py-3 text-[13px] font-sans text-[#3c352d] placeholder-[#8c7f70]/50 focus:outline-none focus:border-[#8c6239]/40 focus:bg-white transition-all leading-relaxed"
      />
      <div className="flex items-center justify-between">
        {saved ? (
          <span className="font-mono text-[10px] text-[#3c6e4a] tracking-wider">✓ Insight salvo</span>
        ) : (
          <span />
        )}
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest bg-[#3c352d] text-[#f4e8d0] hover:bg-[#5c4d3d] disabled:opacity-30 transition-all"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
          Salvar Insight
        </button>
      </div>
    </div>
  );
};

// ─── Componente de Acordeão de Trânsito ───────────────────────────────────────

const TransitAccordion: React.FC<{
  transit: ParsedTransit;
  index: number;
  isActive: boolean;
  userId: string | null;
  onActivate: (t: ActiveTransit | null) => void;
}> = ({ transit, index, isActive, userId, onActivate }) => {
  const [expanded, setExpanded] = React.useState(false);

  const icon      = PLANET_ICONS[transit.planetaTransito] || "✦";
  const natalIcon = PLANET_ICONS[transit.planetaNatal]    || "";

  const payload: ActiveTransit = {
    planetaTransito: transit.planetaTransito,
    planetaNatal:    transit.planetaNatal,
    casaNatal:       transit.casaNatal,
    aspecto:         transit.aspecto,
    ritmoTempo:      transit.ritmoTempo,
  };

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    try { onActivate(next ? payload : null); } catch (_) {}
  };

  const handleMouseEnter = () => { try { onActivate(payload); } catch (_) {} };
  const handleMouseLeave = () => { if (!expanded) try { onActivate(null); } catch (_) {} };

  return (
    <div
      className={`rounded-xl border transition-all duration-300 overflow-hidden
        ${isActive
          ? "border-[#8c6239]/40 shadow-[0_0_20px_rgba(140,98,57,0.10)]"
          : "border-[#8c7f70]/15"
        }
        ${expanded ? "bg-[#f4f1eb]" : "bg-[#faf9f6] hover:bg-[#f4f1eb]/60"}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Closed state — título lúdico */}
      <button
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-[#8c7f70] text-[11px] tabular-nums flex-shrink-0">{index}.</span>
          <span className="text-base leading-none flex-shrink-0">{icon}</span>
          <span className="font-serif text-[#3c352d] text-[13.5px] leading-snug">
            {transit.tituloLudico || `${transit.planetaTransito} em ${transit.aspecto} com ${transit.planetaNatal} Natal`}
          </span>
        </div>
        <div className="flex-shrink-0 text-[#8c7f70]">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Open state — detalhes */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-5 pb-5 space-y-4 border-t border-[#8c7f70]/10 pt-4">

          {/* Cabeçalho técnico silencioso */}
          <div className="flex items-center gap-2 flex-wrap opacity-60">
            <span className="text-sm">{icon}</span>
            <span className="font-mono text-[10px] text-[#5c544d] italic">
              {transit.planetaTransito} em {transit.aspecto} com {natalIcon} {transit.planetaNatal} Natal
            </span>
            {transit.ritmoTempo && (
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getRitmoBadge(transit.ritmoTempo)}`}>
                {transit.ritmoTempo.split(".")[0]}
              </span>
            )}
          </div>

          {/* Blocos terapêuticos com estilos por tipo */}
          {transit.blocks
            .filter(block => !block.label.includes("Costura"))
            .map((block, idx) => {
            const lbl = block.label;
            const isPratica    = lbl.includes("Pr") && lbl.includes("tica");
            const isMaturacao  = lbl.includes("Matura") || lbl.includes("Tempo");
            const isIntegracao = lbl.includes("Integra");
            const isGeografia  = lbl.includes("Geografia");
            const isDesafio    = lbl.includes("Desafio");

            let wrapClass = "";
            let labelClass = "text-[#8c7f70]";

            if (isPratica) {
              wrapClass = "rounded-xl bg-[#3c352d]/4 border border-[#3c352d]/10 px-4 py-4";
              labelClass = "text-[#3c352d]";
            } else if (isMaturacao) {
              wrapClass = "rounded-lg bg-[#5c4d66]/6 border border-[#5c4d66]/15 px-4 py-3";
              labelClass = "text-[#5c4d66]";
            } else if (isIntegracao) {
              wrapClass = "rounded-lg bg-[#3c6e4a]/5 border border-[#3c6e4a]/15 px-4 py-3";
              labelClass = "text-[#3c6e4a]";
            } else if (isGeografia) {
              wrapClass = "rounded-xl bg-[#8c6239]/5 border border-[#8c6239]/20 px-4 py-4";
              labelClass = "text-[#8c6239]";
            } else if (isDesafio) {
              wrapClass = "rounded-lg bg-[#8c6239]/5 border border-[#8c6239]/12 px-4 py-3";
              labelClass = "text-[#8c6239]";
            }

            return (
              <div key={idx} className={wrapClass}>
                <p className={`font-mono text-[9px] uppercase tracking-widest mb-2 ${labelClass}`}>
                  {lbl.replace(/🫁\s*/, "")}
                </p>
                <div className="prose prose-sm max-w-none text-[#5c544d] font-sans leading-relaxed text-[13.5px]">
                  <Markdown
                    rehypePlugins={[rehypeSanitize]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-[#3c352d]">{children}</strong>,
                      em: ({ children }) => <em className="italic text-[#8c6239]/80">{children}</em>,
                    }}
                  >
                    {block.content}
                  </Markdown>
                </div>
              </div>
            );
          })}

          {transit.blocks.length === 0 && (
            <p className="text-[#8c7f70] text-xs font-sans italic">Leitura em processamento...</p>
          )}

          {/* Campo de Insight interativo */}
          <InsightField
            transitKey={`${transit.planetaTransito}|${transit.planetaNatal}|${transit.casaNatal}`}
            userId={userId ?? null}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Agrupamento por Esfera (Casa) ────────────────────────────────────────────

const SphereGroup: React.FC<{
  house: number;
  transits: ParsedTransit[];
  activeKey: string | null;
  startIndex: number;
  userId: string | null;
  onActivate: (t: ActiveTransit | null) => void;
}> = ({ house, transits, activeKey, startIndex, userId, onActivate }) => {
  const sphereName = HOUSE_SPHERES[house] || `Casa ${house}`;
  const [open, setOpen] = React.useState(true);

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 mb-3 group"
      >
        <span className="font-mono text-[10px] text-[#8c7f70] bg-[#8c7f70]/8 border border-[#8c7f70]/15 rounded px-1.5 py-0.5 flex-shrink-0">
          Casa {house}
        </span>
        <span className="font-serif text-[#3c352d] text-[13px] tracking-wide text-left flex-1">
          {sphereName}
        </span>
        <span className="text-[#8c7f70] flex-shrink-0">
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {open && (
        <div className="space-y-2 pl-1">
          {transits.map((t, i) => {
            const key = `${t.planetaTransito}|${t.planetaNatal}`;
            return (
              <TransitAccordion
                key={key}
                transit={t}
                index={startIndex + i}
                isActive={activeKey === key}
                userId={userId}
                onActivate={onActivate}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Painel Principal ─────────────────────────────────────────────────────────

const TransitPanel: React.FC<TransitPanelProps> = ({
  isOpen,
  isLoading,
  text,
  dashaText,
  isLoadingDashas,
  profile,
  userId: userIdProp,
  onActiveTransitChange,
  onClose,
  onRefresh,
  onRefreshDashas,
  age,
  profectionData,
  rapidActivationsData,
  isFetchingProfection,
  isFetchingRapidActivations,
}) => {
  const userId: string | null = userIdProp ?? profile?.user_id ?? null;
  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"dashas" | "portal" | "transits">("dashas");

  const allTransits = React.useMemo(() => {
    if (!text) return [];
    try {
      const parsed = parseTransitsFromMarkdown(text);
      // Enrich casaNatal from profile when parser got 0 (new format has no (Casa X))
      const natalPlanets: any[] = profile?.tropical_natal?.planets ?? [];
      if (natalPlanets.length > 0) {
        return parsed.map(t => {
          if (t.casaNatal === 0) {
            const found = natalPlanets.find((p: any) => p.name === t.planetaNatal);
            return { ...t, casaNatal: found?.house ?? 0 };
          }
          return t;
        });
      }
      return parsed;
    } catch (err) {
      console.error("[TransitPanel] Erro ao parsear:", err);
      return [];
    }
  }, [text, profile]);

  // Parseia seções das Dashas para blocos estilizados
  const dashaSections = React.useMemo(() => {
    if (!dashaText) return [];
    return parseDashaSections(dashaText);
  }, [dashaText]);

  // Agrupa por casa natal
  const byHouse = React.useMemo(() => {
    const map = new Map<number, ParsedTransit[]>();
    for (const t of allTransits) {
      const list = map.get(t.casaNatal) || [];
      list.push(t);
      map.set(t.casaNatal, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [allTransits]);

  const handleActivate = (t: ActiveTransit | null) => {
    setActiveKey(t ? `${t.planetaTransito}|${t.planetaNatal}` : null);
    onActiveTransitChange(t);
  };

  if (!isOpen) return null;

  // Contador para numeração global dos acordeões
  let globalIdx = 1;

  return (
    <div className="w-full mt-6 transition-all duration-500 ease-in-out">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="font-serif text-[#3c352d] text-base tracking-widest uppercase">
            Portais de Ativação
          </h2>
          <p className="font-mono text-[10px] text-[#8c7f70] uppercase tracking-widest mt-0.5">
            Próximos 30 dias — clique para abrir
          </p>
        </div>
        <div className="flex gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="font-mono text-[10px] text-[#8c6239] uppercase tracking-widest hover:text-[#3c352d] transition-colors px-2 py-1 rounded hover:bg-[#8c6239]/10 disabled:opacity-40"
            >
              {isLoading ? "Carregando..." : "↺ Atualizar"}
            </button>
          )}
          <button
            onClick={onClose}
            className="font-mono text-[10px] text-[#8c7f70] uppercase tracking-widest hover:text-[#3c352d] transition-colors px-2 py-1 rounded hover:bg-[#8c7f70]/10"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#8c7f70]/10 bg-[#ede9de]/20 -mx-1 px-1 mb-6">
        <button
          onClick={() => setActiveTab("dashas")}
          className={`py-3 text-xs font-sans tracking-wider uppercase font-medium border-b-2 transition-all mr-6 flex items-center gap-1.5 ${
            activeTab === "dashas"
              ? "border-[#5c4d66] text-[#5c4d66] border-b-[#5c4d66]"
              : "border-transparent text-[#8c7f70] hover:text-[#5c4d66]"
          }`}
        >
          A tríade do tempo cósmico
        </button>
        <button
          onClick={() => setActiveTab("portal")}
          className={`py-3 text-xs font-sans tracking-wider uppercase font-medium border-b-2 transition-all mr-6 flex items-center gap-1.5 ${
            activeTab === "portal"
              ? "border-[#5c4d66] text-[#5c4d66] border-b-[#5c4d66]"
              : "border-transparent text-[#8c7f70] hover:text-[#5c4d66]"
          }`}
        >
          {age !== undefined ? `Portal dos ${age}` : "Portal do ano"}
        </button>
        <button
          onClick={() => setActiveTab("transits")}
          className={`py-3 text-xs font-sans tracking-wider uppercase font-medium border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "transits"
              ? "border-[#5c4d66] text-[#5c4d66] border-b-[#5c4d66]"
              : "border-transparent text-[#8c7f70] hover:text-[#5c4d66]"
          }`}
        >
          Ciclos planetários
        </button>
      </div>

      {/* 1. Dashas — A Tríade do Tempo */}
      {activeTab === "dashas" && (
        isLoadingDashas ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="w-7 h-7 text-[#8c6239] animate-spin" />
            <p className="font-mono text-[10px] text-[#8c7f70] tracking-widest uppercase animate-pulse">
              Sincronizando tríade do tempo cósmico...
            </p>
          </div>
        ) : !dashaText ? (
          <div className="text-center py-12 text-[#8c7f70] font-sans text-sm">
            Nenhuma leitura disponível.
          </div>
        ) : (
          <div className="mb-8 pb-6">
            {dashaSections.map(section => (
              <DashaAccordion key={section.index} section={section} />
            ))}
          </div>
        )
      )}

      {/* 2. Portal do Ano — Profecção + Ativações Rápidas */}
      {activeTab === "portal" && (
        <div className="mb-8 pb-6">
          <SenhorDoAnoCard
            age={profectionData?.profection?.age ?? age}
            primaryLord={profectionData?.profection?.primaryLord}
            profectedHouse={profectionData?.profection?.profectedHouse}
            sign={profectionData?.profection?.sign}
            source={profectionData?.profection?.source}
            lords={profectionData?.profection?.lords}
            reading={profectionData?.reading}
            isLoading={isFetchingProfection}
          />
          <AtivacoesRapidasPanel
            activations={rapidActivationsData?.activations}
            reading={rapidActivationsData?.reading}
            isLoading={isFetchingRapidActivations}
          />
        </div>
      )}

      {/* 3. Trânsitos agrupados por Esfera */}
      {activeTab === "transits" && (
        isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="w-7 h-7 text-[#8c6239] animate-spin" />
            <p className="font-mono text-[10px] text-[#8c7f70] tracking-widest uppercase animate-pulse">
              Sincronizando trânsitos planetários...
            </p>
          </div>
        ) : !text ? (
          <div className="text-center py-12 text-[#8c7f70] font-sans text-sm">
            Nenhuma leitura disponível.
          </div>
        ) : (
          allTransits.length === 0 ? (
            <div className="rounded-xl border border-[#8c7f70]/15 bg-[#faf9f6] px-6 py-8 text-center">
              <p className="font-serif text-[#8c7f70] text-sm">
                Nenhum portal ativo no orbe de 4° no momento.
              </p>
            </div>
          ) : (
            <div>
              {byHouse.map(([house, transits]) => {
                const start = globalIdx;
                globalIdx += transits.length;
                return (
                  <SphereGroup
                    key={house}
                    house={house}
                    transits={transits}
                    activeKey={activeKey}
                    startIndex={start}
                    userId={userId}
                    onActivate={handleActivate}
                  />
                );
              })}
            </div>
          )
        )
      )}
    </div>
  );
};

export default TransitPanel;
