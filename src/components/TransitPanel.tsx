import React from "react";
import { Loader2, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  planetKey,
  signKey,
  parseAspectToNatal,
  natureKey,
  dignityInfo,
  dignityShortKey,
  houseClassKey,
  houseTypeKey,
  ASPECT_GLYPHS,
  restructuringCycleKey,
  dashaSectionKey,
} from "../i18n/canonical";
import { normalizeLang } from "../lib/lang";
import { LanguageSelector } from "./LanguageSelector";

const BreathingLoader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
    <div className="relative w-28 h-28 flex items-center justify-center">
      <span className="absolute inline-flex h-full w-full rounded-full bg-[#8c6239]/15 animate-ping" style={{ animationDuration: "3s" }} />
      <span className="absolute inline-flex h-20 w-20 rounded-full bg-[#8c6239]/10 animate-pulse" style={{ animationDuration: "3s" }} />
      <span className="absolute inline-flex h-10 w-10 rounded-full bg-[#8c6239]/20" />
    </div>
    <div className="space-y-2 max-w-xs">
      <p className="font-mono text-[10px] text-[#8c7f70] tracking-widest uppercase animate-pulse">
        {title}
      </p>
      <p className="font-sans text-[11px] text-[#8c7f70] leading-relaxed">
        {subtitle}
      </p>
    </div>
  </div>
);
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { SenhorDoAnoCard } from "./SenhorDoAnoCard";
import { AtivacoesRapidasPanel } from "./AtivacoesRapidasPanel";
import SolarReturnCard from "./SolarReturnCard";

export interface ActiveTransit {
  planetaTransito: string;
  planetaNatal: string;
  casaNatal: number;
  aspecto: string;
  ritmoTempo: string;
}

interface RestructuringCycle {
  type: "ativo" | "proximo";
  tradition: "tropical" | "vedic";
  planet: string;
  cycleName: string;
  isActive: boolean;
  orb?: number;
  startDate?: string;
  endDate?: string;
  ageAtPeak?: number;
  affectedHouse?: number;
  concurrentTransits?: string[];
}

export type TransitPanelTab = "dashas" | "portal" | "transits";

export interface TransitSummary {
  planet: string;
  aspectToNatal: string;
  status: "active" | "upcoming";
  activationDate: string;
  peakDate: string | null;
  exitDate: string;
  daysUntilPeak: number | null;
  minOrb: number;
  orbCategory: "slow" | "fast";
  terrain_mode: "tropical" | "sideral";
  structural_sign: string;
  structural_house: number;
  sideral_sign: string;
  sideral_house: number;
  sideral_house_type: string;
  sideral_house_class: string;
  sideral_dispositor: string;
  sideral_dignity: string;
  sideral_dignity_short: string;
  sideral_ingress: string;
  sideral_egress: string | null;
  tropical_sign: string;
  tropical_house: number;
  tropical_whole_sign_house: number;
  exact_aspect_date: string | null;
  tropical_sign_at_peak: string | null;
  seals: { tropicalSeal: string; sideralSeal: string };
  nature: {
    label: string;
    sentence: string;
    houseType: string;
    houseClass: string;
    dispositor: string;
    dignity: string;
    dignityShort: string;
  };
}

export interface TransitDetail {
  desafio: string;
  integracao: string;
}

interface TransitPanelProps {
  isOpen: boolean;
  isLoading: boolean;
  transits: TransitSummary[] | null;
  restructuringCycles?: RestructuringCycle[];
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
  subscriptionTier: "FREE" | "PLUS";
  initialTab?: TransitPanelTab;
}

const PLANET_ICONS: Record<string, string> = {
  sun: "☀️", moon: "🌙", mercury: "☿", venus: "♀️", mars: "♂️",
  jupiter: "♃", saturn: "♄", uranus: "⛢", neptune: "♆", pluto: "♇",
  northNode: "☊", southNode: "☋", rahu: "☊", ketu: "☋",
};

