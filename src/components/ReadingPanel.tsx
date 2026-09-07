import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, BookOpen, Compass, ShieldAlert, Loader2 } from "lucide-react";
import { ReadingData } from "../lib/mockReadings";
import { PaywallBarrier } from "./PaywallBarrier";
import { hasPlusAccess, hasChamadoFeature } from "../lib/access";
import { MeditationPlayer } from "./MeditationPlayer";
import { AlchemyJournal } from "./AlchemyJournal";
import { PresencePauseCard } from "./PresencePauseCard";
import { ShareInviteCard } from "./share/ShareInviteCard";
import { StoryShareModal } from "./share/StoryShareModal";
import { PdfUnlockModal } from "./share/PdfUnlockModal";
import type { StoryData } from "./share/ShareableStoryCanvas";

interface ReadingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReadingData | null;
  isLoading?: boolean;
  subscriptionTier: "FREE" | "PLUS";
  userId: string;
  userEmail: string;
  fullName: string;
  onUpgradeSuccess: () => void;
  userGender?: "masculino" | "feminino";
  userGenderPreference?: "feminino" | "masculino" | "neutro_estrutural" | "neutro_direto";
  profile?: any;
  userProfile?: any;
  onUpdateAiReading?: (id: string, reading: Partial<ReadingData>) => void;
}

const MEDITATION_ENABLED_PATH_IDS = [
  "eixo-asc",
  "eixo-ic",
  "eixo-dsc",
  "eixo-mc",
  "caminho-assimilacao",
  "caminho-manifestacao",
  "caminho-transformacao",
] as const;

const PATH_TITLES_BY_ID: Record<string, string> = {
  "eixo-asc": "Caminho da Autenticidade",
  "eixo-ic": "Caminho da Consciência",
  "eixo-dsc": "Caminho da Reconexão",
  "eixo-mc": "Caminho da Realização",
  "caminho-assimilacao": "Caminho da Integração",
  "caminho-manifestacao": "Caminho da Manifestação",
  "caminho-transformacao": "Caminho da Transformação",
};

const PATH_CHALLENGE_QUESTION: Record<string, string> = {
  "eixo-asc": "O que pode bloquear sua expressão mais autêntica?",
  "eixo-ic": "O que pode bloquear sua consciência?",
  "eixo-dsc": "O que pode bloquear sua reconexão?",
  "eixo-mc": "O que pode bloquear sua realização?",
  "caminho-assimilacao": "O que pode bloquear sua integração?",
  "caminho-manifestacao": "O que pode bloquear sua manifestação?",
  "caminho-transformacao": "O que pode bloquear sua força de transformação?",
};

const PATH_INTEGRATION_QUESTION: Record<string, string> = {
  "eixo-asc": "Como integrar a autenticidade no seu dia-a-dia?",
  "eixo-ic": "Como integrar a consciência no seu dia-a-dia?",
  "eixo-dsc": "Como integrar a reconexão na sua vida?",
  "eixo-mc": "Como integrar a realização na sua vida?",
  "caminho-assimilacao": "Como trabalhar a integração na sua vida?",
  "caminho-manifestacao": "Como integrar a manifestação na sua vida?",
  "caminho-transformacao": "Como integrar a transformação na sua vida?",
};

const PATH_GIFT_QUESTION: Record<string, string> = {
  "eixo-asc": "Qual dom eu trago para expressar minha verdade?",
  "eixo-ic": "Qual dom eu trago para ampliar minha consciência?",
  "eixo-dsc": "Qual dom eu trago para me reconectar?",
  "eixo-mc": "Qual dom eu trago para me realizar?",
  "caminho-assimilacao": "Qual dom eu trago para integrar?",
  "caminho-manifestacao": "Qual dom eu trago para manifestar?",
  "caminho-transformacao": "Qual dom eu trago para conseguir me transformar?",
};

const PATH_GIFT_SUBTITLE: Record<string, string> = {
  "eixo-asc": "A Expressão Real: Sua Virtude Nativa e o Pulso de Criação",
  "eixo-ic": "A Expressão Real: Sua Virtude Nativa e o Pulso de Consciência",
  "eixo-dsc": "A Expressão Real: Sua Virtude Nativa e o Pulso de Conexão",
  "eixo-mc": "A Expressão Real: Sua Virtude Nativa e o Pulso de Concretização",
  "caminho-assimilacao": "A Expressão Real: Sua Virtude Nativa e o Pulso de Integração",
  "caminho-manifestacao": "A Expressão Real: Sua Virtude Nativa e o Pulso de Criação",
  "caminho-transformacao": "A Expressão Real: Sua Virtude Nativa e o Pulso de Transmutação",
};

const ASTRO_TERMS = [
  "Sol", "Lua", "Mercúrio", "Vênus", "Marte", "Júpiter", "Saturno", "Urano", "Netuno", "Plutão",
  "Nodo Norte", "Nodo Sul", "Rahu", "Ketu",
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem", "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes",
  "Casa 10", "Casa 11", "Casa 12", "Casa 1", "Casa 2", "Casa 3", "Casa 4", "Casa 5", "Casa 6", "Casa 7", "Casa 8", "Casa 9",
  "Ascendente", "Meio do Céu", "Fundo do Céu", "Descendente", "Dusthanas",
  "Atmakaraka", "Amatyakaraka", "Darakaraka", "Janma Nakshatra", "Nakshatra", "Upapada Lagna", "Dhana Yogas", "D10 Dasamsa", "Lagna", "Lagnesha",
  "Ashvini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
].sort((a, b) => b.length - a.length);

interface SideralBlock {
  title: string;
  content: string;
  isSummary?: boolean;
}

const SYNTHESIS_KNOWN_TITLES = [
  "O Desafio Evolutivo",
  "A Integração de Força",
  "O Dom Manifestado"
];

const removeLeadingDeepReadingSubtitle = (text: string, subtitle: string): string => text
  .replace(new RegExp(`^\\s*(?:#+\\s*)?(?:\\*\\*)?${subtitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\*\\*)?\\s*[:—-]?\\s*`, "i"), "")
  .trim();

const parseTropicalReading = (text: string): { body: string; summary: string } => {
  if (!text) return { body: "", summary: "" };

  const normalized = text
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\*\*A Costura do seu Céu:?\*\*/g, "A Costura do seu Céu:")
    .replace(/\s*(A Costura do seu Céu:)/g, "\n\n$1\n")
    .replace(/\s*(Cúspide da Casa \d+:)/g, "\n$1")
    .replace(/\s*(Planeta Regente:)/g, "\n$1")
    .replace(/\s*(Posicionamento do Regente:)/g, "\n$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const heading = "A Costura do seu Céu:";
  const headingIndex = normalized.indexOf(heading);
  if (headingIndex < 0) return { body: normalized, summary: "" };

  const body = normalized.slice(0, headingIndex).trim();
  const headerPattern = /^(Cúspide da Casa \d+:|Planeta Regente:|Posicionamento do Regente:)/;
  const summary = normalized
    .slice(headingIndex + heading.length)
    .split("\n")
    .map(line => line.trim())
    .filter(line => headerPattern.test(line))
    .join("\n");

  return { body, summary };
};

