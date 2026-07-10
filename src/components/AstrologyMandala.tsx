import React from "react";
import { getReadingForId, ReadingData } from "../data/mockReadings";
import ReadingPanel from "./ReadingPanel";
import { ArrowLeft, User, X, Loader2 } from "lucide-react";
import TechnicalDataModal from "./TechnicalDataModal";
import Markdown from "react-markdown";

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

interface DiretrizAmplaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  text: string | null;
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
            Trânsitos e Ciclos (30 dias)
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

const DiretrizAmplaDrawer: React.FC<DiretrizAmplaModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  text,
  setHoveredElements
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
            Diretriz Ampla
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
          ) : text ? (
            <div className="prose prose-sm sm:prose-base max-w-none text-[#5c544d] font-sans leading-relaxed text-justify space-y-6">
              <Markdown
                components={{
                  li: ({ node, children }) => {
                    const content = String(children);
                    let elementsToHover: string[] = [];
                    // Extract IDs from content based on context, or default to generic
                    if (content.includes("Dinâmica Psíquica")) elementsToHover = Array.from({length: 12}, (_, i) => `casa-${i+1}`);
                    if (content.includes("Estrutura da Alma")) elementsToHover = Array.from({length: 12}, (_, i) => `casa-${i+1}`);
                    if (content.includes("A Tração")) elementsToHover = ["petal-fire", "petal-earth", "petal-air", "petal-water", "petala-cardeal", "petala-fixo", "petala-mutavel"];
                    
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
                  h3: ({ node, children }) => (
                    <h3 className="font-serif text-[#8c6239] tracking-wider uppercase text-lg mt-10 mb-4 border-b border-[#8c7f70]/10 pb-2">
                      {children}
                    </h3>
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
  const [diretrizText, setDiretrizText] = React.useState<string | null>(null);
  const [isFetchingDiretriz, setIsFetchingDiretriz] = React.useState(false);
  const [hoveredDiretrizElements, setHoveredDiretrizElements] = React.useState<string[]>([]);

  const [isTransitsModalOpen, setIsTransitsModalOpen] = React.useState(false);
  const [transitsText, setTransitsText] = React.useState<string | null>(null);
  const [isFetchingTransits, setIsFetchingTransits] = React.useState(false);

  const handleOpenDiretriz = () => {
    setIsPanelOpen(false);
    setIsDiretrizModalOpen(true);
    if (!diretrizText && profile && userName) {
      setIsFetchingDiretriz(true);
      fetch("/api/generate-diretriz-ampla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, userName, visualState })
      })
      .then(res => res.json())
      .then(data => {
        if (data.reading) {
          setDiretrizText(data.reading);
        }
      })
      .catch(err => console.error("Erro diretriz:", err))
      .finally(() => setIsFetchingDiretriz(false));
    }
  };

  const handleOpenTransits = () => {
    setIsPanelOpen(false);
    setIsTransitsModalOpen(true);
    if (!transitsText && profile) {
      setIsFetchingTransits(true);
      fetch("/api/generate-transit-cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile })
      })
      .then(res => res.json())
      .then(data => {
        if (data.reading) {
          setTransitsText(data.reading);
        }
      })
      .catch(err => console.error("Erro trânsitos:", err))
      .finally(() => setIsFetchingTransits(false));
    }
  };

  // 3. Interatividade (Função executada ao clicar):
  const handleElementClick = (elementId: string, elementType: string) => {
    // Imprime no console qual elemento foi clicado
    console.log(`Clicou no ${elementType}: ${elementId}`);

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

    if (elementId.startsWith("casa-") && profile) {
      const hasAiReading = aiReadings && aiReadings[elementId] && aiReadings[elementId].isHouseReading;
      if (!hasAiReading && onUpdateAiReading) {
        setIsFetchingHouseReading(true);
        fetch("/api/generate-house-reading", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profile,
            houseId: elementId
          })
        })
        .then(res => {
          if (!res.ok) throw new Error("Falha ao buscar leitura da casa");
          return res.json();
        })
        .then(data => {
          if (data.reading) {
            onUpdateAiReading(elementId, {
              ...data.reading,
              isHouseReading: true
            });
          }
        })
        .catch(err => {
          console.error("Erro ao carregar leitura da casa astrológica:", err);
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

    if (isMoonId && profile) {
      const hasAiReading = aiReadings && aiReadings[elementId] && aiReadings[elementId].isMoonReading;
      if (!hasAiReading && onUpdateAiReading) {
        setIsFetchingHouseReading(true);
        fetch("/api/generate-moon-reading", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profile
          })
        })
        .then(res => {
          if (!res.ok) throw new Error("Falha ao buscar leitura da Lua");
          return res.json();
        })
        .then(data => {
          if (data.reading) {
            onUpdateAiReading(elementId, {
              ...data.reading,
              isMoonReading: true
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
  };

  const isElementActive = (id: string) => activeElements.includes(id) || hoveredDiretrizElements.includes(id);

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
      {/* Top Bar with Back and Username detail */}
      <div className="w-full max-w-5xl flex items-center justify-between px-4 py-2 mb-2 border-b border-[#8c7f70]/10">
        {onBackToForm && (
          <button
            onClick={onBackToForm}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ede9de]/40 text-[#8c6239] hover:bg-[#8c6239] hover:text-[#f4f1eb] transition-all text-xs font-sans tracking-wider uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Novo Perfil
          </button>
        )}
        {userName && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-[#8c7f70] font-mono text-[10px] uppercase tracking-widest">
              <User className="w-3.5 h-3.5 text-[#8c6239]" />
              Matriz de: <span className="text-[#3c352d] font-semibold">{userName}</span>
            </div>
            {profile && (
              <div className="flex gap-2">
                <button
                  onClick={handleOpenDiretriz}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#8c6239]/10 text-[#8c6239] hover:bg-[#8c6239] hover:text-[#f4f1eb] transition-all text-[9px] font-mono tracking-wider uppercase cursor-pointer"
                >
                  Diretriz ampla
                </button>
                <button
                  onClick={handleOpenTransits}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#8c6239]/10 text-[#8c6239] hover:bg-[#8c6239] hover:text-[#f4f1eb] transition-all text-[9px] font-mono tracking-wider uppercase cursor-pointer"
                >
                  Ciclos (30 dias)
                </button>
                <button
                  id="open-tech-modal-btn"
                  onClick={() => setIsTechModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#8c6239]/10 text-[#8c6239] hover:bg-[#8c6239] hover:text-[#f4f1eb] transition-all text-[9px] font-mono tracking-wider uppercase cursor-pointer"
                >
                  Dados do mapa
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 transition-all duration-500 ease-in-out relative">
      {/* Mandala Wrapper - scales and slides left when panel is open */}
      <div
        className={`w-full transition-all duration-500 ease-in-out flex items-center justify-center origin-center ${
          (isPanelOpen || isDiretrizModalOpen || isTransitsModalOpen)
            ? "lg:max-w-2xl lg:scale-[0.82] lg:-translate-x-[21vw]"
            : "max-w-3xl scale-100 translate-x-0"
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

          {/* VÉRTICE SUPERIOR - Caminho de Assimilação */}
          <g
            id="vertex-assimilacao"
            className="cursor-pointer group"
            onClick={() => handleElementClick("caminho-assimilacao", "Caminho da Assimilação")}
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
            
            <text
              x="400"
              y="16"
              textAnchor="middle"
              className={`font-serif text-[15px] font-semibold tracking-[0.25em] uppercase transition-all duration-300 ease-in-out ${
                isElementActive("caminho-assimilacao") ? "fill-[#5c4d66] font-bold" : "fill-[#614e3d]"
              }`}
            >
              Assimilação
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

            return (
              <text
                key={`house-label-${houseNum}`}
                x={tx}
                y={ty}
                textAnchor="middle"
                className={labelClass}
              >
                {houseNum}
              </text>
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

          {/* FUNDO (IC) - Integração */}
          <g
            className="cursor-pointer group"
            onClick={() => handleElementClick("eixo-ic", "Eixo IC (Integração)")}
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

            <text
              x="400"
              y="730"
              textAnchor="middle"
              className={`font-serif text-[13px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 ease-in-out ${
                isElementActive("eixo-ic") ? "fill-[#5c4d66] font-bold" : "fill-[#8c6239]"
              }`}
            >
              Integração
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
                fill={isElementActive("petal-water") ? "var(--color-sand)" : "#5c4d66"}
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
                fill={isElementActive("petal-air") ? "var(--color-mineral)" : "#5c4d66"}
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

        </g>
      </svg>
        </div>
      </div>

      {/* Slide-out Reading Panel */}
      <ReadingPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        data={currentReadingData}
        isLoading={isFetchingHouseReading}
        subscriptionTier={userProfile?.subscription_tier || "FREE"}
        userId={userProfile?.id || ""}
        userEmail={userProfile?.email || ""}
        fullName={userProfile?.full_name || ""}
        onUpgradeSuccess={onUpgradeSuccess || (() => {})}
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
        text={diretrizText}
        setHoveredElements={setHoveredDiretrizElements}
      />

      <TransitsCyclesDrawer
        isOpen={isTransitsModalOpen}
        onClose={() => setIsTransitsModalOpen(false)}
        isLoading={isFetchingTransits}
        text={transitsText}
      />
      </div>
    </div>
  );
}
