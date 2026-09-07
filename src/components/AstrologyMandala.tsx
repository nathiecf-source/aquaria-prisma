import React from "react";
import { getReadingForId, ReadingData } from "../data/mockReadings";
import ReadingPanel from "./ReadingPanel";
import { ArrowLeft, User, X, Loader2 } from "lucide-react";
import TechnicalDataModal from "./TechnicalDataModal";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import TransitPanel, { ActiveTransit } from "./TransitPanel";
import MinhaExperienciaTab from "./MinhaExperienciaTab";
import { PaywallBarrier } from "./PaywallBarrier";
import { Accordion } from "./Accordion";
import PlanetGlyphBar from "./PlanetGlyphBar";
import { PlanetaryDynamicsPanel } from "./PlanetaryDynamicsPanel";
import { hasPlusAccess, hasChamadoFeature } from "../lib/access";
import ChamadoTimer from "./ChamadoTimer";
import PlanetReadingPanel from "./PlanetReadingPanel";
import { PLANET_GLYPHS } from "../lib/planetGlyphs";
import { RenewalPopup } from "./RenewalPopup";

interface DiretrizAmplaData {
  intro: string;
  blocks: { title: string; content: string }[];
}

const MOON_PHASES = {
  "lua-nova": {
    phase: "Nova",
    name: "Lua Nova",
    summary: "O momento de silêncio absoluto onde a intenção é plantada na escuridão fértil do ser."
  },
  "lua-crescente": {
    phase: "Crescente",
    name: "Lua Crescente",
    summary: "A fase de ação e superação de obstáculos, onde a energia se expande para manifestar o que foi semeado."
  },
  "lua-cheia": {
    phase: "Cheia",
    name: "Lua Cheia",
    summary: "O ápice da visibilidade e da consciência, onde a verdade interna se ilumina e se entrega ao mundo."
  },
  "lua-minguante": {
    phase: "Minguante",
    name: "Lua Minguante",
    summary: "A fase de soltar com consciência, criando espaço, transmutando o peso do passado e desapegando do que não serve mais."
  }
} as const;

const getNatalMoonPhase = (profile: any): string => {
  const sun = profile?.tropical_natal?.planets?.find((planet: any) => planet.name === "Sol");
  const moon = profile?.tropical_natal?.planets?.find((planet: any) => planet.name === "Lua");
  const signs = ["Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem", "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"];
  if (!sun || !moon) return "Nova";

  const sunLongitude = signs.indexOf(sun.sign) * 30 + sun.degree;
  const moonLongitude = signs.indexOf(moon.sign) * 30 + moon.degree;
  const difference = (moonLongitude - sunLongitude + 360) % 360;
  if (difference < 90) return "Nova";
  if (difference < 180) return "Crescente";
  if (difference < 270) return "Cheia";
  return "Minguante";
};

function calculateAge(birthDateStr?: string): number | undefined {
  if (!birthDateStr) return undefined;
  const [year, month, day] = birthDateStr.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age--;
  }
  return age;
}

interface AstrologyMandalaProps {
  highlights?: string[];
  visualState?: {
    houses: {
      id: number;
      state: 'tropical-active' | 'vedic-active' | 'intersect-active' | 'inactive';
      element?: 'fire' | 'earth' | 'air' | 'water';
      elementClass?: string;
      stateClass?: string;
    }[];
    petals: string[];
  };
  aiReadings?: Record<string, Partial<ReadingData>>;
  profile?: any;
  onUpdateAiReading?: (id: string, reading: Partial<ReadingData>) => void;
  onBackToForm?: () => void;
  userName?: string;
  userProfile?: any;
  onUpgradeSuccess?: () => void;
}

// Elementos da mandala gratuitos no plano FREE.
// Todo o restante exibe cadeado e abre o paywall.
const FREE_MANDALA_IDS = new Set(["eixo-asc"]);
const MANDALA_LOCKABLE_IDS = [
  "caminho-assimilacao",
  "caminho-transformacao",
  "caminho-manifestacao",
  "eixo-mc",
  "eixo-ic",
  "eixo-dsc",
  // Casas angulares (1, 4, 7, 10) permanecem gratuitas no FREE.
  "casa-2", "casa-3", "casa-5", "casa-6", "casa-8", "casa-9", "casa-11", "casa-12",
];

function getMandalaFeatureKey(elementId: string): string {
  if (elementId.startsWith("casa-")) {
    const match = elementId.match(/(\d+)/);
    return match ? `casa_${match[1]}` : elementId;
  }
  return elementId;
}

function isMandalaElementLocked(elementId: string, userProfile: any): boolean {
  if (hasPlusAccess(userProfile)) return false;
  if (FREE_MANDALA_IDS.has(elementId)) return false;
  if (!MANDALA_LOCKABLE_IDS.includes(elementId)) return false;
  return !hasChamadoFeature(userProfile, getMandalaFeatureKey(elementId));
}

// Cadeado base: fino, cinza discreto e centralizado no ponto fornecido.
const MandalaLockIcon: React.FC<{ cx: number; cy: number; size?: number }> = ({ cx, cy, size = 12 }) => {
  const scale = size / 16;
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale})`} className="pointer-events-none">
      <rect x="-5" y="-1" width="10" height="7.5" rx="1.5" fill="none" stroke="#8c7f70" strokeWidth="1.2" opacity="0.85" />
      <path
        d="M -3 -1 V -4.5 A 3.2 3.2 0 0 1 3 -4.5 V -1"
        fill="none"
        stroke="#8c7f70"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="0" cy="2.5" r="1.1" fill="#8c7f70" opacity="0.85" />
    </g>
  );
};

// Cadeado no topo interno dos círculos de Caminhos/Eixos.
const MandalaLockIconTop: React.FC<{ cx: number; cy: number; r?: number; size?: number }> = ({ cx, cy, r = 26, size = 12 }) => {
  const offsetY = r * 0.42;
  return <MandalaLockIcon cx={cx} cy={cy - offsetY} size={size} />;
};

// Cadeado acima do rótulo das casas.
const MandalaLockIconAbove: React.FC<{ cx: number; cy: number; offset?: number; size?: number }> = ({ cx, cy, offset = 13, size = 10 }) => {
  return <MandalaLockIcon cx={cx} cy={cy - offset} size={size} />;
};

interface DiretrizAmplaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  data: DiretrizAmplaData | null;
  setHoveredElements: (elements: string[]) => void;
}

interface TransitsCyclesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  text: string | null;
}

const TransitsCyclesDrawer: React.FC<TransitsCyclesModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  text
}) => {
  return (
    <>
      {/* Overlay for Mobile */}
      <div 
        className={`fixed inset-0 z-40 bg-[#3c352d]/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[480px] md:w-[520px] lg:w-[40vw] lg:max-w-2xl bg-[#f4f1eb] shadow-[-15px_0_45px_rgba(74,63,53,0.14)] border-l border-[#8c7f70]/20 flex flex-col transform transition-transform duration-500 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="sticky top-0 bg-[#f4f1eb]/95 backdrop-blur z-10 flex items-center justify-between p-6 sm:p-8 border-b border-[#8c7f70]/10">
          <h2 className="font-serif text-[#3c352d] text-lg sm:text-xl tracking-widest uppercase">
            Ciclos Ativos
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[#8c7f70] hover:text-[#3c352d] hover:bg-[#8c7f70]/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-4">
              <Loader2 className="w-8 h-8 text-[#8c6239] animate-spin" />
              <p className="font-mono text-xs text-[#8c7f70] tracking-widest uppercase animate-pulse">
                Sincronizando trânsitos planetários...
              </p>
            </div>
          ) : text ? (
            <div className="prose prose-sm sm:prose-base max-w-none text-[#5c544d] font-sans leading-relaxed text-justify space-y-6">
              <Markdown
                rehypePlugins={[rehypeSanitize]}
                components={{
                  h3: ({ node, children }) => (
                    <h3 className="font-serif text-[#8c6239] tracking-wider uppercase text-lg mt-10 mb-4 border-b border-[#8c7f70]/10 pb-2">
                      {children}
                    </h3>
                  ),
                  h4: ({ node, children }) => (
                    <h4 className="font-serif text-[#3c352d] tracking-wider uppercase text-base mt-8 mb-3 pb-1 border-b border-[#8c7f70]/5">
                      {children}
                    </h4>
                  ),
                  strong: ({ node, children }) => (
                    <strong className="font-semibold text-[#3c352d]">{children}</strong>
                  )
                }}
              >
                {text}
              </Markdown>
            </div>
          ) : (
            <div className="text-center py-12 text-[#8c7f70]">
              Nenhuma leitura disponível no momento.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

interface RightPanelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const RightPanelDrawer: React.FC<RightPanelDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className="fixed inset-0 z-40 bg-[#3c352d]/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-full sm:w-[480px] md:w-[520px] lg:w-[40vw] lg:max-w-2xl bg-[#f4f1eb] shadow-[-15px_0_45px_rgba(74,63,53,0.14)] border-l border-[#8c7f70]/20 flex flex-col transform transition-transform duration-500 ease-in-out"
      >
        <div className="sticky top-0 bg-[#f4f1eb]/95 backdrop-blur z-10 flex items-center justify-between p-4 sm:p-6 border-b border-[#8c7f70]/10">
          <h2 className="font-serif text-[#3c352d] text-base sm:text-lg tracking-widest uppercase truncate">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[#8c7f70] hover:text-[#3c352d] hover:bg-[#8c7f70]/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </div>
    </>
  );
};

function isValidDiretrizAmplaData(value: unknown): value is DiretrizAmplaData {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as DiretrizAmplaData).intro === "string" &&
    Array.isArray((value as DiretrizAmplaData).blocks)
  );
}