const parseSideralReading = (text: string): { intro: string; blocks: SideralBlock[]; summary: string } => {
  if (!text) return { intro: "", blocks: [], summary: "" };

  const normalized = text
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\*\*A Costura do seu Céu Sideral\*\*/g, "A Costura do seu Céu Sideral")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const heading = "A Costura do seu Céu Sideral";
  const headingIndex = normalized.indexOf(heading);
  if (headingIndex < 0) return { intro: normalized, blocks: [], summary: "" };

  const lines = normalized.slice(headingIndex + heading.length).split("\n");
  const headerPattern = /^(Cúspide da Casa \d+:|Estrela do Regente:|Planetas Ocupantes:|Olhares Recebidos \(Drishtis\):)/;
  const headerLines: string[] = [];
  const bodyLines: string[] = [];
  let bodyStarted = false;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!bodyStarted && !trimmed) return;
    if (!bodyStarted && headerPattern.test(trimmed)) {
      headerLines.push(trimmed);
      return;
    }
    bodyStarted = true;
    bodyLines.push(line);
  });

  return {
    intro: bodyLines.join("\n").replace(/^\s+/, "").trim(),
    blocks: [],
    summary: headerLines.join("\n")
  };
};

const parseSynthesisReading = (text: string): { intro: string; blocks: SideralBlock[] } => {
  if (!text) return { intro: "", blocks: [] };

  let normalized = text
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n");

  // Remover cabeçalho técnico repetido, se o LLM o incluir
  normalized = normalized.replace(/^Casa \d+ .+\n[^\n]+\n+/, "");

  // Inserir quebras antes dos títulos conhecidos
  SYNTHESIS_KNOWN_TITLES.forEach((title) => {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?<!\\*\\*)\\s*(\\*\\*)?\\s*${escaped}\\s*(\\*\\*)?(?!\\S)`, "g");
    normalized = normalized.replace(regex, `\n\n**${title}**\n`);
  });

  normalized = normalized
    .replace(/(?:^|\n)-\s+O Desafio Evolutivo:/g, "\n\n**O Desafio Evolutivo**\n")
    .replace(/(?:^|\n)-\s+A Integração de Força:/g, "\n\n**A Integração de Força**\n")
    .replace(/(?:^|\n)-\s+O Dom Manifestado:/g, "\n\n**O Dom Manifestado**\n")
    .replace(/(?:^|\n)Os Caminhos da Síntese:?\n*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const parts = normalized.split(/\n\s*\n/);
  let intro = "";
  const blocks: SideralBlock[] = [];

  parts.forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;

    const match = trimmed.match(/^\*\*(.+?)\*\*(?::)?\s*\n?([\s\S]*)$/);
    if (match) {
      const title = match[1].trim().replace(/\*/g, "");
      const content = match[2].trim().replace(/\*/g, "");
      if (content) blocks.push({ title, content });
    } else {
      intro = intro ? `${intro}\n\n${trimmed}` : trimmed;
    }
  });

  // Fallback: se não houver blocos, dividir parágrafos e atribuir títulos
  if (blocks.length === 0 && intro.includes("\n\n")) {
    const paragraphs = intro.split("\n\n").filter((p) => p.trim());
    intro = paragraphs.shift() || "";
    paragraphs.forEach((paragraph, index) => {
      const title = SYNTHESIS_KNOWN_TITLES[index] || `Bloco ${index + 1}`;
      blocks.push({ title, content: paragraph.trim() });
    });
  }

  return { intro, blocks };
};

const normalizePetalSubtitle = (subtitle?: string): string => {
  if (!subtitle) return "";
  return subtitle
    .replace(/\s*[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]\uFE0F?\s*/gu, " | ")
    .replace(/\s*\|\s*\|\s*/g, " | ")
    .replace(/^\s*\|\s*/, "")
    .replace(/\s*\|\s*$/, "")
    .trim();
};

const truncateToBoundary = (text?: string, maxChars = 520): string => {
  if (!text) return "";
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (cleaned.length <= maxChars) return cleaned;
  const cut = cleaned.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  const lastPeriod = cut.lastIndexOf(".");
  const boundary = Math.max(lastSpace, lastPeriod > 0 ? lastPeriod : -1);
  const result = boundary > 0 ? cleaned.slice(0, boundary) : cut;
  return result.replace(/[.,;:!?]$/, "") + "...";
};

const splitPetalEnergySubtitle = (subtitle?: string): { category: string; poetic: string } => {
  if (!subtitle) return { category: "", poetic: "" };
  const [first, ...rest] = subtitle.split(":");
  const category = (first || "").trim().toUpperCase();
  const poetic = rest.join(":").trim();
  return { category, poetic };
};

const READING_SUBTITLE_BY_TYPE: Record<string, string> = {
  // Elementos
  terra: "Ancoragem na Matéria | A Arte de Edificar",
  agua: "Navegação emocional | A Sabedoria do Sentir",
  fogo: "Centelha Criadora | A Expressão da Vontade",
  ar: "Mente Consciente | O Poder das Conexões",
  // Qualidades
  fixa: "Diretriz de Consolidação | A Força da Resiliência",
  cardeal: "Diretriz de Movimento | A Coragem de Iniciar",
  mutavel: "Diretriz de Adaptação | A Sabedoria de Fluir",
};

const getReadingSubtitle = (title?: string): { category: string; poetic: string } => {
  if (!title) return { category: "", poetic: "" };
  const normalized = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const type = Object.keys(READING_SUBTITLE_BY_TYPE).find((key) =>
    normalized.includes(key)
  );
  const poetic = type ? READING_SUBTITLE_BY_TYPE[type] : "";
  return { category: title, poetic };
};

const summarizeVetorAnalysis = (
  analysis?: string,
  vetorScore = 0,
  userName = "Você"
): string => {
  if (!analysis) return "";
  const cleaned = analysis.trim().replace(/\s+/g, " ");

  if (vetorScore >= 3) {
    const match = cleaned.match(/sua forma de se mover no mundo é[^.]+[.]/i);
    if (match && match.index !== undefined) {
      let rest = cleaned.slice(match.index + match[0].length).trim();
      rest = rest.replace(/,\s*expandindo sua vitalidade[\s\S]*$/, "").trim();
      if (rest) {
        rest = rest.replace(/,$/, ".");
        return `${userName}, ${match[0].replace(/^\w/, (c) => c.toLowerCase())} ${rest}`;
      }
      return `${userName}, ${match[0].replace(/^\w/, (c) => c.toLowerCase())}`;
    }
  }

  const learnIndex = cleaned.toLowerCase().indexOf("você pode aprender a");
  if (learnIndex >= 0) {
    let rest = cleaned.slice(learnIndex).replace(/,\s*permitindo-se ver a alma[\s\S]*$/, "").trim();
    return rest || cleaned;
  }

  return truncateToBoundary(cleaned, 520);
};

function splitTranspessoalBlock(gift: string): { main: string; title: string; body: string } | null {
  const markerRegex = /\n\n(Dom Transpessoal: A Frequência de Libertação|Dom de Fluir: O Ponto de Alinhamento Orgânico)(?:\n|\. ?)/;
  const match = gift.match(markerRegex);
  if (!match || match.index === undefined) return null;
  return { main: gift.slice(0, match.index), title: match[1], body: gift.slice(match.index + match[0].length) };
}

const SIDERAL_BLOCK_STYLES = [
  { border: "border-[#5c4d66]/20", title: "text-[#5c4d66]" },
  { border: "border-[#8c6239]/20", title: "text-[#8c6239]" },
  { border: "border-[#8c7f70]/20", title: "text-[#8c7f70]" },
  { border: "border-[#5c4d66]/20", title: "text-[#5c4d66]" },
];

const AstrologicalSourceFooter: React.FC<{ source: string }> = ({ source }) => {
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const [definition, setDefinition] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Extract individual concepts from the source string
  const termRegex = new RegExp(ASTRO_TERMS.join('|'), 'gi');
  const matchedTerms = Array.from(new Set(
    (source.match(termRegex) || []).map(t => {
      // Normalize capitalization to match our list
      const exactMatch = ASTRO_TERMS.find(term => term.toLowerCase() === t.toLowerCase());
      return exactMatch || t;
    })
  ));

  if (matchedTerms.length === 0) return null;

  const handleFragmentClick = async (fragment: string) => {
    if (activeTerm === fragment) {
      setActiveTerm(null);
      setDefinition(null);
      return;
    }

    setActiveTerm(fragment);
    setIsLoading(true);
    setDefinition(null);

    try {
      const response = await fetch("/api/generate-glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: fragment })
      });
      const data = await response.json();
      if (data.definition) {
        setDefinition(data.definition);
      } else {
        setDefinition("Não foi possível gerar a definição.");
      }
    } catch (error) {
      console.error(error);
      setDefinition("Erro ao carregar o glossário.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-8 sm:px-12 py-6 bg-[#ede9de]/40 border-t border-[#8c7f70]/10 text-center relative">
      <div className="flex flex-wrap justify-center gap-3">
        {matchedTerms.map((fragment, idx) => (
          <button
            key={idx}
            onClick={() => handleFragmentClick(fragment)}
            className={`font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-full transition-all border cursor-pointer ${activeTerm === fragment ? 'bg-[#8c6239] text-[#f4f1eb] border-[#8c6239]' : 'bg-transparent text-[#a19688] hover:text-[#8c6239] border-[#a19688]/30 hover:border-[#8c6239]/50'}`}
          >
            {fragment}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {activeTerm && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-0 right-0 mx-auto w-full max-w-sm mb-4 bg-[#f4f1eb] border border-[#8c7f70]/20 rounded-lg p-5 shadow-xl text-left z-20"
          >
            <div className="flex justify-between items-start mb-3 border-b border-[#8c7f70]/10 pb-2">
              <h4 className="font-serif text-[#3c352d] text-sm uppercase tracking-wider">
                Glossário Cósmico
              </h4>
              <button onClick={() => setActiveTerm(null)} className="text-[#8c7f70] hover:text-[#3c352d] p-1 rounded-full hover:bg-[#8c7f70]/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-[#8c6239] animate-spin" />
              </div>
            ) : (
              <div className="font-sans text-xs text-[#5c544d] leading-relaxed">
                {definition?.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0">{line}</p>
                ))}
              </div>
            )}
            
            {/* Triangle pointing down */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#f4f1eb] border-b border-r border-[#8c7f70]/20 rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ReadingPanel({
  isOpen,
  onClose,
  data,
  isLoading,
  subscriptionTier,
  userId,
  userEmail,
  fullName,
  onUpgradeSuccess,
  userGender,
  userGenderPreference,
  profile,
  userProfile,
  onUpdateAiReading
}: ReadingPanelProps) {
  const [activeTab, setActiveTab] = React.useState<"tropical" | "vedic" | "sintese">("tropical");
  const [isTabLoading, setIsTabLoading] = React.useState(false);

  // Meditação Alquímica — estado
  const [meditationAudioUrl, setMeditationAudioUrl] = React.useState<string | null>(null);
  const [meditationLoading, setMeditationLoading] = React.useState(false);
  const [journalText, setJournalText] = React.useState("");
  const [houseMantra, setHouseMantra] = React.useState("");

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const isAngularHouse = data ? ["casa-1", "casa-4", "casa-7", "casa-10"].includes(data.id) : false;

  function getHouseFeatureKey(houseId: string): string {
    const match = houseId.match(/(\d+)/);
    return match ? `casa_${match[1]}` : houseId;
  }

  const isHouseUnlocked = hasPlusAccess(userProfile) || isAngularHouse || hasChamadoFeature(userProfile, data?.id ? getHouseFeatureKey(data.id) : "");
  const isPathUnlocked = hasPlusAccess(userProfile) || data?.id === "eixo-asc" || hasChamadoFeature(userProfile, data?.id || "");

  const isShareable = data
    ? data.isVetorReading ||
      (data.isMoonReading && (data as any).isMoonBirthPhase !== false)
    : false;

  const preferredName = profile?.birthData?.name || fullName || "Você";

  const shareStoryData: StoryData | null = data && isShareable
    ? data.isVetorReading
      ? (() => {
          const { category, poetic } = getReadingSubtitle(data.title);
          return {
            title: category && poetic ? `${category}\n${poetic}` : data.title,
            subtitle: "",
            mantra: String((data as any).vetorTitle || data.energySubtitle || "")
              .replace(/\s*—\s*/, " ✦ "),
            snippet: summarizeVetorAnalysis(
              (data as any).vetorAnalysis,
              Number((data as any).vetorScore || 0),
              preferredName
            ),
          };
        })()
      : data.isMoonReading
      ? {
          title: data.title,
          subtitle: "Lua de Nascimento",
          mantra: String((data as any).moonBirthTitle || data.energySubtitle || ""),
          snippet: truncateToBoundary((data as any).moonBirthAnalysis || data.gift, 520),
        }
      : {
          title: data.title,
          subtitle: data.energySubtitle,
          mantra: data.anchorPhrase,
          snippet: data.gift,
        }
    : null;

  React.useEffect(() => {
    setActiveTab("tropical");
    // Reset meditation state on path change
    setMeditationAudioUrl(null);
    setMeditationLoading(false);
    setJournalText("");
    setHouseMantra("");
    setIsShareModalOpen(false);
    setIsPdfModalOpen(false);
  }, [data?.id]);

  // Busca o mantra do Dom Manifestado quando a aba Síntese de uma Casa estiver aberta
  React.useEffect(() => {
    if (!data?.isHouseReading || activeTab !== "sintese" || !data?.id) {
      setHouseMantra("");
      return;
    }

    const domText = (data.sintese as any)?.dom || data.gift || "";
    if (!domText || typeof domText !== "string") {
      setHouseMantra("");
      return;
    }

    let cancelled = false;
    fetch("/api/house-mantra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, houseId: data.id, domText })
    })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error("HTTP " + res.status))))
      .then(res => {
        if (!cancelled && res?.mantra) setHouseMantra(res.mantra);
      })
      .catch(err => {
        console.warn("[ReadingPanel] Falha ao buscar mantra:", err);
      });

    return () => { cancelled = true; };
  }, [data?.id, data?.isHouseReading, activeTab, userId]);

  // Busca sob demanda da aba de Casa atualmente selecionada (Dinâmica Psíquica / Védico / Síntese).
  // Cada aba só é gerada na Gemini quando o usuário efetivamente a abre, e o resultado é
  // persistido pelo backend em "user_readings" para nunca mais ser regenerado.
  React.useEffect(() => {
    if (!data || !data.id.startsWith("casa-") || !profile || !isHouseUnlocked) return;

    const alreadyLoaded =
      activeTab === "tropical" ? !!data.tropical?.leitura_psicologica :
      activeTab === "vedic" ? !!data.vedic?.leitura_karmica :
      !!(data.sintese as any)?.texto;

    if (alreadyLoaded) return;

    let cancelled = false;
    setIsTabLoading(true);
    fetch("/api/generate-house-reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, houseId: data.id, section: activeTab, userId })
    })
      .then(res => {
        if (!res.ok) throw new Error("Falha ao buscar leitura da casa");
        return res.json();
      })
      .then(result => {
        if (cancelled) return;
        if (result.reading && onUpdateAiReading) {
          onUpdateAiReading(data.id, {
            ...data,
            ...result.reading,
            isHouseReading: true
          } as Partial<ReadingData>);
        }
      })
      .catch(err => {
        console.error("Erro ao carregar aba da casa astrológica:", err);
      })
      .finally(() => {
        if (!cancelled) setIsTabLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, data?.id, profile, userId, isHouseUnlocked]);

  const buildMeditationSourceText = useCallback((readingData: ReadingData) => {
    const rd = readingData as any;
    const parts: string[] = [];
    const pathName = (PATH_TITLES_BY_ID[rd.id as string] || "Caminho").toUpperCase();

    const add = (label: string, value?: string) => {
      const v = (value || "").trim();
      if (v) parts.push(`${label}:\n${v}`);
    };

    add("VERSAO_FONTE", "v2");
    add("CÓDIGO DE ANCORAGEM", rd.frase_didatica || rd.anchorPhrase);
    add("DESAFIO EVOLUTIVO", rd.tensao_evolucionaria || rd.evolutionaryTension);
    add(pathName, rd.integracao || rd.integration);
    add("ARMADILHA", rd.armadilha || rd.trap);
    add("DOM MANIFESTADO", rd.dom || rd.gift);
    add("FONTE ASTROLÓGICA", rd.fonte_astrologica || rd.astrologicalSource);
    add(`PEDIDO DE ${pathName}`, rd.subtitulo_energia || rd.energySubtitle || rd.coherenceDashboard);

    if (parts.length <= 1) {
      const fallback = (rd.texto || rd.text || rd.body || "").trim();
      if (fallback) parts.push(fallback);
    }

    return parts.join("\n\n");
  }, []);

  // Fetch existing meditation data whenever a meditation-enabled path is opened.
  // Só reaproveita o áudio salvo se o texto-fonte for exatamente o mesmo da leitura atual —
  // caso a leitura tenha sido regenerada/alterada, exibe o botão "Gerar Meditação" novamente.
  React.useEffect(() => {
    if (data?.id && userId && isPathUnlocked && (MEDITATION_ENABLED_PATH_IDS as readonly string[]).includes(data.id)) {
      const currentSourceText = buildMeditationSourceText(data);
      fetch(`/api/meditation/journal?userId=${userId}&pathId=${data.id}`)
        .then(r => r.json())
        .then(res => {
          if (res.audioUrl && res.sourceText && res.sourceText === currentSourceText) {
            setMeditationAudioUrl(res.audioUrl);
          }
          if (res.journalText) setJournalText(res.journalText);
        })
        .catch(() => {});
    }
  }, [data?.id, userId, buildMeditationSourceText, isPathUnlocked]);

  const handleGenerateMeditation = useCallback(async () => {
    if (!data || !(MEDITATION_ENABLED_PATH_IDS as readonly string[]).includes(data.id) || !userId || !isPathUnlocked) return;
    setMeditationLoading(true);
    try {
      const pathTitle = PATH_TITLES_BY_ID[data.id] || data.title || data.id;
      const sourceText = buildMeditationSourceText(data);
      const response = await fetch("/api/meditation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          pathId: data.id,
          sourceText,
          pathTitle,
          gender: userGender || "feminino",
          gender_preference: userGenderPreference,
        }),
      });
      const result = await response.json();
      if (result.audioUrl) {
        setMeditationAudioUrl(result.audioUrl);
      }
      if (result.journalText) {
        setJournalText(result.journalText);
      }
    } catch (err) {
      console.error("[MeditationPlayer] Erro ao gerar meditação:", err);
    } finally {
      setMeditationLoading(false);
    }
  }, [data, userId, userGender, isPathUnlocked]);

  if (!data) return null;

  const tropicalReading = data.isHouseReading && data.tropical?.leitura_psicologica
    ? parseTropicalReading(data.tropical.leitura_psicologica)
    : { body: "", summary: "" };

  const glossarySource = data.isHouseReading
    ? [
        data.tropical?.leitura_psicologica,
        data.tropical?.resumo_basico,
        (data.tropical as any)?.dinamica_mundo_interno,
        data.vedic?.leitura_karmica,
        data.vedic?.resumo_basico,
        data.vedic?.qualidades_e_drishtis,
        (data.sintese as any)?.texto,
        data.astrologicalSource,
        data.fonte_astrologica
      ].filter(Boolean).join("\n\n")
    : [data.astrologicalSource, data.fonte_astrologica, (data as any).coherenceDashboard].filter(Boolean).join("\n\n");



  return (
    <>
      <AnimatePresence>
        {isOpen && data && (
        <>
          {/* Backdrop Overlay for mobile screens */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#3c352d] z-40 lg:hidden"
          />

          {/* Drawer Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            id="reading-drawer"
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] md:w-[520px] lg:w-[42vw] lg:max-w-2xl bg-[#f4f1eb]/98 backdrop-blur-md z-50 shadow-[-15px_0_45px_rgba(74,63,53,0.14)] border-l border-[#8c7f70]/15 flex flex-col"
          >
            {/* Header with Close Button */}
            <div className="flex items-center justify-between px-8 sm:px-12 py-6 border-b border-[#8c7f70]/10">
              <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#8c7f70] font-semibold">
                {data.id.startsWith("casa-") ? "Casa Astrológica • Análise Alquímica" : "Diretrizes de Força • Análise Individual"}
              </span>
              <button
                id="close-drawer-button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[#8c7f70]/10 text-[#8c7f70] hover:text-[#5c4d66] transition-colors focus:outline-none focus:ring-1 focus:ring-[#5c4d66]/30"
                aria-label="Fechar painel"
              >
                <X className="w-5 h-5 stroke-[1.25]" />
              </button>
            </div>

            {/* Tabs Selector (Only for houses) */}
            {data.id.startsWith("casa-") && !isLoading && isHouseUnlocked && (
              <div className="flex border-b border-[#8c7f70]/10 bg-[#ede9de]/20 px-8 sm:px-12">
                <button
                  onClick={() => setActiveTab("tropical")}
                  className={`py-3 text-xs font-sans tracking-wider uppercase font-medium border-b-2 transition-all mr-6 flex items-center gap-1.5 ${
                    activeTab === "tropical"
                      ? "border-[#5c4d66] text-[#5c4d66] border-b-[#5c4d66]"
                      : "border-transparent text-[#8c7f70] hover:text-[#5c4d66]"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Dinâmica Psíquica
                </button>
                <button
                  onClick={() => setActiveTab("vedic")}
                  className={`py-3 text-xs font-sans tracking-wider uppercase font-medium border-b-2 transition-all mr-6 flex items-center gap-1.5 ${
                    activeTab === "vedic"
                      ? "border-[#5c4d66] text-[#5c4d66] border-b-[#5c4d66]"
                      : "border-transparent text-[#8c7f70] hover:text-[#5c4d66]"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  Fundação da Alma
                </button>
                <button
                  onClick={() => setActiveTab("sintese")}
                  className={`py-3 text-xs font-sans tracking-wider uppercase font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "sintese"
                      ? "border-[#5c4d66] text-[#5c4d66] border-b-[#5c4d66]"
                      : "border-transparent text-[#8c7f70] hover:text-[#5c4d66]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Síntese
                </button>
              </div>
            )}

            {/* Scrollable Content Container */}
            <div className="flex-grow overflow-y-auto px-8 py-10 sm:px-12 sm:py-12">
              {isLoading ? (
                /* Premium Skeleton Loader */
                <div className="space-y-8 animate-pulse">
                  <div>
                    <div className="h-7 bg-[#8c7f70]/20 rounded-md w-3/4 mb-3" />
                    <div className="h-4 bg-[#8c7f70]/10 rounded-md w-1/2" />
                  </div>
                  <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                    <div className="h-4 bg-[#8c7f70]/15 rounded-md w-5/6" />
                  </div>
                  <div className="space-y-6">
                    <div className="pl-4 border-l border-[#8c6239]/20 space-y-2">
                      <div className="h-3 bg-[#8c6239]/20 rounded w-1/4" />
                      <div className="h-4 bg-[#8c7f70]/10 rounded w-full" />
                      <div className="h-4 bg-[#8c7f70]/10 rounded w-5/6" />
                    </div>
                    <div className="pl-4 border-l border-[#5c4d66]/20 space-y-2">
                      <div className="h-3 bg-[#5c4d66]/20 rounded w-1/4" />
                      <div className="h-4 bg-[#8c7f70]/10 rounded w-full" />
                      <div className="h-4 bg-[#8c7f70]/10 rounded w-4/5" />
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div
                  key={`${data.id}-${activeTab}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-8"
                >
                  {/* Title Section */}
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-light tracking-[0.15em] uppercase text-[#3c352d] leading-snug">
                      {PATH_TITLES_BY_ID[data.id] || data.title}
                    </h2>
                      <p className="mt-2 font-serif italic text-xs sm:text-sm text-[#8c6239] leading-relaxed">
                        {data.isVetorReading
                          ? getReadingSubtitle(data.title).poetic
                          : activeTab === "tropical"
                          ? ""
                          : activeTab === "vedic"
                          ? ""
                          : data.energySubtitle}
                      </p>
                    </div>

                  {/* Custom Vetor de Força or Moon Reading or 3-Tab Layout for Houses */}
                  {data.isMoonReading ? (
                    <div className="space-y-6">
                      {(data as any).isMoonBirthPhase === false ? (
                        <>
                          <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                            <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#8c6239] block mb-1">
                              {(data as any).moonBirthTitle}
                            </span>
                            <p className="font-sans text-xs sm:text-[14px] font-medium tracking-[0.05em] text-[#4a3f35] leading-relaxed">
                              {data.moonBirthAnalysis}
                            </p>
                          </div>

                          <p className="font-sans text-xs sm:text-[13px] text-[#6e6356] leading-relaxed font-light">
                            {(data as any).moonOrientation}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                            <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#8c6239] block mb-1">
                              Lua de Nascimento — Destaque
                            </span>
                            <p className="font-sans text-xs sm:text-[14px] font-medium tracking-[0.05em] uppercase text-[#4a3f35] leading-relaxed">
                              {data.moonBirthTitle}
                            </p>
                          </div>

                          <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-2">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                              Missão e Vetor de Propósito
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                              {data.moonBirthAnalysis}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  ) : data.isVetorReading ? (
                    <div className="space-y-6">
                      <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                        <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#8c6239] block mb-1">
                          {Number((data as any).vetorScore || 0) >= 3 ? "Diretriz de Força" : "Potencial de Desenvolvimento"}
                        </span>
                        <p className="font-sans text-xs sm:text-[11px] font-medium tracking-[0.15em] uppercase text-[#6e6356] leading-relaxed">
                          {String(data.vetorTitle || "").replace(/\s*—\s*/, " ✦ ")}
                        </p>
                      </div>

                      <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-2">
                        <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                          Análise Alquímica Editorial
                        </span>
                        <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                          {data.vetorAnalysis}
                        </p>
                      </div>

                      <div className="p-4 bg-[#ede9de]/30 rounded-lg border border-[#8c7f70]/15 mt-4 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#8c6239] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[#6e6356] font-sans font-light leading-relaxed">
                          Esta diretriz de força revela o fluxo de energia sutil no seu mapa natal. A contagem revela <strong>{data.vetorScore} {data.vetorScore === 1 ? "planeta/ponto" : "planetas/pontos"}</strong> nesta diretriz de força.
                        </p>
                      </div>
                    </div>
                  ) : data.id.startsWith("casa-") ? !isHouseUnlocked ? (
                    <PaywallBarrier
                      subscriptionTier={subscriptionTier}
                      userId={userId}
                      userEmail={userEmail}
                      fullName={fullName}
                      onUpgradeSuccess={onUpgradeSuccess}
                      title="Casa Astrológica Bloqueada"
                      description="Desbloqueie todas as 12 casas, védico, síntese alquímica e meditações no portal PLUS."
                    >
                      <div className="space-y-6">
                        <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                          <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#8c6239] block mb-1">
                            Propósito da Casa
                          </span>
                          <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                            {data.anchorPhrase}
                          </p>
                        </div>

                        <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-1.5">
                          <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                            A Tensão Evolucionária
                          </span>
                          <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                            {data.evolutionaryTension}
                          </p>
                        </div>

                        <div className="relative pl-4 border-l border-[#5c4d66]/20 space-y-1.5">
                          <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#5c4d66]">
                            A Integração de Força
                          </span>
                          <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                            {data.integration}
                          </p>
                        </div>

                        <div className="relative pl-4 border-l border-red-800/10 space-y-1.5">
                          <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-red-800/70">
                            A Armadilha Psíquica
                          </span>
                          <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                            {data.trap}
                          </p>
                        </div>

                        <div className="relative pl-4 border-l border-emerald-800/20 space-y-1.5">
                          <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-800/80">
                            O Dom Manifestado
                          </span>
                          <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                            {data.gift}
                          </p>
                        </div>
                      </div>
                    </PaywallBarrier>
                  ) : (
                    <>
                      {isTabLoading && (
                        <div className="flex items-center gap-2 py-10 justify-center text-[#8c6239] text-[11px] font-sans uppercase tracking-wider">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gerando leitura desta aba...
                        </div>
                      )}

                      {!isTabLoading && activeTab === "tropical" && (
                        <div className="space-y-6">
                          {tropicalReading.summary && (
                            <div className="relative pl-4 border-l border-[#8c7f70]/20 space-y-1.5">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c7f70]">
                                A Costura do seu Céu:
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                                {tropicalReading.summary}
                              </p>
                            </div>
                          )}

                          <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                            <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#8c6239] block mb-1">
                              Foco Comportamental
                            </span>
                            <p className="font-sans text-[11px] font-medium tracking-[0.15em] uppercase text-[#6e6356] leading-relaxed">
                              {data.isHouseReading && data.tropical?.resumo_basico
                                ? data.tropical.resumo_basico
                                : data.anchorPhrase}
                            </p>
                          </div>

                          <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-2">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                              Leitura Psicológica e Dinâmica do Regente
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                              {data.isHouseReading && tropicalReading.body
                                ? tropicalReading.body
                                : "Com base no signo presente na cúspide desta casa, há uma coloração psicológica singular que molda como você se expressa. Rastreando o regente desta casa, sua posição no mapa direciona o foco da sua energia vital."}
                            </p>
                          </div>

                          {data.isHouseReading && (data.tropical as any)?.dinamica_mundo_interno?.trim() && (
                            <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-2">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                                A Dinâmica do seu Mundo Interno (Planetas Ocupantes)
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                                {(data.tropical as any).dinamica_mundo_interno}
                              </p>
                            </div>
                          )}
                          
                          {!data.isHouseReading && (
                            <div className="p-4 bg-[#ede9de]/30 rounded-lg border border-[#8c7f70]/15 mt-4 flex items-start gap-2.5">
                              <ShieldAlert className="w-4 h-4 text-[#8c6239] shrink-0 mt-0.5" />
                              <p className="text-[11px] text-[#6e6356] font-sans font-light leading-relaxed">
                                <strong>Análise de Fallback Ativa:</strong> A chave de API do Gemini ainda não gerou ou falhou em preencher a leitura profunda do regente para este mapa específico.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {!isTabLoading && activeTab === "vedic" && (
                        <PaywallBarrier
                          subscriptionTier={isHouseUnlocked ? "PLUS" : "FREE"}
                          userId={userId}
                          userEmail={userEmail}
                          fullName={fullName}
                          onUpgradeSuccess={onUpgradeSuccess}
                          title="Ancoragem de Alma Sideral"
                          description="Desbloqueie a análise estrutural evolutiva da alma védica sideral sob os Drishtis e Dusthanas."
                        >
                          {(() => {
                            const sideralReading =
                              data.isHouseReading && data.vedic?.leitura_karmica
                                ? parseSideralReading(data.vedic.leitura_karmica)
                                : { intro: "", blocks: [], summary: "" };

                            return (
                              <div className="space-y-6">
                                {sideralReading.summary && (
                                  <div className="relative pl-4 border-l border-[#8c7f70]/20 space-y-1.5">
                                    <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c7f70]">
                                      A Costura do seu Céu Sideral
                                    </span>
                                    <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                                      {sideralReading.summary}
                                    </p>
                                  </div>
                                )}

                                {data.isHouseReading && data.vedic?.resumo_basico?.trim() && (
                                  <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                                    <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#5c4d66] block mb-1">
                                      Foco Estrutural
                                    </span>
                                    <p className="font-sans text-[11px] font-medium tracking-[0.15em] uppercase text-[#6e6356] leading-relaxed">
                                      {data.vedic.resumo_basico}
                                    </p>
                                  </div>
                                )}

                                {sideralReading.intro && (
                                  <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                                    {sideralReading.intro}
                                  </p>
                                )}

                                {data.isHouseReading && data.vedic?.qualidades_e_drishtis?.trim() && (
                                  <div className="relative pl-4 border-l border-[#8c7f70]/20 space-y-2">
                                    <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c7f70]">
                                      Qualidades Estruturais e Influências (Ocupantes e Drishtis)
                                    </span>
                                    <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                                      {data.vedic.qualidades_e_drishtis}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </PaywallBarrier>
                      )}

                      {!isTabLoading && activeTab === "sintese" && (
                        <PaywallBarrier
                          subscriptionTier={isHouseUnlocked ? "PLUS" : "FREE"}
                          userId={userId}
                          userEmail={userEmail}
                          fullName={fullName}
                          onUpgradeSuccess={onUpgradeSuccess}
                          title="Síntese Alquímica Integrativa"
                          description="Acesse o fechamento alquímico unificado da casa, mapeando as tensões, maya e dons integrados."
                        >
                          {(() => {
                            const sinteseRaw = data.sintese as
                              | { texto?: string; pedido_integracao?: string; tensao_evolucionaria?: string; integracao?: string; armadilha?: string; dom?: string }
                              | undefined;
                            const rawText = data.isHouseReading && sinteseRaw?.texto ? sinteseRaw.texto : "";
                            const synthesis = rawText
                              ? parseSynthesisReading(rawText)
                              : { intro: "", blocks: [] };

                            const legacyBlocks = [
                              { title: "Pedido de Coerência", text: data.sintese?.pedido_integracao || data.anchorPhrase, color: "text-[#8c6239]", border: "border-[#8c6239]/20" },
                              { title: "A Tensão Evolucionária / Força Consolidada", text: data.sintese?.tensao_evolucionaria || data.evolutionaryTension, color: "text-[#8c6239]", border: "border-[#8c6239]/20" },
                              { title: "A Integração de Força", text: data.sintese?.integracao || data.integration, color: "text-[#5c4d66]", border: "border-[#5c4d66]/20" },
                              { title: "A Armadilha Psíquica (Maya)", text: data.sintese?.armadilha || data.trap, color: "text-red-800/70", border: "border-red-800/10" },
                              { title: "O Dom Manifestado", text: data.sintese?.dom || data.gift, color: "text-emerald-800/80", border: "border-emerald-800/20" }
                            ];

                            const activeBlocks = synthesis.blocks.length > 0
                              ? synthesis.blocks.map((b, i) => ({
                                  title: b.title,
                                  text: b.content,
                                  color: SIDERAL_BLOCK_STYLES[i % SIDERAL_BLOCK_STYLES.length].title,
                                  border: SIDERAL_BLOCK_STYLES[i % SIDERAL_BLOCK_STYLES.length].border
                                }))
                              : legacyBlocks.slice(1);

                            return (
                              <div className="space-y-6">
                                <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                                  <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#5c4d66] block mb-1">
                                    Síntese Alquímica
                                  </span>
                                  <p className="font-sans text-[11px] font-medium tracking-[0.05em] text-[#6e6356] leading-relaxed italic normal-case">
                                    {houseMantra || "Os Caminhos da Síntese"}
                                  </p>
                                </div>

                                {synthesis.intro && (
                                  <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                                    {synthesis.intro}
                                  </p>
                                )}

                                {!synthesis.intro && activeBlocks === legacyBlocks.slice(1) && (
                                  <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                                    <p className="font-sans text-[11px] font-medium tracking-[0.15em] uppercase text-[#6e6356] leading-relaxed">
                                      {legacyBlocks[0].text}
                                    </p>
                                  </div>
                                )}

                                {activeBlocks.map((block, index) => (
                                  <div key={index} className={`relative pl-4 border-l ${block.border} space-y-1.5`}>
                                    <span className={`font-sans text-[10px] font-bold tracking-[0.15em] uppercase ${block.color}`}>
                                      {block.title}
                                    </span>
                                    <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                                      {block.text}
                                    </p>
                                  </div>
                                ))}

                                {data.isHouseReading && (
                                  <PresencePauseCard
                                    houseId={data.id}
                                    synthesisContext={{
                                      texto: sinteseRaw?.texto || "",
                                      tensao_evolucionaria: sinteseRaw?.tensao_evolucionaria || data.evolutionaryTension,
                                      integracao: sinteseRaw?.integracao || data.integration,
                                      armadilha: sinteseRaw?.armadilha || data.trap,
                                      dom: sinteseRaw?.dom || data.gift,
                                    }}
                                    userId={userId}
                                    profile={profile}
                                  />
                                )}
                              </div>
                            );
                          })()}
                        </PaywallBarrier>
                      )}
                    </>
                  ) : data.id === "caminho-assimilacao" || data.id === "caminho-manifestacao" || data.id === "caminho-transformacao" || data.id === "eixo-asc" || data.id === "eixo-ic" || data.id === "eixo-dsc" || data.id === "eixo-mc" ? (
                    <PaywallBarrier
                      subscriptionTier={isPathUnlocked ? "PLUS" : "FREE"}
                      userId={userId}
                      userEmail={userEmail}
                      fullName={fullName}
                      onUpgradeSuccess={onUpgradeSuccess}
                      title="Caminho Bloqueado"
                      description="Desbloqueie este eixo e os demais caminhos evolutivos no portal PLUS."
                    >
                      <div className="space-y-6">
                      <>
                          <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                            <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#8c6239] block mb-1">
                              {PATH_TITLES_BY_ID[data.id] || "Caminho"}
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                              {data.anchorPhrase}
                            </p>
                          </div>

                          <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                              O Desafio Evolutivo
                            </span>
                            <p className="font-sans text-[11px] italic text-[#8c6239]/80 leading-relaxed">
                              {PATH_CHALLENGE_QUESTION[data.id] || "O que pode bloquear sua expressão mais autêntica?"}
                            </p>
                            <p className="font-sans text-xs sm:text-[13px] italic text-[#4a3f35] leading-relaxed">
                              Desdobrando a Sombra e o Escudo de Proteção
                            </p>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                              {removeLeadingDeepReadingSubtitle(data.evolutionaryTension || "", "Desdobrando a Sombra e o Escudo de Proteção")}
                            </p>
                          </div>

                          <div className="relative pl-4 border-l border-[#5c4d66]/20 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#5c4d66]">
                              {PATH_TITLES_BY_ID[data.id] || "O Caminho"}
                            </span>
                            <p className="font-sans text-[11px] italic text-[#5c4d66]/80 leading-relaxed">
                              {PATH_INTEGRATION_QUESTION[data.id] || "Como integrar a autenticidade no seu dia-a-dia?"}
                            </p>
                            <p className="font-sans text-xs sm:text-[13px] italic text-[#4a3f35] leading-relaxed">
                              Acionar o Princípio Orientador: Integrando as Estrelas-Guias
                            </p>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                              {removeLeadingDeepReadingSubtitle(data.integration || "", "Acionar o Princípio Orientador: Integrando as Estrelas-Guias")}
                            </p>
                          </div>

                          {(() => {
                            const giftSubtitle = PATH_GIFT_SUBTITLE[data.id] || "A Expressão Real: Sua Virtude Nativa e o Pulso de Criação";
                            const transpessoalSplit = (data.id === "caminho-transformacao" || data.id === "caminho-manifestacao") ? splitTranspessoalBlock(data.gift || "") : null;
                            return (
                              <div className="relative pl-4 border-l border-emerald-800/20 space-y-1.5">
                                <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-800/80">
                                  O Dom em Ação
                                </span>
                                <p className="font-sans text-[11px] italic text-emerald-800/70 leading-relaxed">
                                  {PATH_GIFT_QUESTION[data.id] || "Qual dom eu trago para expressar minha verdade?"}
                                </p>
                                <p className="font-sans text-xs sm:text-[13px] italic text-[#4a3f35] leading-relaxed">
                                  {giftSubtitle}
                                </p>
                                {transpessoalSplit ? (
                                  <>
                                    <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                                      {removeLeadingDeepReadingSubtitle(transpessoalSplit.main, giftSubtitle)}
                                    </p>
                                    <p className="font-sans text-[11px] italic text-emerald-800/70 leading-relaxed">
                                      {transpessoalSplit.title}
                                    </p>
                                    <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                                      {transpessoalSplit.body}
                                    </p>
                                  </>
                                ) : (
                                  <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                                    {removeLeadingDeepReadingSubtitle(data.gift || "", giftSubtitle)}
                                  </p>
                                )}
                              </div>
                            );
                          })()}

                          {/* Meditação Alquímica — disponível para todos os 7 caminhos */}
                          {(MEDITATION_ENABLED_PATH_IDS as readonly string[]).includes(data.id) && (
                            <div className="mt-8 space-y-4">
                              <MeditationPlayer
                                audioUrl={meditationAudioUrl}
                                isLoading={meditationLoading}
                                onGenerate={handleGenerateMeditation}
                                userId={userId}
                                pathId={data.id}
                                title={data.title}
                                gender={userGender}
                                genderPreference={userGenderPreference}
                              />
                              <AlchemyJournal
                                userId={userId}
                                pathId={data.id}
                                initialText={journalText}
                              />
                            </div>
                          )}
                        </>
                    </div>
                    </PaywallBarrier>
                  ) : data.id.startsWith("caminho-") ? (
                    /* Locked Caminhos Layout */
                    <PaywallBarrier
                      subscriptionTier={subscriptionTier}
                      userId={userId}
                      userEmail={userEmail}
                      fullName={fullName}
                      onUpgradeSuccess={onUpgradeSuccess}
                      title="Caminho Bloqueado"
                      description="Desbloqueie a análise deste caminho especial."
                    >
                      <div className="space-y-6">
                        {/* Anchor Phrase */}
                        <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                          <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#8c6239] block mb-1">
                            Propósito do Caminho
                          </span>
                          <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                            {data.anchorPhrase}
                          </p>
                        </div>

                        {/* Body Blocks - Editorial style */}
                        <div className="space-y-6">
                          {/* Bloco 1: A tensão evolucionária */}
                          <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                              A Tensão Evolucionária
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.evolutionaryTension}
                            </p>
                          </div>

                          {/* Bloco 2: A integração */}
                          <div className="relative pl-4 border-l border-[#5c4d66]/20 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#5c4d66]">
                              A Integração de Força
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.integration}
                            </p>
                          </div>

                          {/* Bloco 3: A armadilha */}
                          <div className="relative pl-4 border-l border-red-800/10 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-red-800/70">
                              A Armadilha Psíquica
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.trap}
                            </p>
                          </div>

                          {/* Bloco 4: O dom */}
                          <div className="relative pl-4 border-l border-emerald-800/20 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-800/80">
                              O Dom Manifestado
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.gift}
                            </p>
                          </div>
                        </div>
                      </div>
                    </PaywallBarrier>
                  ) : (
                    /* Classic Single-Tab Layout for Eixos / Other Points (FREE/PLUS with granular logic) */
                    <>
                      {/* Anchor Phrase */}
                      <div className="border-y border-[#8c7f70]/15 py-4 my-2">
                        <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#8c6239] block mb-1">
                          Propósito Geral
                        </span>
                        <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light whitespace-pre-line">
                          {data.anchorPhrase}
                        </p>
                      </div>

                      {/* Body Blocks - Editorial style */}
                      {(data.id === "eixo-ic" || data.id === "eixo-mc") ? (
                        <PaywallBarrier
                          subscriptionTier={subscriptionTier}
                          userId={userId}
                          userEmail={userEmail}
                          fullName={fullName}
                          onUpgradeSuccess={onUpgradeSuccess}
                          title={`${data.title} Bloqueado`}
                          description={`Desbloqueie a análise estrutural evolutiva profunda do seu ${data.title} no portal PLUS.`}
                        >
                          <div className="space-y-6">
                            {/* Bloco 1: A tensão evolucionária */}
                            <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-1.5">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                                A Tensão Evolucionária
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                                {data.evolutionaryTension}
                              </p>
                            </div>

                            {/* Bloco 2: A integração */}
                            <div className="relative pl-4 border-l border-[#5c4d66]/20 space-y-1.5">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#5c4d66]">
                                A Integração de Força
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                                {data.integration}
                              </p>
                            </div>

                            {/* Bloco 3: A armadilha */}
                            <div className="relative pl-4 border-l border-red-800/10 space-y-1.5">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-red-800/70">
                                A Armadilha Psíquica
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                                {data.trap}
                              </p>
                            </div>

                            {/* Bloco 4: O dom */}
                            <div className="relative pl-4 border-l border-emerald-800/20 space-y-1.5">
                              <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-800/80">
                                O Dom Manifestado
                              </span>
                              <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                                {data.gift}
                              </p>
                            </div>
                          </div>
                        </PaywallBarrier>
                      ) : (
                        <div className="space-y-6">
                          {/* Bloco 1: A tensão evolucionária */}
                          <div className="relative pl-4 border-l border-[#8c6239]/20 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8c6239]">
                              A Tensão Evolucionária
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.evolutionaryTension}
                            </p>
                          </div>

                          {/* Bloco 2: A integração */}
                          <div className="relative pl-4 border-l border-[#5c4d66]/20 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#5c4d66]">
                              A Integração de Força
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.integration}
                            </p>
                          </div>

                          {/* Bloco 3: A armadilha */}
                          <div className="relative pl-4 border-l border-red-800/10 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-red-800/70">
                              A Armadilha Psíquica
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.trap}
                            </p>
                          </div>

                          {/* Bloco 4: O dom */}
                          <div className="relative pl-4 border-l border-emerald-800/20 space-y-1.5">
                            <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-800/80">
                              O Dom Manifestado
                            </span>
                            <p className="font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed font-light">
                              {data.gift}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer with Technical Validation */}
            {glossarySource && <AstrologicalSourceFooter source={glossarySource} />}

            {isShareable && shareStoryData && (
              <ShareInviteCard
                onShare={() => setIsShareModalOpen(true)}
                onUnlock={() => setIsPdfModalOpen(true)}
              />
            )}
          </motion.div>
        </>
      )}
      </AnimatePresence>

      {shareStoryData && (
        <StoryShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          data={shareStoryData as StoryData}
        />
      )}

      <PdfUnlockModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        profile={profile}
        fullName={fullName}
      />
    </>
  );
}