const EXCLUSIONS = /Nodo|Node|Lilith|Ascendente|Ascendant|Meio do Céu|MC|Parte|Fortuna|Rahu|Ketu/i;

function formatTransitDate(value: string, lang: string): string {
  return new Date(value).toLocaleDateString(lang, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

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

// ─── Lista de Trânsitos com carregamento sob demanda ─────────────────────────

function groupTransitsByHouse(transits: TransitSummary[]): [number, TransitSummary[]][] {
  const map = new Map<number, TransitSummary[]>();
  for (const t of transits) {
    const house = t.terrain_mode === "tropical" ? t.structural_house : t.sideral_house;
    const list = map.get(house) || [];
    list.push(t);
    map.set(house, list);
  }
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
}

interface TransitAccordionListProps {
  transits: TransitSummary[];
  userId: string | null;
  profile: any;
  onActivate: (t: ActiveTransit | null) => void;
}

const TransitAccordionList: React.FC<TransitAccordionListProps> = ({
  transits,
  userId,
  profile,
  onActivate,
}) => {
  const { t: tr, i18n } = useTranslation();
  const [details, setDetails] = React.useState<Record<string, TransitDetail | "loading" | "error" | null>>({});
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const inFlight = React.useRef(new Set<string>());

  const getKey = (t: TransitSummary) => `${t.planet}|${t.aspectToNatal}`;

  const fetchDetail = React.useCallback(async (t: TransitSummary, key: string, lang: string) => {
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key);
    setDetails(prev => ({ ...prev, [key]: "loading" }));
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch("/api/generate-transit-cycle-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, userId, transit: t, lang }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.desafio || !data.integracao) throw new Error("Resposta interpretativa incompleta");
      setDetails(prev => ({ ...prev, [key]: { desafio: data.desafio, integracao: data.integracao } }));
    } catch (err) {
      console.error("[TransitAccordionList] Erro ao buscar detalhe:", err);
      setDetails(prev => ({ ...prev, [key]: "error" }));
    } finally {
      window.clearTimeout(timeout);
      inFlight.current.delete(key);
    }
  }, [profile, userId]);

  // Troca de idioma: limpa detalhes/estado para regerar no novo idioma
  const currentLang = normalizeLang(i18n.language);
  React.useEffect(() => {
    setDetails({});
    setExpanded({});
    inFlight.current.clear();
  }, [currentLang]);

  // Pré-carrega o primeiro trânsito em background para melhorar a percepção de velocidade
  React.useEffect(() => {
    if (!transits[0]) return;
    const key = getKey(transits[0]);
    fetchDetail(transits[0], key, currentLang);
  }, [transits, fetchDetail, currentLang]);

  const grouped = React.useMemo(() => groupTransitsByHouse(transits), [transits]);

  return (
    <div className="space-y-8">
      {grouped.map(([house, houseTransits]) => (
        <div key={house}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="font-mono text-[10px] text-[#8c7f70] uppercase tracking-widest bg-[#8c7f70]/8 border border-[#8c7f70]/15 rounded px-1.5 py-0.5 flex-shrink-0">
              {tr("cycles.house", { house })}
            </span>
            <div className="h-px flex-1 bg-[#8c7f70]/10" />
            <span className="font-serif text-xs text-[#3c352d]">
              {tr(`houseThemes.h${house}`, { defaultValue: "" }) || tr("cycles.sphereFallback", { house })}
            </span>
          </div>
          <div className="space-y-3">
            {houseTransits.map((t) => (
              <TransitAccordion
                key={getKey(t)}
                transit={t}
                detail={details[getKey(t)]}
                isExpanded={!!expanded[getKey(t)]}
                onToggle={() => {
                  const key = getKey(t);
                  setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
                  if (!details[key]) fetchDetail(t, key, currentLang);
                }}
                onRetry={() => fetchDetail(t, getKey(t), currentLang)}
                onActivate={onActivate}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface TransitAccordionProps {
  transit: TransitSummary;
  detail: TransitDetail | "loading" | "error" | null;
  isExpanded: boolean;
  onToggle: () => void;
  onRetry: () => void;
  onActivate: (t: ActiveTransit | null) => void;
}

const TransitAccordion: React.FC<TransitAccordionProps> = ({
  transit,
  detail,
  isExpanded,
  onToggle,
  onRetry,
  onActivate,
}) => {
  const { t: tr, i18n } = useTranslation();
  const lang = i18n.language;

  const pKey = planetKey(transit.planet);
  const icon = (pKey && PLANET_ICONS[pKey]) || "✦";
  const planetLabel = pKey ? tr(`planets.${pKey}`) : transit.planet;

  const { aspect: aspectK, natalPlanet } = parseAspectToNatal(transit.aspectToNatal);
  const natalK = planetKey(natalPlanet);
  const natalLabel = natalK ? tr(`planets.${natalK}`) : (natalPlanet ?? "");
  const aspectLabel = aspectK ? tr(`aspects.${aspectK}`) : transit.aspectToNatal;
  const glyph = aspectK ? (ASPECT_GLYPHS[aspectK] ?? "") : "";
  const aspectTitle = aspectK && natalLabel
    ? tr("cycles.aspectWithNatal", { aspect: aspectLabel, planet: natalLabel })
    : transit.aspectToNatal;

  const signLabel = (name: string | null | undefined) => {
    const k = signKey(name);
    return k ? tr(`signs.${k}`) : (name ?? "");
  };

  const nKey = natureKey(transit.nature?.label);
  const dKey = dignityShortKey(transit.nature?.dignityShort);
  const structuralLayer = transit.terrain_mode === "tropical"
    ? tr("cycles.seals.layerWholeSign")
    : tr("cycles.seals.layerSideral");
  const tropicalSeal = tr("cycles.seals.psych", {
    planet: planetLabel,
    sign: signLabel(transit.tropical_sign_at_peak ?? transit.tropical_sign),
    glyph,
    natal: natalLabel,
    house: transit.tropical_house,
  });
  const sideralSeal = tr("cycles.seals.structural", {
    layer: structuralLayer,
    planet: planetLabel,
    sign: signLabel(transit.structural_sign),
    dignity: tr(`dignities.${dKey}`),
    house: transit.structural_house,
  });

  const activePayload: ActiveTransit = {
    planetaTransito: transit.planet,
    planetaNatal: transit.aspectToNatal.replace(/^.*com\s+(.+)\s+Natal$/, "$1") || "",
    casaNatal: transit.terrain_mode === "tropical" ? transit.structural_house : transit.sideral_house,
    aspecto: transit.aspectToNatal,
    ritmoTempo: "",
  };

  const statusLabel = transit.status === "active"
    ? tr("cycles.status.active")
    : transit.daysUntilPeak != null
      ? tr("cycles.status.upcomingDays", { days: transit.daysUntilPeak })
      : tr("cycles.status.upcoming");

  const isUpcoming = transit.status === "upcoming";

  return (
    <div
      className={`rounded-xl border transition-all duration-300 overflow-hidden
        ${isExpanded
          ? "border-[#8c6239]/30 bg-[#f4f1eb]"
          : isUpcoming
            ? "border-[#8c7f70]/10 bg-[#faf9f6]/60 opacity-80 hover:bg-[#f4f1eb]/40"
            : "border-[#8c7f70]/15 bg-[#faf9f6] hover:bg-[#f4f1eb]/60"}`}
      onMouseEnter={() => onActivate(activePayload)}
      onMouseLeave={() => onActivate(null)}
    >
      <button
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
        onClick={onToggle}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-base leading-none flex-shrink-0">{icon}</span>
            <span className={`font-serif text-[13.5px] leading-snug truncate ${isUpcoming ? "text-[#5c544d]" : "text-[#3c352d]"}`}>
              {planetLabel} {aspectTitle}
            </span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#8c7f70] pl-7">
            {statusLabel}
          </span>
        </div>
        <div className="flex-shrink-0 text-[#8c7f70]">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-5 pb-5 space-y-4 border-t border-[#8c7f70]/10 pt-4">
          {/* Selos técnicos */}
          <div className="space-y-1.5 text-[11px] text-[#5c544d] font-mono bg-[#f4f1eb]/60 p-3 rounded-lg border border-[#8c7f70]/10">
            <p>{tropicalSeal}</p>
            <p>{sideralSeal}</p>
          </div>

          <section className="space-y-2">
            <h4 className="font-sans text-[11px] font-semibold uppercase tracking-widest text-[#5c4d66]">
              {tr("cycles.data.title")}
            </h4>
            <div className="grid gap-1 font-sans text-[12px] text-[#3c352d]">
              <p><span className="font-medium">{tr("cycles.data.orbEntry")}</span> {formatTransitDate(transit.activationDate, lang)}</p>
              <p><span className="font-medium">{tr("cycles.data.exactTrigger")}</span> {transit.peakDate ? formatTransitDate(transit.peakDate, lang) : tr("cycles.data.peakPassed")}</p>
              <p><span className="font-medium">{tr("cycles.data.orbExit")}</span> {formatTransitDate(transit.exitDate, lang)}</p>
              <p><span className="font-medium">{tr("cycles.data.nature")}</span> {tr(`nature.${nKey}.label`)} — {tr(`nature.${nKey}.sentence`)}</p>
            </div>
          </section>

          <div className="space-y-5">
            {detail === "loading" && (
              <div className="flex items-center gap-3 rounded-lg bg-[#8c6239]/5 p-4 border border-[#8c6239]/10">
                <Loader2 className="w-4 h-4 text-[#8c6239] animate-spin" />
                <p className="font-mono text-[10px] text-[#8c7f70] uppercase tracking-widest">
                  {tr("cycles.preparing")}
                </p>
              </div>
            )}

            {detail === "error" && (
              <div className="rounded-lg bg-[#8c6239]/5 p-4 border border-[#8c6239]/10 space-y-3">
                <p className="font-sans text-[12px] text-[#5c544d]">
                  {tr("cycles.detailError")}
                </p>
                <button type="button" onClick={onRetry} className="font-mono text-[10px] uppercase tracking-widest text-[#8c6239] hover:underline">
                  {tr("cycles.retry")}
                </button>
              </div>
            )}

            {detail && detail !== "loading" && detail !== "error" && (
              <>
                <section>
                  <h4 className="font-sans text-[11px] font-semibold uppercase tracking-widest text-[#8c6239] mb-2">
                    {tr("cycles.challenge")}
                  </h4>
                  <div className="font-sans text-[13px] text-[#3c352d] leading-relaxed">
                    <Markdown rehypePlugins={[rehypeSanitize]}>{detail.desafio}</Markdown>
                  </div>
                </section>

                <section className="rounded-lg bg-[#3c6e4a]/5 p-4 border border-[#3c6e4a]/15">
                  <h4 className="font-sans text-[11px] font-semibold uppercase tracking-widest text-[#3c6e4a] mb-2">
                    {tr("cycles.integration")}
                  </h4>
                  <div className="font-sans text-[13px] text-[#3c352d] leading-relaxed">
                    <Markdown rehypePlugins={[rehypeSanitize]}>{detail.integracao}</Markdown>
                  </div>
                </section>

                <InsightField transitKey={`${transit.planet}|${transit.aspectToNatal}`} userId={null} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Parser e componente para Dashas ─────────────────────────────────────────

interface DashaSection {
  title: string;
  content: string;
  planet?: string;
  index: number;
}


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

    if (dashaSectionKey(normalizedTitle) !== null) {
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
  const match = content.match(/\n(?:\*\*)?(?:A geografia de|La geograf[ií]a de|The geography of)\s+([^\n]+?)\s+(?:no mapa natal|en la carta natal|in the natal chart)(?:\*\*)?\n/i);
  if (!match || match.index === undefined) return { body: content };
  const body = content.slice(0, match.index).trim();
  const rawHeading = match[0].trim().replace(/^\*\*|\*\*$/g, "");
  const heading = `**${rawHeading}**`;
  const geography = heading + "\n\n" + content.slice(match.index + match[0].length).trim();
  return { body, geography };
}

const DashaAccordion: React.FC<{ section: DashaSection }> = ({ section }) => {
  const { t: tr } = useTranslation();
  const [expanded, setExpanded] = React.useState(true);
  const sectionKey = dashaSectionKey(normalizeHeading(section.title));
  const title = sectionKey ? tr(`dasha.sections.${sectionKey}`) : section.title;
  const pKey = planetKey(section.planet);
  const icon = pKey ? (PLANET_ICONS[pKey] || "✦") : (section.planet ? "✦" : "");
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
            {title}
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
  const { t: tr } = useTranslation();
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
        {tr("cycles.insight.label")}
      </p>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setSaved(false); }}
        rows={3}
        placeholder={tr("cycles.insight.placeholder")}
        className="w-full resize-none rounded-lg border border-[#8c7f70]/20 bg-[#faf9f6] px-4 py-3 text-[13px] font-sans text-[#3c352d] placeholder-[#8c7f70]/50 focus:outline-none focus:border-[#8c6239]/40 focus:bg-white transition-all leading-relaxed"
      />
      <div className="flex items-center justify-between">
        {saved ? (
          <span className="font-mono text-[10px] text-[#3c6e4a] tracking-wider">{tr("cycles.insight.saved")}</span>
        ) : (
          <span />
        )}
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest bg-[#3c352d] text-[#f4e8d0] hover:bg-[#5c4d3d] disabled:opacity-30 transition-all"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
          {tr("cycles.insight.save")}
        </button>
      </div>
    </div>
  );
};

// ─── Fases Reestruturantes ───────────────────────────────────────────────────

type TFn = (key: string, opts?: Record<string, unknown>) => string;

function cycleDisplayName(cycle: RestructuringCycle, tr: TFn): string {
  const key = restructuringCycleKey(cycle.cycleName);
  return key ? tr(`cycles.phases.names.${key}`) : cycle.cycleName;
}

function activeCycleParagraph(cycle: RestructuringCycle, tr: TFn): string {
  const houseLabel = cycle.affectedHouse
    ? tr("cycles.phases.houseArea", {
        house: cycle.affectedHouse,
        theme: tr(`houseThemesShort.h${cycle.affectedHouse}`, { defaultValue: "" }) || tr("cycles.phases.themeFallback"),
      })
    : tr("cycles.phases.themeFallback");
  const tradition = tr(cycle.tradition === "vedic" ? "cycles.phases.traditionVedic" : "cycles.phases.traditionTropical");
  const concurrent = cycle.concurrentTransits && cycle.concurrentTransits.length > 0
    ? tr("cycles.phases.concurrent", { list: cycle.concurrentTransits.join(" / ") })
    : "";

  const key = restructuringCycleKey(cycle.cycleName);
  if (key) {
    return tr(`cycles.phases.templates.${key}`, {
      house: houseLabel,
      tradition,
      concurrent,
    });
  }
  return tr("cycles.phases.defaultTemplate", {
    name: cycle.cycleName,
    house: houseLabel,
    tradition,
    concurrent,
  });
}

function upcomingCycleLine(cycle: RestructuringCycle, tr: TFn): string {
  const key = restructuringCycleKey(cycle.cycleName);
  const base = key
    ? tr(`cycles.phases.upcomingText.${key}`)
    : tr("cycles.phases.defaultUpcoming");
  const when = cycle.startDate
    ? tr("cycles.phases.startsIn", { year: cycle.startDate.split("-")[0] })
    : tr("cycles.phases.approaching");
  return `${cycleDisplayName(cycle, tr)} ${when} — ${base}`;
}

const RestructuringPhasesAccordion: React.FC<{ cycles: RestructuringCycle[] }> = ({ cycles }) => {
  const { t: tr } = useTranslation();
  const [expanded, setExpanded] = React.useState(true);
  const active = cycles.filter(c => c.isActive);
  const upcoming = cycles.filter(c => !c.isActive && c.type === "proximo");

  return (
    <div className="rounded-xl border border-[#8c6239]/20 bg-[#faf9f6] overflow-hidden mb-6">
      <button
        onClick={() => setExpanded(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left bg-[#8c6239]/5 hover:bg-[#8c6239]/10 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-base leading-none flex-shrink-0">◈</span>
          <span className="font-serif text-[#3c352d] text-[14px] tracking-wide">
            {tr("cycles.phases.title")}
          </span>
        </div>
        <span className="text-[#8c7f70] flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-5 pb-5 pt-4 space-y-4">
          {active.length === 0 ? (
            <p className="font-sans text-[13px] text-[#5c544d] leading-relaxed">
              {tr("cycles.phases.none")}
            </p>
          ) : (
            <div className="space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#8c6239]">
                {tr("cycles.phases.activeNow")}
              </p>
              {active.map((cycle, idx) => (
                <div key={idx} className="rounded-lg border border-[#8c7f70]/10 bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-serif text-[#3c352d] text-[13px]">
                      {cycleDisplayName(cycle, tr)}
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                      cycle.tradition === "vedic"
                        ? "bg-[#5c4d66]/10 text-[#5c4d66] border-[#5c4d66]/20"
                        : "bg-[#8c6239]/10 text-[#8c6239] border-[#8c6239]/20"
                    }`}>
                      {tr(cycle.tradition === "vedic" ? "cycles.phases.vedic" : "cycles.phases.tropical")}
                    </span>
                  </div>
                  <p className="font-sans text-[12.5px] text-[#5c544d] leading-relaxed">
                    {activeCycleParagraph(cycle, tr)}
                  </p>
                  {(cycle.startDate || cycle.endDate) && (
                    <p className="font-mono text-[9px] text-[#8c7f70]">
                      {cycle.startDate && cycle.endDate
                        ? `${cycle.startDate} → ${cycle.endDate}`
                        : cycle.startDate || cycle.endDate}
                      {cycle.orb !== undefined && ` · ${tr("cycles.phases.orb", { orb: cycle.orb })}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-[#8c7f70]/10">
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#8c7f70]">
                {tr("cycles.phases.upcoming")}
              </p>
              <ul className="space-y-2">
                {upcoming.map((cycle, idx) => (
                  <li key={idx} className="font-sans text-[12px] text-[#5c544d] leading-snug flex items-start gap-2">
                    <span className="text-[#8c6239] mt-1">•</span>
                    {upcomingCycleLine(cycle, tr)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Painel Principal ─────────────────────────────────────────────────────────

const TransitPanel: React.FC<TransitPanelProps> = ({
  isOpen,
  isLoading,
  transits,
  restructuringCycles,
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
  subscriptionTier,
  initialTab = "dashas",
}) => {
  const { t: tr } = useTranslation();
  const userId: string | null = userIdProp ?? profile?.user_id ?? null;
  const [activeTab, setActiveTab] = React.useState<TransitPanelTab>(initialTab);

  React.useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Parseia seções das Dashas para blocos estilizados
  const dashaSections = React.useMemo(() => {
    if (!dashaText) return [];
    return parseDashaSections(dashaText);
  }, [dashaText]);

  if (!isOpen) return null;

  return (
    <div className="w-full mt-6 transition-all duration-500 ease-in-out">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="font-serif text-[#3c352d] text-base tracking-widest uppercase">
            {tr("cycles.title")}
          </h2>
          <p className="font-mono text-[10px] text-[#8c7f70] uppercase tracking-widest mt-0.5">
            {tr("cycles.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="font-mono text-[10px] text-[#8c6239] uppercase tracking-widest hover:text-[#3c352d] transition-colors px-2 py-1 rounded hover:bg-[#8c6239]/10 disabled:opacity-40"
            >
              {isLoading ? tr("cycles.refreshing") : tr("cycles.refresh")}
            </button>
          )}
          <button
            onClick={onClose}
            className="font-mono text-[10px] text-[#8c7f70] uppercase tracking-widest hover:text-[#3c352d] transition-colors px-2 py-1 rounded hover:bg-[#8c7f70]/10"
          >
            {tr("cycles.close")}
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
          {tr("cycles.tabs.dashas")}
        </button>
        <button
          onClick={() => setActiveTab("portal")}
          className={`py-3 text-xs font-sans tracking-wider uppercase font-medium border-b-2 transition-all mr-6 flex items-center gap-1.5 ${
            activeTab === "portal"
              ? "border-[#5c4d66] text-[#5c4d66] border-b-[#5c4d66]"
              : "border-transparent text-[#8c7f70] hover:text-[#5c4d66]"
          }`}
        >
          {age !== undefined ? tr("cycles.tabs.portalAge", { age }) : tr("cycles.tabs.portal")}
        </button>
        <button
          onClick={() => setActiveTab("transits")}
          className={`py-3 text-xs font-sans tracking-wider uppercase font-medium border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "transits"
              ? "border-[#5c4d66] text-[#5c4d66] border-b-[#5c4d66]"
              : "border-transparent text-[#8c7f70] hover:text-[#5c4d66]"
          }`}
        >
          {tr("cycles.tabs.transits")}
        </button>
      </div>

      {/* 1. Dashas — A Tríade do Tempo */}
      {activeTab === "dashas" && (
        isLoadingDashas ? (
          <BreathingLoader
            title={tr("cycles.loaders.dashas")}
            subtitle={tr("cycles.loaders.breath")}
          />
        ) : !dashaText ? (
          <div className="text-center py-12 text-[#8c7f70] font-sans text-sm">
            {tr("cycles.empty")}
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
          {(isFetchingProfection || isFetchingRapidActivations) && !profectionData && !rapidActivationsData && (
            <BreathingLoader
              title={tr("cycles.loaders.portal")}
              subtitle={tr("cycles.loaders.breath")}
            />
          )}
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
          <SolarReturnCard profile={profile} userId={userId} subscriptionTier={subscriptionTier} />
        </div>
      )}

      {/* 3. Trânsitos — acordeões com carregamento sob demanda */}
      {activeTab === "transits" && (
        <div>
          <RestructuringPhasesAccordion cycles={restructuringCycles || []} />

          {isLoading && !transits && (
            <BreathingLoader
              title={tr("cycles.loaders.transits")}
              subtitle={tr("cycles.loaders.breath")}
            />
          )}

          {!isLoading && !transits && (
            <div className="text-center py-12 text-[#8c7f70] font-sans text-sm">
              {tr("cycles.empty")}
            </div>
          )}

          {transits && (
            <div className="mt-6">
              {transits.length === 0 ? (
                <div className="rounded-xl border border-[#8c7f70]/15 bg-[#faf9f6] px-6 py-8 text-center">
                  <p className="font-serif text-[#8c7f70] text-sm">
                    {tr("cycles.noPortals")}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-mono text-[9px] text-[#8c7f70] uppercase tracking-[0.2em] mb-4 px-1">
                    {tr("cycles.portalsHint")}
                  </p>
                  <TransitAccordionList
                    transits={transits}
                    userId={userId}
                    profile={profile}
                    onActivate={onActiveTransitChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransitPanel;