const MarkdownBlock: React.FC<{ content: string; setHoveredElements: (elements: string[]) => void }> = ({
  content,
  setHoveredElements
}) => (
  <div className="max-w-none text-[#5c544d] font-sans leading-relaxed text-justify">
    <Markdown
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      components={{
        p: ({ children }) => (
          <p className="mb-4 last:mb-0">{children}</p>
        ),
        li: ({ children }) => {
          const text = String(children);
          let elementsToHover: string[] = [];
          if (text.includes("Dinâmica Psíquica")) elementsToHover = Array.from({ length: 12 }, (_, i) => `casa-${i + 1}`);
          if (text.includes("Estrutura da Alma")) elementsToHover = Array.from({ length: 12 }, (_, i) => `casa-${i + 1}`);
          if (text.includes("A Tração")) elementsToHover = ["petal-fire", "petal-earth", "petal-air", "petal-water", "petala-cardeal", "petala-fixo", "petala-mutavel"];
          return (
            <li
              className="transition-colors duration-300 hover:text-[#8c6239] cursor-default"
              onMouseEnter={() => setHoveredElements(elementsToHover)}
              onMouseLeave={() => setHoveredElements([])}
            >
              {children}
            </li>
          );
        },
        h3: ({ children }) => (
          <h3 className="font-serif text-[#8c6239] tracking-wider uppercase text-base mt-6 mb-3 border-b border-[#8c7f70]/10 pb-2">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="font-serif text-[#3c352d] tracking-wider text-sm uppercase mt-5 mb-2">
            {children}
          </h4>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-[#3c352d]">{children}</strong>
        )
      }}
    >
      {content}
    </Markdown>
  </div>
);

const DiretrizAmplaDrawer: React.FC<DiretrizAmplaModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  data,
  setHoveredElements
}) => {
  const accordionItems = React.useMemo(() => {
    if (!data || !isValidDiretrizAmplaData(data)) return [];
    return data.blocks.map((block, index) => ({
      id: `block-${index}`,
      title: block.title,
      content: <MarkdownBlock content={block.content} setHoveredElements={setHoveredElements} />
    }));
  }, [data, setHoveredElements]);

  return (
    <>
      {/* Overlay for Mobile */}
      <div
        className={`fixed inset-0 z-40 bg-[#3c352d]/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[480px] md:w-[520px] lg:w-[40vw] lg:max-w-2xl bg-[#f4f1eb] shadow-[-15px_0_45px_rgba(74,63,53,0.14)] border-l border-[#8c7f70]/20 flex flex-col transform transition-transform duration-500 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="sticky top-0 bg-[#f4f1eb]/95 backdrop-blur z-10 flex items-center justify-between p-6 sm:p-8 border-b border-[#8c7f70]/10">
          <h2 className="font-serif text-[#3c352d] text-lg sm:text-xl tracking-widest uppercase">
            Visão Geral
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[#8c7f70] hover:text-[#3c352d] hover:bg-[#8c7f70]/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-4">
              <Loader2 className="w-8 h-8 text-[#8c6239] animate-spin" />
              <p className="font-mono text-xs text-[#8c7f70] tracking-widest uppercase">
                Sintetizando a matriz da alma...
              </p>
            </div>
          ) : data && isValidDiretrizAmplaData(data) ? (
            <div className="space-y-6">
              <div className="max-w-none text-[#5c544d] font-sans leading-relaxed text-justify">
                <Markdown
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-4 last:mb-0">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-[#3c352d]">{children}</strong>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="my-4 border-l-2 border-[#8c6239]/40 pl-4 italic text-[#8c6239]/90 text-sm">
                        {children}
                      </blockquote>
                    )
                  }}
                >
                  {data.intro}
                </Markdown>
              </div>
              <Accordion items={accordionItems} />
            </div>
          ) : (
            <p className="text-center text-[#8c7f70] font-sans h-full flex items-center justify-center">
              Nenhuma diretriz gerada.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default function AstrologyMandala({
  highlights,
  visualState,
  aiReadings,
  profile,
  onUpdateAiReading,
  onBackToForm,
  userName,
  userProfile,
  onUpgradeSuccess
}: AstrologyMandalaProps) {
  // 1. Gestão de Estado (State):
  // Controla quais elementos do mapa possuem uma concentração maior de 'diretrizes de força' e iniciam acesos (em destaque).
  const [activeElements, setActiveElements] = React.useState<string[]>(() => {
    const initialList: string[] = [];
    if (highlights && highlights.length > 0) {
      initialList.push(...highlights);
    }
    if (visualState) {
      if (visualState.petals) {
        initialList.push(...visualState.petals);
      }
      if (visualState.houses) {
        visualState.houses.forEach(h => {
          initialList.push(`casa-${h.id}`);
        });
      }
    }
    if (initialList.length > 0) {
      return Array.from(new Set(initialList));
    }
    return [
      "casa-1",
      "casa-5",
      "caminho-assimilacao",
      "eixo-mc",
      "lua-cheia",
      "petal-fire",
    ];
  });

  React.useEffect(() => {
    const list: string[] = [];
    if (highlights && highlights.length > 0) {
      list.push(...highlights);
    }
    if (visualState) {
      if (visualState.petals) {
        list.push(...visualState.petals);
      }
      if (visualState.houses) {
        visualState.houses.forEach(h => {
          list.push(`casa-${h.id}`);
        });
      }
    }
    if (list.length > 0) {
      setActiveElements(Array.from(new Set(list)));
    }
  }, [highlights, visualState]);

  const [selectedElementId, setSelectedElementId] = React.useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [isFetchingHouseReading, setIsFetchingHouseReading] = React.useState(false);
  const [isTechModalOpen, setIsTechModalOpen] = React.useState(false);
  
  const [isDiretrizModalOpen, setIsDiretrizModalOpen] = React.useState(false);
  const [diretrizData, setDiretrizData] = React.useState<DiretrizAmplaData | null>(null);
  const [isFetchingDiretriz, setIsFetchingDiretriz] = React.useState(false);
  const [hoveredDiretrizElements, setHoveredDiretrizElements] = React.useState<string[]>([]);

  const [isTransitsModalOpen, setIsTransitsModalOpen] = React.useState(false);
  const [transitsText, setTransitsText] = React.useState<string | null>(null);
  const [restructuringCycles, setRestructuringCycles] = React.useState<any[]>([]);
  const [isFetchingTransits, setIsFetchingTransits] = React.useState(false);
  const [dashaText, setDashaText] = React.useState<string | null>(null);
  const [isFetchingDashas, setIsFetchingDashas] = React.useState(false);
  const [profectionData, setProfectionData] = React.useState<any>(null);
  const [isFetchingProfection, setIsFetchingProfection] = React.useState(false);
  const [rapidActivationsData, setRapidActivationsData] = React.useState<any>(null);
  const [isFetchingRapidActivations, setIsFetchingRapidActivations] = React.useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = React.useState(false);
  const [isDynamicsOpen, setIsDynamicsOpen] = React.useState(false);
  const [isFetchingDynamics, setIsFetchingDynamics] = React.useState(false);
  const [dynamicsText, setDynamicsText] = React.useState<string | null>(null);
  const [paywallFeature, setPaywallFeature] = React.useState<"transits" | "insights" | "planets" | "caminhos" | "dynamics" | null>(null);

  const [selectedPlanetId, setSelectedPlanetId] = React.useState<string | null>(null);
  const [isPlanetPanelOpen, setIsPlanetPanelOpen] = React.useState(false);
  const [planetReadingsCache, setPlanetReadingsCache] = React.useState<Record<string, any>>({});

  const [activeTransit, setActiveTransit] = React.useState<ActiveTransit | null>(null);
  const subscriptionTier: "FREE" | "PLUS" = hasPlusAccess(userProfile) ? "PLUS" : "FREE";
  const portalAge = calculateAge(profile?.birthData?.birthDate);

  // Fase lunar natal, usada para destacar a lua correta no onboarding.
  const natalMoonPhase = profile ? getNatalMoonPhase(profile) : null;
  const natalMoonId = natalMoonPhase
    ? (Object.entries(MOON_PHASES).find(([, v]) => v.phase === natalMoonPhase)?.[0] as keyof typeof MOON_PHASES)
    : "lua-nova";

  const handleOpenDiretriz = () => {
    setIsPanelOpen(false);
    setIsDiretrizModalOpen(true);
    if (!diretrizData && profile && userName) {
      setIsFetchingDiretriz(true);
      fetch("/api/generate-diretriz-ampla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, userName, visualState, userId: userProfile?.id })
      })
      .then(res => res.json())
      .then(data => {
        if (data.reading && isValidDiretrizAmplaData(data.reading)) {
          setDiretrizData(data.reading);
        } else {
          console.warn("[Diretriz] Formato inesperado:", data.reading);
          setDiretrizData(null);
        }
      })
      .catch(err => console.error("Erro diretriz:", err))
      .finally(() => setIsFetchingDiretriz(false));
    }
  };

  const fetchTransits = () => {
    if (!profile || isFetchingTransits) return;
    setTransitsText(null);
    setIsFetchingTransits(true);
    fetch("/api/generate-transit-cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, userId: userProfile?.id })
    })
    .then(res => res.json())
    .then(data => {
      if (data.reading) setTransitsText(data.reading);
      if (Array.isArray(data.restructuringCycles)) setRestructuringCycles(data.restructuringCycles);
    })
    .catch(err => console.error("Erro trânsitos:", err))
    .finally(() => setIsFetchingTransits(false));
  };

  const fetchDashas = () => {
    if (!profile || !userProfile?.id || isFetchingDashas) return;
    setDashaText(null);
    setIsFetchingDashas(true);
    fetch("/api/cycles/dashas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, userId: userProfile.id, subscriptionTier })
    })
    .then(res => res.json())
    .then(data => {
      if (data.reading) setDashaText(data.reading);
    })
    .catch(err => console.error("Erro dashas:", err))
    .finally(() => setIsFetchingDashas(false));
  };

  const fetchProfection = () => {
    if (!profile || isFetchingProfection) return;
    setProfectionData(null);
    setIsFetchingProfection(true);
    fetch("/api/cycles/profection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, userId: userProfile?.id, subscriptionTier })
    })
    .then(res => res.json())
    .then(data => {
      if (data.profection) setProfectionData(data);
    })
    .catch(err => console.error("Erro Senhor do Ano:", err))
    .finally(() => setIsFetchingProfection(false));
  };

  const fetchRapidActivations = () => {
    if (!profile || isFetchingRapidActivations) return;
    setRapidActivationsData(null);
    setIsFetchingRapidActivations(true);
    fetch("/api/cycles/rapid-activations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, userId: userProfile?.id, subscriptionTier })
    })
    .then(res => res.json())
    .then(data => {
      if (data.profection) setRapidActivationsData(data);
    })
    .catch(err => console.error("Erro Ativações Rápidas:", err))
    .finally(() => setIsFetchingRapidActivations(false));
  };

  const handleOpenTransits = () => {
    setIsPanelOpen(false);
    setIsPlanetPanelOpen(false);
    setIsDynamicsOpen(false);
    if (!hasChamadoFeature(userProfile, "ciclos")) {
      setPaywallFeature("transits");
      return;
    }
    const willOpen = !isTransitsModalOpen;
    setIsTransitsModalOpen(willOpen);
    if (willOpen && profile) {
      if (dashaText === null) fetchDashas();
      if (transitsText === null) fetchTransits();
      if (profectionData === null) fetchProfection();
      if (rapidActivationsData === null) fetchRapidActivations();
    }
  };

  const handleOpenDynamics = () => {
    setIsPanelOpen(false);
    setIsPlanetPanelOpen(false);
    setIsTransitsModalOpen(false);
    setIsInsightsOpen(false);
    if (!hasChamadoFeature(userProfile, "dinamicas-planetarias")) {
      setPaywallFeature("dynamics");
      return;
    }
    setIsDynamicsOpen(prev => !prev);
  };

  const fetchPlanetaryDynamics = React.useCallback(() => {
    if (!profile || !userProfile?.id || isFetchingDynamics || dynamicsText !== null) return;
    setIsFetchingDynamics(true);
    fetch("/api/generate-planetary-dynamics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, userId: userProfile.id })
    })
    .then(res => res.json())
    .then(data => {
      if (data.reading?.text) setDynamicsText(data.reading.text);
    })
    .catch(err => console.error("Erro Dinâmicas Planetárias:", err))
    .finally(() => setIsFetchingDynamics(false));
  }, [profile, userProfile?.id, isFetchingDynamics, dynamicsText]);

  React.useEffect(() => {
    if (isDynamicsOpen && dynamicsText === null && !isFetchingDynamics && userProfile?.id) {
      fetchPlanetaryDynamics();
    }
  }, [isDynamicsOpen, dynamicsText, isFetchingDynamics, userProfile?.id, fetchPlanetaryDynamics]);

  // 3. Interatividade (Função executada ao clicar):
  const handleElementClick = (elementId: string, elementType: string) => {
    // Imprime no console qual elemento foi clicado
    console.log(`Clicou no ${elementType}: ${elementId}`);

    // Elementos premium da mandala exigem plano PLUS ou feature do Chamado
    if (isMandalaElementLocked(elementId, userProfile)) {
      setPaywallFeature("caminhos");
      return;
    }

    // Alterna o estado ativo de forma orgânica (Toggle)
    setActiveElements((prev) =>
      prev.includes(elementId)
        ? prev.filter((id) => id !== elementId)
        : [...prev, elementId]
    );

    // Abre o painel lateral com a leitura deste elemento
    setSelectedElementId(elementId);
    setIsPanelOpen(true);
    setIsDiretrizModalOpen(false);
    setIsPlanetPanelOpen(false);
    setIsDynamicsOpen(false);

    // Leituras de Casa (Dinâmica Psíquica / Védico / Síntese) agora são buscadas
    // sob demanda por aba dentro do próprio ReadingPanel (ver seu useEffect de activeTab),
    // para não gerar as 3 abas de uma vez quando o usuário só quer ver uma.

    const isCaminhoId = [
      "eixo-asc",
      "eixo-ic",
      "eixo-dsc",
      "eixo-mc",
      "caminho-assimilacao",
      "caminho-manifestacao",
      "caminho-transformacao"
    ].includes(elementId);

    if (isCaminhoId && profile && onUpdateAiReading) {
      if (!hasChamadoFeature(userProfile, elementId) && elementId !== "eixo-asc") return;
      const hasAiReading = aiReadings && aiReadings[elementId] && (aiReadings[elementId] as any).isCaminhoReading;
      if (!hasAiReading) {
        setIsFetchingHouseReading(true);
        fetch("/api/generate-caminho-reading", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profile,
            caminhoId: elementId,
            userId: userProfile?.id
          })
        })
        .then(res => {
          if (!res.ok) throw new Error("Falha ao buscar leitura do caminho");
          return res.json();
        })
        .then(data => {
          if (data.reading) {
            onUpdateAiReading(elementId, {
              id: elementId,
              title: data.reading.nome_caminho,
              energySubtitle: data.reading.subtitulo_energia,
              anchorPhrase: data.reading.frase_didatica,
              evolutionaryTension: data.reading.tensao_evolucionaria,
              integration: data.reading.integracao,
              trap: data.reading.armadilha,
              gift: data.reading.dom,
              astrologicalSource: data.reading.fonte_astrologica,
              isCaminhoReading: true
            } as any);
          }
        })
        .catch(err => {
          console.error("Erro ao carregar leitura do caminho:", err);
        })
        .finally(() => {
          setIsFetchingHouseReading(false);
        });
      }
    }

    const isVetorId = [
      "petal-fire",
      "petal-earth",
      "petal-water",
      "petal-air",
      "petala-cardeal",
      "petala-fixo",
      "petala-mutavel"
    ].includes(elementId);

    if (isVetorId && profile) {
      const hasAiReading = aiReadings && aiReadings[elementId] && aiReadings[elementId].isVetorReading;
      if (!hasAiReading && onUpdateAiReading) {
        setIsFetchingHouseReading(true);
        fetch("/api/generate-vetor-reading", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profile,
            vetorId: elementId
          })
        })
        .then(res => {
          if (!res.ok) throw new Error("Falha ao buscar leitura da diretriz de força");
          return res.json();
        })
        .then(data => {
          if (data.reading) {
            onUpdateAiReading(elementId, {
              ...data.reading,
              isVetorReading: true
            });
          }
        })
        .catch(err => {
          console.error("Erro ao carregar leitura da diretriz de força:", err);
        })
        .finally(() => {
          setIsFetchingHouseReading(false);
        });
      }
    }

    const isMoonId = [
      "lua-nova",
      "lua-crescente",
      "lua-cheia",
      "lua-minguante"
    ].includes(elementId);

    if (isMoonId && profile && onUpdateAiReading) {
      const clickedMoon = MOON_PHASES[elementId as keyof typeof MOON_PHASES];
      const birthPhase = getNatalMoonPhase(profile);
      const isBirthMoon = clickedMoon.phase === birthPhase;

      if (!isBirthMoon) {
        onUpdateAiReading(elementId, {
          isMoonReading: true,
          isMoonBirthPhase: false,
          moonBirthTitle: clickedMoon.name,
          moonBirthAnalysis: clickedMoon.summary,
          moonOrientation: `No infográfico, clique na Lua ${birthPhase} para saber mais sobre a lua do seu nascimento.`
        } as any);
      } else {
        const hasAiReading = aiReadings && aiReadings[elementId] && aiReadings[elementId].isMoonReading && (aiReadings[elementId] as any).isMoonBirthPhase !== false;
        if (!hasAiReading) {
          setIsFetchingHouseReading(true);
          fetch("/api/generate-moon-reading", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ profile })
          })
          .then(res => {
            if (!res.ok) throw new Error("Falha ao buscar leitura da Lua");
            return res.json();
          })
          .then(data => {
            if (data.reading) {
              onUpdateAiReading(elementId, {
                ...data.reading,
                isMoonReading: true,
                isMoonBirthPhase: true
              });
            }
          })
          .catch(err => {
            console.error("Erro ao carregar leitura da Lua:", err);
          })
          .finally(() => {
            setIsFetchingHouseReading(false);
          });
        }
      }
    }
  };

  const isElementActive = (id: string) => {
    if (activeTransit && id === `casa-${activeTransit.casaNatal}`) return true;
    return activeElements.includes(id) || hoveredDiretrizElements.includes(id);
  };

  // Traduz os IDs vindos do painel "Minha Experiência" (casa-N, lua-natal, vetores, caminhos)
  // para o mesmo fluxo de clique já usado na Mandala.
  const handleNavigateFromProgress = (targetId: string) => {
    setIsInsightsOpen(false);
    if (!targetId) return;

    if (targetId === "lua-natal") {
      if (!profile) return;
      const birthPhase = getNatalMoonPhase(profile);
      const moonIdEntry = Object.entries(MOON_PHASES).find(([, v]) => v.phase === birthPhase);
      const moonElementId = moonIdEntry ? moonIdEntry[0] : "lua-nova";
      handleElementClick(moonElementId, "Lua Natal");
      return;
    }

    if (targetId.startsWith("casa-")) {
      const num = targetId.replace("casa-", "");
      handleElementClick(targetId, `Casa ${num}`);
      return;
    }

    if (PLANET_GLYPHS.some(p => p.id === targetId)) {
      handleSelectPlanet(targetId);
      return;
    }

    handleElementClick(targetId, targetId);
  };

  const handleSelectPlanet = (planetId: string) => {
    setSelectedPlanetId(planetId);
    setIsPlanetPanelOpen(true);
    setIsTransitsModalOpen(false);
    setIsInsightsOpen(false);
    setIsDynamicsOpen(false);
    setIsDiretrizModalOpen(false);
    setIsPanelOpen(false);
  };

  const handleLockedPlanetClick = () => {
    setPaywallFeature("planets");
  };

  const handlePlanetCacheUpdate = (planetId: string, data: any) => {
    setPlanetReadingsCache(prev => ({ ...prev, [planetId]: data }));
  };

  // Função auxiliar para calcular o path de setor circular de 30 graus para as 12 casas
  const getSectorPath = (cx: number, cy: number, r: number, startAngleDegrees: number, endAngleDegrees: number) => {
    const startRad = (startAngleDegrees * Math.PI) / 180;
    const endRad = (endAngleDegrees * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    
    // large-arc-flag é 0 já que o ângulo é sempre 30 graus (< 180)
    return `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z`;
  };

  const getHouseLabelClass = (houseNum: number) => {
    const isClicked = isElementActive(`casa-${houseNum}`);
    const item = visualState?.houses?.find(h => h.id === houseNum);
    
    if (item) {
      if (item.state === 'intersect-active') {
        return "fill-[#ede4f7] font-bold text-shadow font-mono text-[10px] tracking-tighter transition-all duration-300 ease-in-out drop-shadow intersect-active active";
      } else if (item.state === 'tropical-active') {
        return "fill-[#ede9de] font-bold text-shadow font-mono text-[10px] tracking-tighter transition-all duration-300 ease-in-out drop-shadow-sm tropical-active active";
      } else if (item.state === 'vedic-active') {
        return "fill-[#e4daf5] font-bold text-shadow font-mono text-[10px] tracking-tighter transition-all duration-300 ease-in-out drop-shadow-sm vedic-active active";
      }
    }
    
    return `font-mono text-[10px] tracking-tighter transition-all duration-300 ease-in-out ${
      isClicked ? "fill-[#ede4f7] font-bold text-shadow active" : "fill-[#f4f1eb]/60"
    }`;
  };

  const currentReadingData = React.useMemo(() => {
    if (!selectedElementId) return null;
    const baseReading = getReadingForId(selectedElementId);
    if (aiReadings && aiReadings[selectedElementId]) {
      return {
        ...baseReading,
        ...aiReadings[selectedElementId]
      };
    }
    return baseReading;
  }, [selectedElementId, aiReadings]);

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6 relative">
      {/* Sticky header with top bar + Chamado banner */}
      <div className="sticky top-0 z-40 w-full max-w-5xl mx-auto bg-[#f4f1eb]">
        {/* Top Bar with Back and Username detail */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2 border-b border-[#8c7f70]/10 gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="AQUAR.IA"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
            />
            {onBackToForm && (
              <button
                onClick={onBackToForm}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ede9de]/40 text-[#8c6239] hover:bg-[#8c6239] hover:text-[#f4f1eb] transition-all text-xs font-sans tracking-wider uppercase"
              >
                <ArrowLeft className="w-4 h-4" />
                Novo Perfil
              </button>
            )}
          </div>
        {userName && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-[#8c7f70] font-mono text-[10px] uppercase tracking-widest">
              <User className="w-3.5 h-3.5 text-[#8c6239]" />
              Matriz de: <span className="text-[#3c352d] font-semibold">{userName}</span>
            </div>
            {profile && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  id="tour-btn-visao-geral"
                  onClick={handleOpenDiretriz}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#8c6239]/10 text-[#8c6239] hover:bg-[#8c6239] hover:text-[#f4f1eb] transition-all text-[9px] font-mono tracking-wider uppercase cursor-pointer"
                >
                  Visão geral
                </button>
                <button
                  id="tour-btn-ciclos-ativos"
                  onClick={handleOpenTransits}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#8c6239]/10 text-[#8c6239] hover:bg-[#8c6239] hover:text-[#f4f1eb] transition-all text-[9px] font-mono tracking-wider uppercase cursor-pointer"
                >
                  Ciclos Ativos
                </button>
                <button
                  id="tour-btn-dinamicas-planetarias"
                  onClick={handleOpenDynamics}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#5c4d66]/10 text-[#5c4d66] hover:bg-[#5c4d66] hover:text-[#f4f1eb] transition-all text-[9px] font-mono tracking-wider uppercase cursor-pointer"
                >
                  Dinâmicas Planetárias
                </button>
                <button
                  id="tour-btn-minha-experiencia"
                  onClick={() => {
                    if (subscriptionTier === "FREE") {
                      setPaywallFeature("insights");
                      setIsPanelOpen(false);
                    } else {
                      setIsInsightsOpen(true);
                      setIsTransitsModalOpen(false);
                      setIsPlanetPanelOpen(false);
                      setIsDynamicsOpen(false);
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#5c4d66]/10 text-[#5c4d66] hover:bg-[#5c4d66] hover:text-[#f4f1eb] transition-all text-[9px] font-mono tracking-wider uppercase cursor-pointer"
                >
                  Minha Experiência
                </button>
                <button
                  id="tour-btn-dados-mapa"
                  onClick={() => setIsTechModalOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#8c6239]/10 text-[#8c6239] hover:bg-[#8c6239] hover:text-[#f4f1eb] transition-all text-[9px] font-mono tracking-wider uppercase cursor-pointer"
                >
                  Dados do mapa
                </button>
              </div>
            )}
          </div>
        )}
        </div>

        <ChamadoTimer
          active={!!userProfile?.chamado_active}
          expiresAt={userProfile?.chamado_expires_at || null}
          bannerText={userProfile?.chamado_banner_text || undefined}
        />
      </div>

      <div className="w-full flex flex-col items-center justify-center gap-6 lg:gap-12 transition-all duration-500 ease-in-out relative">
      {/* Mandala Wrapper */}
      <div
        className={`transition-all duration-500 ease-in-out flex flex-col items-center justify-center origin-center ${
          (isPanelOpen || isDiretrizModalOpen || isTransitsModalOpen || isInsightsOpen || isPlanetPanelOpen || isDynamicsOpen)
            ? "w-full lg:max-w-2xl lg:scale-[0.82] lg:-translate-x-[21vw]"
            : "w-full max-w-3xl scale-100 translate-x-0"
        }`}
      >
        <div className="relative w-full aspect-square flex items-center justify-center">
          <svg
        id="astrology-mandala-svg"
        viewBox="0 0 800 800"
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Sombreado Sutil Metálico de Profundidade */}
          <radialGradient id="metallicDepth" cx="50%" cy="50%" r="50%" fx="45%" fy="45%">
            <stop offset="0%" stopColor="#faf9f6" />
            <stop offset="50%" stopColor="#ede9de" />
            <stop offset="85%" stopColor="#ded7c3" />
            <stop offset="100%" stopColor="#cfc6ae" />
          </radialGradient>

          {/* Sombra suave para caminhos e elementos flutuantes */}
          <filter id="softShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#8c6239" floodOpacity="0.16" />
          </filter>

          {/* Brilho sutil para o centro e as pétalas */}
          <filter id="softGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Glow do trânsito ativo — casa em destaque */}
          <filter id="transitGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feFlood floodColor="#8c6239" floodOpacity="0.55" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Glow leve azul-violeta para anel externo */}
          <filter id="outerRingGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor="#5c4d66" floodOpacity="0.7" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Gradiente para as Pétalas de Qualidade */}
          <linearGradient id="qualityPetalGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#a37c5c" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#cfae84" />
          </linearGradient>

          {/* Gradiente para as Pétalas de Qualidade Ativas */}
          <linearGradient id="qualityPetalGradActive" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#5c4d66" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a38eb0" />
          </linearGradient>
        </defs>

        {/* Grupo de escala para evitar cortes nas bordas mantendo a proporção ideal */}
        <g transform="translate(400, 420) scale(0.91) translate(-400, -420)">

        {/* ================================================================= */}
        {/* 1. Triângulo Externo (Os 3 Caminhos)                              */}
        {/* ================================================================= */}
        <g id="triangulo-externo">
          {/* Linha dupla externa de alta precisão */}
          <polygon
            points="400,50 720.4,605 79.6,605"
            fill="none"
            stroke="#a37c5c"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />
          <polygon
            points="400,58 711.8,600 88.2,600"
            fill="none"
            stroke="#a37c5c"
            strokeWidth="0.6"
            strokeOpacity="0.4"
            strokeDasharray="4,2"
          />

          {/* VÉRTICE SUPERIOR - Caminho de Integração */}
          <g
            id="vertex-integracao"
            className="cursor-pointer group"
            onClick={() => handleElementClick("caminho-assimilacao", "Caminho de Integração")}
          >
            <circle
              cx="400"
              cy="50"
              r="26"
              fill={isElementActive("caminho-assimilacao") ? "#f0ebf4" : "#f4f1eb"}
              stroke={isElementActive("caminho-assimilacao") ? "#5c4d66" : "#a37c5c"}
              strokeWidth={isElementActive("caminho-assimilacao") ? "5.5" : "4"}
              className="transition-all duration-300 ease-in-out"
              filter="url(#softShadow)"
            />
            <circle
              cx="400"
              cy="50"
              r="18"
              fill="none"
              stroke={isElementActive("caminho-assimilacao") ? "#5c4d66" : "#a37c5c"}
              strokeWidth="0.5"
              strokeDasharray="2,2"
              className="transition-all duration-300 ease-in-out"
            />
            <circle
              cx="400"
              cy="50"
              r="5"
              fill={isElementActive("caminho-assimilacao") ? "#5c4d66" : "#a37c5c"}
              className="transition-all duration-300 ease-in-out"
            />
            {isMandalaElementLocked("caminho-assimilacao", userProfile) && <MandalaLockIconTop cx={400} cy={50} r={26} />}
            
            <text
              x="400"
              y="16"
              textAnchor="middle"
              className={`font-serif text-[15px] font-semibold tracking-[0.25em] uppercase transition-all duration-300 ease-in-out ${
                isElementActive("caminho-assimilacao") ? "fill-[#5c4d66] font-bold" : "fill-[#614e3d]"
              }`}
            >
              Integração
            </text>
          </g>

          {/* VÉRTICE INFERIOR DIREITO - Caminho de Transformação */}
          <g
            id="vertex-transformacao"
            className="cursor-pointer group"
            onClick={() => handleElementClick("caminho-transformacao", "Caminho da Transformação")}
          >
            <circle
              cx="720.4"
              cy="605"
              r="26"
              fill={isElementActive("caminho-transformacao") ? "#f0ebf4" : "#f4f1eb"}
              stroke={isElementActive("caminho-transformacao") ? "#5c4d66" : "#a37c5c"}
              strokeWidth={isElementActive("caminho-transformacao") ? "5.5" : "4"}
              className="transition-all duration-300 ease-in-out"
              filter="url(#softShadow)"
            />
            <circle
              cx="720.4"
              cy="605"
              r="18"
              fill="none"
              stroke={isElementActive("caminho-transformacao") ? "#5c4d66" : "#a37c5c"}
              strokeWidth="0.5"
              strokeDasharray="2,2"
              className="transition-all duration-300 ease-in-out"
            />
            <circle
              cx="720.4"
              cy="605"
              r="5"
              fill={isElementActive("caminho-transformacao") ? "#5c4d66" : "#a37c5c"}
              className="transition-all duration-300 ease-in-out"
            />
            {isMandalaElementLocked("caminho-transformacao", userProfile) && <MandalaLockIconTop cx={720.4} cy={605} r={26} />}

            <text
              x="720.4"
              y="656"
              textAnchor="middle"
              className={`font-serif text-[15px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 ease-in-out ${
                isElementActive("caminho-transformacao") ? "fill-[#5c4d66] font-bold" : "fill-[#614e3d]"
              }`}
            >
              Transformação
            </text>
          </g>

          {/* VÉRTICE INFERIOR ESQUERDO - Caminho de Manifestação */}
          <g
            id="vertex-manifestacao"
            className="cursor-pointer group"
            onClick={() => handleElementClick("caminho-manifestacao", "Caminho da Manifestação")}
          >
            <circle
              cx="79.6"
              cy="605"
              r="26"
              fill={isElementActive("caminho-manifestacao") ? "#f0ebf4" : "#f4f1eb"}
              stroke={isElementActive("caminho-manifestacao") ? "#5c4d66" : "#a37c5c"}
              strokeWidth={isElementActive("caminho-manifestacao") ? "5.5" : "4"}
              className="transition-all duration-300 ease-in-out"
              filter="url(#softShadow)"
            />
            <circle
              cx="79.6"
              cy="605"
              r="18"
              fill="none"
              stroke={isElementActive("caminho-manifestacao") ? "#5c4d66" : "#a37c5c"}
              strokeWidth="0.5"
              strokeDasharray="2,2"
              className="transition-all duration-300 ease-in-out"
            />
            <circle
              cx="79.6"
              cy="605"
              r="5"
              fill={isElementActive("caminho-manifestacao") ? "#5c4d66" : "#a37c5c"}
              className="transition-all duration-300 ease-in-out"
            />
            {isMandalaElementLocked("caminho-manifestacao", userProfile) && <MandalaLockIconTop cx={79.6} cy={605} r={26} />}

            <text
              x="79.6"
              y="656"
              textAnchor="middle"
              className={`font-serif text-[15px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 ease-in-out ${
                isElementActive("caminho-manifestacao") ? "fill-[#5c4d66] font-bold" : "fill-[#614e3d]"
              }`}
            >
              Manifestação
            </text>
          </g>
        </g>


        {/* ================================================================= */}
        {/* 2. O Círculo Base da Mandala (r = 265)                             */}
        {/* ================================================================= */}
        {/* O Círculo Principal com preenchimento metálico sofisticado */}
        <circle
          cx="400"
          cy="420"
          r="265"
          fill="url(#metallicDepth)"
          stroke="#ffffff"
          strokeWidth="2.5"
          filter="url(#softShadow)"
        />

        {/* Anel concêntrico fino interno de detalhamento */}
        <circle
          cx="400"
          cy="420"
          r="257"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.8"
          strokeDasharray="4,4"
          opacity="0.85"
        />

        {/* Anel concêntrico intermediário */}
        <circle
          cx="400"
          cy="420"
          r="200"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.2"
          opacity="0.45"
        />

        {/* Anel concêntrico interno */}
        <circle
          cx="400"
          cy="420"
          r="115"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeDasharray="3,6"
          opacity="0.55"
        />


        {/* ================================================================= */}
        {/* 3. Setores Interativos das 12 Casas e suas divisórias             */}
        {/* ================================================================= */}
        {/* Setores clicáveis desenhados POR TRÁS das linhas para manter o design limpo */}
        <g id="casas-interativas-fundo">
          {Array.from({ length: 12 }).map((_, i) => {
            const houseNum = i + 1;
            let startAngle = (180 - houseNum * 30 + 360) % 360;
            let endAngle = startAngle + 30;

            if (profile?.tropicalHouses && profile.tropicalHouses.length === 12) {
              const ascLong = profile.tropicalHouses[0].longitude;
              const cusp1 = profile.tropicalHouses[i].longitude;
              const cusp2 = profile.tropicalHouses[(i + 1) % 12].longitude;
              const relative1 = (cusp1 - ascLong + 360) % 360;
              let relative2 = (cusp2 - ascLong + 360) % 360;
              if (relative2 === 0 && i === 11) relative2 = 360;
              // Note: svg angle is DECREASING for counter-clockwise.
              // So cusp2 angle will be SMALLER than cusp1 angle.
              // SVG arc goes from startAngle to endAngle. Since cusp2 is smaller, cusp2 is startAngle, cusp1 is endAngle.
              endAngle = (180 - relative1 + 360) % 360;
              startAngle = (180 - relative2 + 360) % 360;
              
              if (startAngle > endAngle) {
                // For the slice that crosses 0 degree in SVG
                startAngle -= 360;
              }
            }

            const houseId = `casa-${houseNum}`;
            const houseData = visualState?.houses?.find(h => h.id === houseNum);
            const isClicked = isElementActive(houseId);
            const elementClass = houseData?.elementClass || "element-fire";
            const stateClass = houseData?.stateClass || "";
            const activeClass = isClicked ? "active" : "";

            return (
              <path
                key={houseId}
                d={getSectorPath(400, 420, 265, startAngle, endAngle)}
                className={`house ${elementClass} ${stateClass} ${activeClass} cursor-pointer`}
                onClick={() => handleElementClick(houseId, `Casa ${houseNum}`)}
              />
            );
          })}
        </g>

        {/* Linhas divisorias originais brancas */}
        <g id="fatias-12-casas" className="pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => {
            let angle = i * 30;
            if (profile?.tropicalHouses && profile.tropicalHouses.length === 12) {
              const ascLong = profile.tropicalHouses[0].longitude;
              // i goes from 0 to 11. i=0 is house 1 cusp (ascendant), which is left (180).
              // Wait, the original code had angle = i * 30.
              // When i=0, angle=0 (Right). Wait! The original code drew lines at 0, 30, 60...
              // So line 0 is at 0 degrees (3 o'clock, Descendant).
              // So the lines aren't tied to house index directly, they are just 12 lines.
              // But now they must be the actual cusps!
              const cuspLong = profile.tropicalHouses[i].longitude;
              const relative = (cuspLong - ascLong + 360) % 360;
              angle = (180 - relative + 360) % 360;
            }

            const rad = (angle * Math.PI) / 180;
            const x2 = 400 + 265 * Math.cos(rad);
            const y2 = 420 + 265 * Math.sin(rad);
            return (
              <line
                key={`house-line-${i}`}
                x1={400}
                y1={420}
                x2={x2}
                y2={y2}
                stroke="#ffffff"
                strokeWidth="1.4"
                opacity="0.9"
              />
            );
          })}
        </g>

        {/* Rótulos Visuais Elegantes das 12 Casas */}
        <g id="numeros-casas" className="pointer-events-none select-none">
          {Array.from({ length: 12 }).map((_, i) => {
            const houseNum = i + 1;
            let startAngle = (180 - houseNum * 30 + 360) % 360;
            let endAngle = startAngle + 30;

            if (profile?.tropicalHouses && profile.tropicalHouses.length === 12) {
              const ascLong = profile.tropicalHouses[0].longitude;
              const cusp1 = profile.tropicalHouses[i].longitude;
              const cusp2 = profile.tropicalHouses[(i + 1) % 12].longitude;
              const relative1 = (cusp1 - ascLong + 360) % 360;
              let relative2 = (cusp2 - ascLong + 360) % 360;
              if (relative2 < relative1) relative2 += 360;
              const midRelative = (relative1 + relative2) / 2;
              const midAngle = (180 - midRelative + 360) % 360;
              
              startAngle = midAngle - 15; // Just for fallback logic if needed, but we use midAngle
            }

            const midAngle = profile?.tropicalHouses && profile.tropicalHouses.length === 12 
              ? (startAngle + 15) // startAngle is now midAngle - 15
              : startAngle + 15;
              
            const rad = (midAngle * Math.PI) / 180;
            const tx = 400 + 235 * Math.cos(rad);
            const ty = 420 + 235 * Math.sin(rad) + 4; // ligeiro offset de centralização vertical
            const labelClass = getHouseLabelClass(houseNum);
            const houseId = `casa-${houseNum}`;
            const isHouseLocked = isMandalaElementLocked(houseId, userProfile);

            // Posiciona o cadeado na borda externa, logo após a cúspide inicial da casa.
            // O início real da casa é o cúspide mapeado em endAngle.
            const lockAngle = endAngle - 4;
            const lockRad = (lockAngle * Math.PI) / 180;
            const lockRadius = 255;
            const lockX = 400 + lockRadius * Math.cos(lockRad);
            const lockY = 420 + lockRadius * Math.sin(lockRad);

            return (
              <g key={`house-label-${houseNum}`}>
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  className={labelClass}
                >
                  {houseNum}
                </text>
                {isHouseLocked && (
                  <MandalaLockIcon cx={lockX} cy={lockY} size={16} />
                )}
              </g>
            );
          })}
        </g>


        {/* ================================================================= */}
        {/* 4. O Eixo Lunar (Quadrado Virtual com Luas Ampliadas)             */}
        {/* ================================================================= */}
        {/* Quadrado virtual em r = 175 */}
        <path
          d="M 523.7,543.7 L 276.3,543.7 L 276.3,296.3 L 523.7,296.3 Z"
          fill="none"
          stroke="#8c6239"
          strokeWidth="1.2"
          strokeDasharray="3,5"
          opacity="0.45"
        />

        <g id="eixo-lunar">
          {/* Quarto Crescente - Canto Inferior Direito */}
          <g
            id={natalMoonId === "lua-crescente" ? "tour-lua-natal" : undefined}
            className="cursor-pointer group"
            onClick={() => handleElementClick("lua-crescente", "Lua Quarto Crescente")}
            transform="translate(523.7, 543.7)"
            filter="url(#softShadow)"
          >
            <circle
              cx={0}
              cy={0}
              r={26}
              fill={isElementActive("lua-crescente") ? "#f0ebf4" : "#f4f1eb"}
              stroke={isElementActive("lua-crescente") ? "#5c4d66" : "#ece7db"}
              strokeWidth={isElementActive("lua-crescente") ? "2" : "1.2"}
              className="transition-all duration-300 ease-in-out"
            />
            <path
              d="M 0,-15 A 15,15 0 1,1 0,15 A 9,15 0 0,0 0,-15 Z"
              fill={isElementActive("lua-crescente") ? "#5c4d66" : "#8c6239"}
              className="transition-all duration-300 ease-in-out"
            />
            <circle
              cx={0}
              cy={0}
              r={20}
              fill="none"
              stroke={isElementActive("lua-crescente") ? "#5c4d66" : "#8c6239"}
              strokeWidth="0.5"
              opacity={isElementActive("lua-crescente") ? "0.8" : "0.4"}
              className="transition-all duration-300 ease-in-out"
            />
          </g>

          {/* Lua Cheia - Canto Inferior Esquerdo */}
          <g
            id={natalMoonId === "lua-cheia" ? "tour-lua-natal" : undefined}
            className="cursor-pointer group"
            onClick={() => handleElementClick("lua-cheia", "Lua Cheia")}
            transform="translate(276.3, 543.7)"
            filter="url(#softShadow)"
          >
            <circle
              cx={0}
              cy={0}
              r={26}
              fill={isElementActive("lua-cheia") ? "#f0ebf4" : "#f4f1eb"}
              stroke={isElementActive("lua-cheia") ? "#5c4d66" : "#ece7db"}
              strokeWidth={isElementActive("lua-cheia") ? "2" : "1.2"}
              className="transition-all duration-300 ease-in-out"
            />
            <circle
              cx={0}
              cy={0}
              r={15}
              fill={isElementActive("lua-cheia") ? "#e4daf5" : "#fcfaf2"}
              stroke={isElementActive("lua-cheia") ? "#5c4d66" : "#8c6239"}
              strokeWidth="1.8"
              className="transition-all duration-300 ease-in-out"
            />
            <circle
              cx={0}
              cy={0}
              r={20}
              fill="none"
              stroke={isElementActive("lua-cheia") ? "#5c4d66" : "#8c6239"}
              strokeWidth="0.5"
              opacity={isElementActive("lua-cheia") ? "0.8" : "0.4"}
              className="transition-all duration-300 ease-in-out"
            />
          </g>

          {/* Quarto Minguante - Canto Superior Esquerdo */}
          <g
            id={natalMoonId === "lua-minguante" ? "tour-lua-natal" : undefined}
            className="cursor-pointer group"
            onClick={() => handleElementClick("lua-minguante", "Lua Quarto Minguante")}
            transform="translate(276.3, 296.3)"
            filter="url(#softShadow)"
          >
            <circle
              cx={0}
              cy={0}
              r={26}
              fill={isElementActive("lua-minguante") ? "#f0ebf4" : "#f4f1eb"}
              stroke={isElementActive("lua-minguante") ? "#5c4d66" : "#ece7db"}
              strokeWidth={isElementActive("lua-minguante") ? "2" : "1.2"}
              className="transition-all duration-300 ease-in-out"
            />
            <path
              d="M 0,-15 A 15,15 0 1,0 0,15 A 9,15 0 0,1 0,-15 Z"
              fill={isElementActive("lua-minguante") ? "#5c4d66" : "#8c6239"}
              className="transition-all duration-300 ease-in-out"
            />
            <circle
              cx={0}
              cy={0}
              r={20}
              fill="none"
              stroke={isElementActive("lua-minguante") ? "#5c4d66" : "#8c6239"}
              strokeWidth="0.5"
              opacity={isElementActive("lua-minguante") ? "0.8" : "0.4"}
              className="transition-all duration-300 ease-in-out"
            />
          </g>

          {/* Lua Nova - Canto Superior Direito */}
          <g
            id={natalMoonId === "lua-nova" ? "tour-lua-natal" : undefined}
            className="cursor-pointer group"
            onClick={() => handleElementClick("lua-nova", "Lua Nova")}
            transform="translate(523.7, 296.3)"
            filter="url(#softShadow)"
          >
            <circle
              cx={0}
              cy={0}
              r={26}
              fill={isElementActive("lua-nova") ? "#f0ebf4" : "#f4f1eb"}
              stroke={isElementActive("lua-nova") ? "#5c4d66" : "#ece7db"}
              strokeWidth={isElementActive("lua-nova") ? "2" : "1.2"}
              className="transition-all duration-300 ease-in-out"
            />
            <circle
              cx={0}
              cy={0}
              r={15}
              fill={isElementActive("lua-nova") ? "#362a42" : "#4e4341"}
              stroke={isElementActive("lua-nova") ? "#a38eb0" : "#8c6239"}
              strokeWidth="1.8"
              className="transition-all duration-300 ease-in-out"
            />
            <circle
              cx={0}
              cy={0}
              r={20}
              fill="none"
              stroke={isElementActive("lua-nova") ? "#5c4d66" : "#8c6239"}
              strokeWidth="0.5"
              opacity={isElementActive("lua-nova") ? "0.8" : "0.4"}
              className="transition-all duration-300 ease-in-out"
            />
          </g>
        </g>


        {/* ================================================================= */}
        {/* 5. O Eixo Angular (Os 4 Caminhos nos Pontos Cardeais)             */}
        {/* ================================================================= */}
        <g id="eixo-angular">
          {/* TOPO (MC) - Realização */}
          <g
            className="cursor-pointer group"
            onClick={() => handleElementClick("eixo-mc", "Eixo MC (Realização)")}
          >
            <circle
              cx="400"
              cy="155"
              r="28"
              fill={isElementActive("eixo-mc") ? "#f0ebf4" : "#f4f1eb"}
              stroke={isElementActive("eixo-mc") ? "#5c4d66" : "#a37c5c"}
              strokeWidth={isElementActive("eixo-mc") ? "6" : "4.5"}
              className="transition-all duration-300 ease-in-out"
              filter="url(#softShadow)"
            />
            {isMandalaElementLocked("eixo-mc", userProfile) && <MandalaLockIconTop cx={400} cy={155} r={28} />}
            
            <text
              x="400"
              y="118"
              textAnchor="middle"
              className={`font-serif text-[13px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 ease-in-out ${
                isElementActive("eixo-mc") ? "fill-[#5c4d66] font-bold" : "fill-[#8c6239]"
              }`}
            >
              Realização
            </text>
            <text
              x="400"
              y="160"
              textAnchor="middle"
              className={`font-serif text-[14px] font-bold transition-all duration-300 ease-in-out ${
                isElementActive("eixo-mc") ? "fill-[#5c4d66]" : "fill-[#8c6239]"
              }`}
            >
              MC
            </text>
          </g>

          {/* FUNDO (IC) - Consciência */}
          <g
            className="cursor-pointer group"
            onClick={() => handleElementClick("eixo-ic", "Eixo IC (Consciência)")}
          >
            <circle
              cx="400"
              cy="685"
              r="28"
              fill={isElementActive("eixo-ic") ? "#f0ebf4" : "#f4f1eb"}
              stroke={isElementActive("eixo-ic") ? "#5c4d66" : "#a37c5c"}
              strokeWidth={isElementActive("eixo-ic") ? "6" : "4.5"}
              className="transition-all duration-300 ease-in-out"
              filter="url(#softShadow)"
            />
            {isMandalaElementLocked("eixo-ic", userProfile) && <MandalaLockIconTop cx={400} cy={685} r={28} />}

            <text
              x="400"
              y="730"
              textAnchor="middle"
              className={`font-serif text-[13px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 ease-in-out ${
                isElementActive("eixo-ic") ? "fill-[#5c4d66] font-bold" : "fill-[#8c6239]"
              }`}
            >
              Consciência
            </text>
            <text
              x="400"
              y="690"
              textAnchor="middle"
              className={`font-serif text-[14px] font-bold transition-all duration-300 ease-in-out ${
                isElementActive("eixo-ic") ? "fill-[#5c4d66]" : "fill-[#8c6239]"
              }`}
            >
              IC
            </text>
          </g>

          {/* ESQUERDA (ASC) - Autenticidade */}
          <g
            className="cursor-pointer group"
            onClick={() => handleElementClick("eixo-asc", "Eixo ASC (Autenticidade)")}
          >
            <circle
              cx="135"
              cy="420"
              r="28"
              fill={isElementActive("eixo-asc") ? "#f0ebf4" : "#f4f1eb"}
              stroke={isElementActive("eixo-asc") ? "#5c4d66" : "#a37c5c"}
              strokeWidth={isElementActive("eixo-asc") ? "6" : "4.5"}
              className="transition-all duration-300 ease-in-out"
              filter="url(#softShadow)"
            />

            <text
              x="135"
              y="468"
              textAnchor="middle"
              className={`font-serif text-[13px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 ease-in-out ${
                isElementActive("eixo-asc") ? "fill-[#5c4d66] font-bold" : "fill-[#8c6239]"
              }`}
            >
              Autenticidade
            </text>
            <text
              x="135"
              y="425"
              textAnchor="middle"
              className={`font-serif text-[14px] font-bold transition-all duration-300 ease-in-out ${
                isElementActive("eixo-asc") ? "fill-[#5c4d66]" : "fill-[#8c6239]"
              }`}
            >
              ASC
            </text>
          </g>

          {/* DIREITA (DSC) - Reconexão */}
          <g
            className="cursor-pointer group"
            onClick={() => handleElementClick("eixo-dsc", "Eixo DSC (Reconexão)")}
          >
            <circle
              cx="665"
              cy="420"
              r="28"
              fill={isElementActive("eixo-dsc") ? "#f0ebf4" : "#f4f1eb"}
              stroke={isElementActive("eixo-dsc") ? "#5c4d66" : "#a37c5c"}
              strokeWidth={isElementActive("eixo-dsc") ? "6" : "4.5"}
              className="transition-all duration-300 ease-in-out"
              filter="url(#softShadow)"
            />
            {isMandalaElementLocked("eixo-dsc", userProfile) && <MandalaLockIconTop cx={665} cy={420} r={28} />}

            <text
              x="665"
              y="468"
              textAnchor="middle"
              className={`font-serif text-[13px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 ease-in-out ${
                isElementActive("eixo-dsc") ? "fill-[#5c4d66] font-bold" : "fill-[#8c6239]"
              }`}
            >
              Reconexão
            </text>
            <text
              x="665"
              y="425"
              textAnchor="middle"
              className={`font-serif text-[14px] font-bold transition-all duration-300 ease-in-out ${
                isElementActive("eixo-dsc") ? "fill-[#5c4d66]" : "fill-[#8c6239]"
              }`}
            >
              DSC
            </text>
          </g>
        </g>


        {/* ================================================================= */}
        {/* 6. Pétalas de Qualidade (Geométricas)                             */}
        {/* ================================================================= */}
        <g id="petalas-de-qualidade" filter="url(#softShadow)">
          {/* Casa 12 / Mutável (Aponta para 0°) */}
          <g
            className="cursor-pointer group"
            onClick={() => handleElementClick("petala-mutavel", "Pétala Mutável")}
            transform="translate(400, 420) rotate(0)"
          >
            <path
              d="M 0,0 C -18,-20 -38,-95 0,-125 C 38,-95 18,-20 0,0 Z"
              fill={isElementActive("petala-mutavel") ? "var(--color-cosmic)" : "url(#qualityPetalGrad)"}
              stroke={isElementActive("petala-mutavel") ? "#a38eb0" : "#ffffff"}
              strokeWidth={isElementActive("petala-mutavel") ? "2.5" : "1.5"}
              className="transition-all duration-300 ease-in-out"
            />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-85"
              stroke={isElementActive("petala-mutavel") ? "#e4daf5" : "#ffffff"}
              strokeWidth={isElementActive("petala-mutavel") ? "1.2" : "0.8"}
              opacity="0.8"
              className="transition-all duration-300 ease-in-out"
            />
          </g>

          {/* Casa 4 / Cardeal (Aponta para 120°) */}
          <g
            className="cursor-pointer group"
            onClick={() => handleElementClick("petala-cardeal", "Pétala Cardeal")}
            transform="translate(400, 420) rotate(120)"
          >
            <path
              d="M 0,0 C -18,-20 -38,-95 0,-125 C 38,-95 18,-20 0,0 Z"
              fill={isElementActive("petala-cardeal") ? "var(--color-cosmic)" : "url(#qualityPetalGrad)"}
              stroke={isElementActive("petala-cardeal") ? "#a38eb0" : "#ffffff"}
              strokeWidth={isElementActive("petala-cardeal") ? "2.5" : "1.5"}
              className="transition-all duration-300 ease-in-out"
            />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-85"
              stroke={isElementActive("petala-cardeal") ? "#e4daf5" : "#ffffff"}
              strokeWidth={isElementActive("petala-cardeal") ? "1.2" : "0.8"}
              opacity="0.8"
              className="transition-all duration-300 ease-in-out"
            />
          </g>

          {/* Casa 8 / Fixo (Aponta para 240°) */}
          <g
            className="cursor-pointer group"
            onClick={() => handleElementClick("petala-fixo", "Pétala Fixo")}
            transform="translate(400, 420) rotate(240)"
          >
            <path
              d="M 0,0 C -18,-20 -38,-95 0,-125 C 38,-95 18,-20 0,0 Z"
              fill={isElementActive("petala-fixo") ? "var(--color-cosmic)" : "url(#qualityPetalGrad)"}
              stroke={isElementActive("petala-fixo") ? "#a38eb0" : "#ffffff"}
              strokeWidth={isElementActive("petala-fixo") ? "2.5" : "1.5"}
              className="transition-all duration-300 ease-in-out"
            />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-85"
              stroke={isElementActive("petala-fixo") ? "#e4daf5" : "#ffffff"}
              strokeWidth={isElementActive("petala-fixo") ? "1.2" : "0.8"}
              opacity="0.8"
              className="transition-all duration-300 ease-in-out"
            />
          </g>
        </g>


        {/* ================================================================= */}
        {/* 7. O Centro (A Flor de 4 Pétalas Lilás Individuais)               */}
        {/* ================================================================= */}
        <g id="centro-flor" filter="url(#softGlow)">
          <g transform="translate(400, 420)">
            
            {/* Pétala de Fogo (45°) */}
            <g
              id="petal-fire"
              className="cursor-pointer group"
              onClick={() => handleElementClick("petal-fire", "Pétala de Fogo")}
              transform="rotate(45)"
            >
              <path
                d="M 0,0 C -22,-14 -30,-80 0,-95 C 30,-80 22,-14 0,0 Z"
                fill={isElementActive("petal-fire") ? "var(--color-terracotta)" : "#5c4d66"}
                stroke={isElementActive("petal-fire") ? "#cfae84" : "#ffffff"}
                strokeWidth={isElementActive("petal-fire") ? "2.5" : "1.8"}
                opacity={isElementActive("petal-fire") ? "1" : "0.95"}
                className="transition-all duration-300 ease-in-out"
              />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="-65"
                stroke={isElementActive("petal-fire") ? "#f4f1eb" : "#a38eb0"}
                strokeWidth={isElementActive("petal-fire") ? "1.6" : "1.2"}
                opacity="0.9"
                className="transition-all duration-300 ease-in-out"
              />
            </g>

            {/* Pétala de Terra (135°) */}
            <g
              id="petal-earth"
              className="cursor-pointer group"
              onClick={() => handleElementClick("petal-earth", "Pétala de Terra")}
              transform="rotate(135)"
            >
              <path
                d="M 0,0 C -22,-14 -30,-80 0,-95 C 30,-80 22,-14 0,0 Z"
                fill={isElementActive("petal-earth") ? "var(--color-sage)" : "#5c4d66"}
                stroke={isElementActive("petal-earth") ? "#cfae84" : "#ffffff"}
                strokeWidth={isElementActive("petal-earth") ? "2.5" : "1.8"}
                opacity={isElementActive("petal-earth") ? "1" : "0.95"}
                className="transition-all duration-300 ease-in-out"
              />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="-65"
                stroke={isElementActive("petal-earth") ? "#f4f1eb" : "#a38eb0"}
                strokeWidth={isElementActive("petal-earth") ? "1.6" : "1.2"}
                opacity="0.9"
                className="transition-all duration-300 ease-in-out"
              />
            </g>

            {/* Pétala de Água (225°) */}
            <g
              id="petal-water"
              className="cursor-pointer group"
              onClick={() => handleElementClick("petal-water", "Pétala de Água")}
              transform="rotate(225)"
            >
              <path
                d="M 0,0 C -22,-14 -30,-80 0,-95 C 30,-80 22,-14 0,0 Z"
                fill={isElementActive("petal-water") ? "var(--color-mineral)" : "#5c4d66"}
                stroke={isElementActive("petal-water") ? "#cfae84" : "#ffffff"}
                strokeWidth={isElementActive("petal-water") ? "2.5" : "1.8"}
                opacity={isElementActive("petal-water") ? "1" : "0.95"}
                className="transition-all duration-300 ease-in-out"
              />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="-65"
                stroke={isElementActive("petal-water") ? "#f4f1eb" : "#a38eb0"}
                strokeWidth={isElementActive("petal-water") ? "1.6" : "1.2"}
                opacity="0.9"
                className="transition-all duration-300 ease-in-out"
              />
            </g>

            {/* Pétala de Ar (315°) */}
            <g
              id="petal-air"
              className="cursor-pointer group"
              onClick={() => handleElementClick("petal-air", "Pétala de Ar")}
              transform="rotate(315)"
            >
              <path
                d="M 0,0 C -22,-14 -30,-80 0,-95 C 30,-80 22,-14 0,0 Z"
                fill={isElementActive("petal-air") ? "var(--color-sand)" : "#5c4d66"}
                stroke={isElementActive("petal-air") ? "#cfae84" : "#ffffff"}
                strokeWidth={isElementActive("petal-air") ? "2.5" : "1.8"}
                opacity={isElementActive("petal-air") ? "1" : "0.95"}
                className="transition-all duration-300 ease-in-out"
              />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="-65"
                stroke={isElementActive("petal-air") ? "#f4f1eb" : "#a38eb0"}
                strokeWidth={isElementActive("petal-air") ? "1.6" : "1.2"}
                opacity="0.9"
                className="transition-all duration-300 ease-in-out"
              />
            </g>

            {/* Núcleo central dourado/bronze e lilás suave */}
            <circle
              cx="0"
              cy="0"
              r="20"
              fill={isElementActive("petal-core") ? "#b89ec9" : "#a38eb0"}
              stroke={isElementActive("petal-core") ? "#cfae84" : "#ffffff"}
              strokeWidth="1.5"
              className="transition-all duration-300 ease-in-out"
            />
            <circle cx="0" cy="0" r="10" fill="#f4f1eb" />
            <circle
              cx="0"
              cy="0"
              r="5.5"
              fill={isElementActive("petal-core") ? "#8c6239" : "#a37c5c"}
              className="transition-all duration-300 ease-in-out"
            />
          </g>
        </g>

        {/* ================================================================= */}
        {/* ANEL EXTERNO BI-WHEEL — fixo quando a aba Ciclos está aberta      */}
        {/* ================================================================= */}
        {isTransitsModalOpen && (() => {
          try {
            const cx = 400, cy = 420;
            const outerR = 310;   // raio do anel externo
            const innerEdge = 268; // borda interna (onde terminam as cúspides)

            const ICONS: Record<string, string> = {
              Sol: "☀", Lua: "☽", "Mercúrio": "☿", "Vênus": "♀", Marte: "♂",
              "Júpiter": "♃", Saturno: "♄", Urano: "⛢", Netuno: "♆", "Plutão": "♇",
            };

            const SIGN_LON: Record<string, number> = {
              "Áries": 0, "Touro": 30, "Gêmeos": 60, "Câncer": 90,
              "Leão": 120, "Virgem": 150, "Libra": 180, "Escorpião": 210,
              "Sagitário": 240, "Capricórnio": 270, "Aquário": 300, "Peixes": 330,
            };

            const ascLong = profile?.tropicalHouses?.[0]?.longitude ?? 0;

            // Longitude eclíptica absoluta → ângulo SVG
            // ASC fica à esquerda (180°), sentido anti-horário
            const lonToAngle = (lon: number) => ((180 - (lon - ascLong) + 3600) % 360);

            // Deduplicar planetas em trânsito (um ponto por planeta, mesmo que aspecte vários natais)
            const seenPlanet = new Set<string>();
            const transitPoints: { planet: string; angleDeg: number; lon: number }[] = [];

            for (const t of (profile?.tropical_transits ?? [])) {
              if (!t.planet || seenPlanet.has(t.planet)) continue;
              seenPlanet.add(t.planet);
              // Reconstrói longitude absoluta a partir de transitSign + transitDegree
              const signBase = SIGN_LON[t.transitSign] ?? 0;
              const lon = signBase + (t.transitDegree ?? 0);
              transitPoints.push({ planet: t.planet, angleDeg: lonToAngle(lon), lon });
            }

            // Planetas dos Dashas (posicionados nos planetas natais correspondentes)
            const dashaLords: string[] = [];
            if (profile?.vedic_timing?.mahadasha) dashaLords.push(profile.vedic_timing.mahadasha);
            if (profile?.vedic_timing?.antardasha) dashaLords.push(profile.vedic_timing.antardasha);
            if (profile?.vedic_timing?.pratyantardasha) dashaLords.push(profile.vedic_timing.pratyantardasha);

            const VEDIC_TO_TROPICAL: Record<string, string> = {
              "Sun": "Sol", "Moon": "Lua", "Mars": "Marte", "Mercury": "Mercúrio",
              "Jupiter": "Júpiter", "Venus": "Vênus", "Saturn": "Saturno",
              "Rahu": "Nodo Norte", "Ketu": "Nodo Sul",
            };

            const dashaPoints: { planet: string; angleDeg: number; label: string }[] = [];
            for (const lord of dashaLords) {
              const name = VEDIC_TO_TROPICAL[lord] || lord;
              const natalPlanet = profile?.vedic_natal?.planets?.find(
                (p: any) => p.name === name || p.name === lord
              );
              if (!natalPlanet) continue;
              const signBase = SIGN_LON[natalPlanet.sign] ?? 0;
              const lon = signBase + (natalPlanet.degreeInSign ?? 0);
              const angleDeg = lonToAngle(lon);
              dashaPoints.push({ planet: name, angleDeg, label: lord });
            }

            // Planeta e casa ativos no hover
            const activePlanet = activeTransit?.planetaTransito ?? null;
            const activeHouse  = activeTransit?.casaNatal ?? null;

            // Ângulo do meio da casa ativa
            let activeHouseAngle: number | null = null;
            if (activeHouse !== null && profile?.tropicalHouses?.length === 12) {
              const hIdx = activeHouse - 1;
              const c1 = profile.tropicalHouses[hIdx].longitude;
              const c2 = profile.tropicalHouses[(hIdx + 1) % 12].longitude;
              const rel1 = (c1 - ascLong + 360) % 360;
              let rel2 = (c2 - ascLong + 360) % 360;
              if (rel2 < rel1) rel2 += 360;
              activeHouseAngle = (180 - (rel1 + rel2) / 2 + 360) % 360;
            }

            return (
              <g id="transit-outer-ring">
                {/* Anel externo permanente */}
                <circle cx={cx} cy={cy} r={outerR}
                  fill="none" stroke="#8c6239" strokeWidth="0.6"
                  strokeDasharray="3,5" opacity="0.35"
                />

                {/* Highlight da casa ativa — arco laranja suave */}
                {activeHouseAngle !== null && profile?.tropicalHouses?.length === 12 && (() => {
                  const hIdx = (activeHouse! - 1);
                  const c1 = profile.tropicalHouses[hIdx].longitude;
                  const c2 = profile.tropicalHouses[(hIdx + 1) % 12].longitude;
                  const rel1 = (c1 - ascLong + 360) % 360;
                  let rel2 = (c2 - ascLong + 360) % 360;
                  if (rel2 < rel1) rel2 += 360;
                  const a1 = ((180 - rel1) * Math.PI) / 180;
                  const a2 = ((180 - rel2) * Math.PI) / 180;
                  const r = 230;
                  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
                  const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
                  const largeArc = (rel2 - rel1) > 180 ? 1 : 0;
                  return (
                    <path
                      d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2} Z`}
                      fill="#8c6239" opacity="0.08"
                      style={{ transition: "opacity 0.3s" }}
                    />
                  );
                })()}

                {/* Linha de conexão do planeta ativo à casa */}
                {activeHouseAngle !== null && activePlanet && (() => {
                  const pt = transitPoints.find(p => p.planet === activePlanet);
                  if (!pt) return null;
                  const pr = (pt.angleDeg * Math.PI) / 180;
                  const hr = (activeHouseAngle! * Math.PI) / 180;
                  const px2 = cx + outerR * Math.cos(pr);
                  const py2 = cy + outerR * Math.sin(pr);
                  const hx  = cx + innerEdge * Math.cos(hr);
                  const hy  = cy + innerEdge * Math.sin(hr);
                  return (
                    <line x1={px2} y1={py2} x2={hx} y2={hy}
                      stroke="#8c6239" strokeWidth="0.8" strokeDasharray="3,4" opacity="0.6"
                      style={{ transition: "all 0.3s" }}
                    />
                  );
                })()}

                {/* Planetas em trânsito */}
                {transitPoints.map(({ planet, angleDeg }) => {
                  const rad = (angleDeg * Math.PI) / 180;
                  const px2 = cx + outerR * Math.cos(rad);
                  const py2 = cy + outerR * Math.sin(rad);
                  const isActive = planet === activePlanet;
                  const icon = ICONS[planet] || "★";
                  return (
                    <g key={`transit-${planet}`} style={{ transition: "all 0.3s" }}>
                      <circle cx={px2} cy={py2} r={isActive ? 20 : 15}
                        fill={isActive ? "#3c352d" : "#2a2420"}
                        stroke={isActive ? "#d4a96a" : "#8c6239"}
                        strokeWidth={isActive ? 2 : 1}
                        opacity={isActive ? 1 : (activePlanet ? 0.45 : 0.85)}
                        filter={isActive ? "url(#outerRingGlow)" : undefined}
                        style={{ transition: "all 0.3s" }}
                      />
                      <text x={px2} y={py2 + 5} textAnchor="middle"
                        fontSize={isActive ? 15 : 11}
                        fill={isActive ? "#f4e8d0" : "#c4a882"}
                        opacity={isActive ? 1 : (activePlanet ? 0.5 : 0.9)}
                        style={{ fontFamily: "serif", userSelect: "none", transition: "all 0.3s" }}
                      >
                        {icon}
                      </text>
                    </g>
                  );
                })}

                {/* Regentes dos Dashas — anel interno separado (raio 340) */}
                {dashaPoints.map(({ planet, angleDeg, label }, i) => {
                  const dashaR = outerR + 32;
                  const rad = (angleDeg * Math.PI) / 180;
                  const px2 = cx + dashaR * Math.cos(rad);
                  const py2 = cy + dashaR * Math.sin(rad);
                  const colors = ["#d4a96a", "#a08060", "#7a6050"];
                  const icon = ICONS[planet] || "★";
                  return (
                    <g key={`dasha-${planet}-${i}`}>
                      <circle cx={px2} cy={py2} r="11"
                        fill="none"
                        stroke={colors[i] || "#8c6239"}
                        strokeWidth="1.2"
                        strokeDasharray="2,3"
                        opacity="0.7"
                      />
                      <text x={px2} y={py2 + 4} textAnchor="middle"
                        fontSize="9"
                        fill={colors[i] || "#d4a96a"}
                        opacity="0.8"
                        style={{ fontFamily: "serif", userSelect: "none" }}
                      >
                        {icon}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          } catch (err) {
            console.error("[Mandala] Erro ao renderizar anel externo de trânsito:", err);
            return null;
          }
        })()}

        </g>
      </svg>
        </div>

        {profile && (
          <div id="tour-planet-glyph-bar">
            <PlanetGlyphBar
              profile={profile}
              subscriptionTier={subscriptionTier}
              selectedPlanetId={isPlanetPanelOpen ? selectedPlanetId : null}
              onSelect={handleSelectPlanet}
              onLockedClick={handleLockedPlanetClick}
            />
          </div>
        )}
      </div>

      {/* Transit Panel — drawer lateral */}
      <RightPanelDrawer
        isOpen={isTransitsModalOpen}
        onClose={() => { setIsTransitsModalOpen(false); setActiveTransit(null); }}
        title="Ciclos Ativos"
      >
        <TransitPanel
          isOpen={isTransitsModalOpen}
          isLoading={isFetchingTransits}
          text={transitsText}
          restructuringCycles={restructuringCycles}
          dashaText={dashaText}
          isLoadingDashas={isFetchingDashas}
          onRefresh={fetchTransits}
          onRefreshDashas={fetchDashas}
          profile={profile}
          userId={userProfile?.id ?? null}
          age={portalAge}
          profectionData={profectionData}
          rapidActivationsData={rapidActivationsData}
          isFetchingProfection={isFetchingProfection}
          isFetchingRapidActivations={isFetchingRapidActivations}
          onActiveTransitChange={(t) => {
            try {
              setActiveTransit(t);
              if (t) {
                const houseId = `casa-${t.casaNatal}`;
                setActiveElements(prev =>
                  prev.includes(houseId) ? prev : [...prev, houseId]
                );
              } else {
                const list: string[] = [];
                if (highlights) list.push(...highlights);
                if (visualState?.petals) list.push(...visualState.petals);
                if (visualState?.houses) visualState.houses.forEach(h => list.push(`casa-${h.id}`));
                setActiveElements(Array.from(new Set(list)));
              }
            } catch (err) {
              console.error("[AstrologyMandala] Erro ao sincronizar activeTransit com mandala:", err);
            }
          }}
          onClose={() => { setIsTransitsModalOpen(false); setActiveTransit(null); }}
        />
      </RightPanelDrawer>

      {/* Dynamics Panel — drawer lateral (Dinâmicas Planetárias) */}
      <RightPanelDrawer
        isOpen={isDynamicsOpen}
        onClose={() => setIsDynamicsOpen(false)}
        title="Dinâmicas Planetárias"
      >
        <PlanetaryDynamicsPanel
          isOpen={isDynamicsOpen}
          isLoading={isFetchingDynamics}
          text={dynamicsText}
          onRefresh={fetchPlanetaryDynamics}
        />
      </RightPanelDrawer>

      {/* Insights Panel — drawer lateral (Minha Experiência) */}
      <RightPanelDrawer
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        title="Minha Experiência"
      >
        <MinhaExperienciaTab userId={userProfile?.id ?? null} onNavigateToElement={handleNavigateFromProgress} />
      </RightPanelDrawer>

      {/* Planet Reading Panel — drawer lateral (Régua de Glifos) */}
      <RightPanelDrawer
        isOpen={isPlanetPanelOpen && !!selectedPlanetId}
        onClose={() => { setIsPlanetPanelOpen(false); setSelectedPlanetId(null); }}
        title="Régua de Glifos"
      >
        <PlanetReadingPanel
          planetId={selectedPlanetId}
          profile={profile}
          userId={userProfile?.id ?? null}
          subscriptionTier={subscriptionTier}
          cache={planetReadingsCache}
          onCacheUpdate={handlePlanetCacheUpdate}
          onClose={() => { setIsPlanetPanelOpen(false); setSelectedPlanetId(null); }}
        />
      </RightPanelDrawer>

      </div>

      {/* Slide-out Reading Panel (overlay fixo) */}
      <ReadingPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        data={currentReadingData}
        isLoading={isFetchingHouseReading}
        subscriptionTier={subscriptionTier}
        userId={userProfile?.id || ""}
        userEmail={userProfile?.email || ""}
        fullName={userProfile?.full_name || ""}
        onUpgradeSuccess={onUpgradeSuccess || (() => {})}
        userGender={profile?.birthData?.gender}
        userGenderPreference={profile?.birthData?.gender_preference}
        profile={profile}
        userProfile={userProfile}
        onUpdateAiReading={onUpdateAiReading}
      />

      <TechnicalDataModal
        isOpen={isTechModalOpen}
        onClose={() => setIsTechModalOpen(false)}
        profile={profile}
      />

      <DiretrizAmplaDrawer
        isOpen={isDiretrizModalOpen}
        onClose={() => setIsDiretrizModalOpen(false)}
        isLoading={isFetchingDiretriz}
        data={diretrizData}
        setHoveredElements={setHoveredDiretrizElements}
      />

      {paywallFeature && (
        <PaywallBarrier
          subscriptionTier={subscriptionTier}
          userId={userProfile?.id || ""}
          userEmail={userProfile?.email || ""}
          fullName={userProfile?.full_name || ""}
          onUpgradeSuccess={() => {
            setPaywallFeature(null);
            onUpgradeSuccess?.();
          }}
          standalone
          onClose={() => setPaywallFeature(null)}
          title={
            paywallFeature === "transits"
              ? "Ciclos Ativos"
              : paywallFeature === "planets"
                ? "Engrenagens Celestes"
                : paywallFeature === "caminhos"
                  ? "PASSE DE EXPANSÃO"
                  : paywallFeature === "dynamics"
                    ? "Dinâmicas Planetárias"
                    : "Minha Experiência"
          }
          description={
            paywallFeature === "transits"
              ? "Desbloqueie a análise viva dos trânsitos planetários e ciclos atuais do seu mapa."
              : paywallFeature === "planets"
                ? "Desbloqueie a leitura tropical completa deste ponto astrológico, incluindo a teia de aspectos que ele forma com os demais planetas do seu mapa."
                : paywallFeature === "caminhos"
                  ? "Desbloqueie os Caminhos de Potência e os Eixos Angulares para acessar as leituras profundas de cada direção da sua mandala."
                  : paywallFeature === "dynamics"
                    ? `Seu mapa possui ${(profile?.vedic_specifics?.yogas || []).length} Fluxos de Potência e ${(profile?.vedic_specifics?.doshas || []).length} Pontos de Lapidação ativos. Assine o plano Premium para desbloquear sua matriz estrutural completa e entender os recursos ocultos da sua psique.`
                    : "Guarde e revisite insights pessoais gerados nas suas leituras."
          }
        >
          <div className="hidden" />
        </PaywallBarrier>
      )}

      <RenewalPopup userProfile={userProfile} />
    </div>
  );
}
