import React from "react";
import { Loader2, X, ChevronDown } from "lucide-react";
import { getPlanetGlyphConfig, ASPECT_GLYPHS } from "../lib/planetGlyphs";

interface AspectReading {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
  interpretation: string;
}

interface PlanetReadingData {
  title: string;
  energySubtitle: string;
  functionText: string;
  shadowText?: string;
  aspectReadings?: AspectReading[];
  fonte_astrologica: string;
}

interface PlanetReadingPanelProps {
  planetId: string;
  profile: any;
  userId: string | null;
  subscriptionTier: "FREE" | "PLUS";
  cache: Record<string, PlanetReadingData>;
  onCacheUpdate: (planetId: string, data: PlanetReadingData) => void;
  onClose: () => void;
}

function resolveHeaderPosition(profile: any, config: ReturnType<typeof getPlanetGlyphConfig>): { sign: string; degree: number; house: number | null; isRetrograde: boolean } | null {
  if (!config || !profile?.tropical_natal) return null;
  if (config.isAngle) {
    const houseNumber = config.id === "asc" ? 1 : 10;
    const house = profile.tropical_natal.houses?.find((h: any) => h.house === houseNumber);
    if (!house) return null;
    return { sign: house.sign, degree: house.cuspDegree ?? 0, house: null, isRetrograde: false };
  }
  const planet = profile.tropical_natal.planets?.find((p: any) => p.name === config.canonicalName);
  if (!planet) return null;
  return { sign: planet.sign, degree: planet.degree ?? 0, house: planet.house ?? null, isRetrograde: !!planet.isRetrograde };
}

function formatDegree(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}'`;
}

const PLANET_ARTICLE: Record<string, { article: string; theme: string }> = {
  Sol: { article: "seu", theme: "identidade e propósito" },
  Lua: { article: "sua", theme: "emoção, nutrição e pertencimento" },
  Mercúrio: { article: "seu", theme: "mente, comunicação e adaptação" },
  Vênus: { article: "sua", theme: "relacionamentos, valores e prazer" },
  Marte: { article: "seu", theme: "ação, coragem e iniciativa" },
  Júpiter: { article: "seu", theme: "expansão, sabedoria e confiança" },
  Saturno: { article: "seu", theme: "estrutura, tempo e responsabilidade" },
  Urano: { article: "seu", theme: "liberdade, ruptura e originalidade" },
  Netuno: { article: "seu", theme: "intuição, dissolução e idealização" },
  Plutão: { article: "seu", theme: "poder, transformação e profundidade" },
  "Nodo Norte": { article: "seu", theme: "direção de crescimento e chamados do caminho" },
  "Nodo Sul": { article: "seu", theme: "padrões herdados e recursos do passado" },
};

const SIGN_ELEMENT: Record<string, string> = {
  Áries: "fogo", Leão: "fogo", Sagitário: "fogo",
  Touro: "terra", Virgem: "terra", Capricórnio: "terra",
  Gêmeos: "ar", Libra: "ar", Aquário: "ar",
  Câncer: "água", Escorpião: "água", Peixes: "água",
};

const ELEMENT_QUALITY: Record<string, string> = {
  fogo: "impulso, entusiasmo e busca de sentido",
  terra: "praticidade, materialização e paciência",
  ar: "curiosidade, troca e mobilidade mental",
  água: "sensibilidade, fluidez e profundidade emocional",
};

const HOUSE_MEANING: Record<number, string> = {
  1: "corpo, presença e identidade",
  2: "recursos, valores e autoestima",
  3: "comunicação, aprendizado e irmãos",
  4: "lar, raízes e fundação emocional",
  5: "criatividade, prazer e autenticidade",
  6: "saúde, rotina e serviço",
  7: "relacionamentos, parcerias e o outro",
  8: "transformações, vulnerabilidades e heranças",
  9: "visão de mundo, ensinamentos e expansão",
  10: "carreira, missão pública e realização",
  11: "comunidade, projetos e futuro",
  12: "inconsciente, espiritualidade e renúncia",
};



function getDignityDescription(planet: string, sign: string, dignity: string | undefined): string {
  if (!dignity) return "";
  
  // Terminologia branda para dignidades
  if (dignity === "Exaltado") {
    return `em seu ponto de potência máxima: ${planet} alcança clareza e força plena em ${sign}`;
  }
  if (dignity === "Moolatrikona") {
    return `em casa: ${planet} opera com recursos próprios e estabilidade em ${sign}`;
  }
  if (dignity === "Amigo") {
    return `em relação harmoniosa: ${planet} encontra apoio natural do signo de ${sign}`;
  }
  if (dignity === "Neutro") {
    return `em equilíbrio: ${planet} nem é favorecido nem desafiado por ${sign}`;
  }
  if (dignity === "Inimigo") {
    return `em relação de desafio: ${planet} precisa trabalhar para expressar suas qualidades em ${sign}`;
  }
  if (dignity === "Debilitado") {
    return `em ponto de ajuste: ${planet} requer maturação e consciência para operar em ${sign}`;
  }
  return "";
}

function getHouseClassification(house: number): { type: string; description: string } {
  if ([6, 8, 12].includes(house)) {
    return { type: "desafio", description: "área de sublimação e transformação" };
  }
  if ([1, 4, 7, 10].includes(house)) {
    return { type: "proeminência", description: "área de estabilidade e projeção" };
  }
  if ([1, 5, 9].includes(house)) {
    return { type: "fortuna", description: "área de dharma e propósito" };
  }
  return { type: "equilíbrio", description: "área neutra do mapa" };
}

function getAspectSummary(drishti: string[] | undefined): string {
  if (!drishti || drishti.length === 0) return "";
  
  const benefics = drishti.filter(d => /Júpiter|Vênus|Mercúrio/.test(d));
  const malefics = drishti.filter(d => /Saturno|Marte|Rahu|Ketu/.test(d));
  
  let parts: string[] = [];
  if (benefics.length > 0) {
    parts.push(`recebe apoio de ${benefics.join(", ")}`);
  }
  if (malefics.length > 0) {
    parts.push(`tem contato com intensidade de ${malefics.join(", ")}`);
  }
  
  return parts.length > 0 ? parts.join(" e ") : "";
}

function getVedicStructuralSummary(profile: any, canonicalName: string): string | null {
  const vedicPlanet = profile?.vedic_natal?.planets?.find(
    (p: any) => p.name === canonicalName
  );
  if (!vedicPlanet) return null;

  const meta = PLANET_ARTICLE[canonicalName] || { article: "seu", theme: "potencial e desafios" };
  const sign = vedicPlanet.sign || "desconhecido";
  const house = typeof vedicPlanet.house === "number" ? vedicPlanet.house : null;
  const dignity = vedicPlanet.dignity;
  const nakshatra = vedicPlanet.nakshatra;
  const drishti = profile?.vedic_natal?.drishti;

  // Classificação da casa
  const houseClass = house ? getHouseClassification(house) : { type: "neutra", description: "área do mapa" };
  const houseMeaning = house ? HOUSE_MEANING[house] : "uma área estrutural";

  // Descrição da dignidade
  const dignityDesc = getDignityDescription(canonicalName, sign, dignity);

  // Resumo dos aspectos
  const aspectSummary = getAspectSummary(drishti);

  // Construção do texto em camadas
  const parts: string[] = [];

  // Camada 1: Posição básica
  parts.push(`${meta.article.charAt(0).toUpperCase() + meta.article.slice(1)} ${canonicalName} está em ${sign}, na Casa ${house ?? "?"} (${houseMeaning})`);

  // Camada 2: Dignidade específica
  if (dignityDesc) {
    parts.push(dignityDesc);
  }

  // Camada 3: Classificação da casa
  if (house && houseClass.type !== "equilíbrio") {
    parts.push(`Esta é uma ${houseClass.description}`);
  }

  // Camada 4: Nakshatra
  if (nakshatra) {
    parts.push(`sob a influência de ${nakshatra}`);
  }

  // Camada 5: Aspectos
  if (aspectSummary) {
    parts.push(aspectSummary);
  }

  return parts.join(". ") + ".";
}



const PlanetReadingPanel: React.FC<PlanetReadingPanelProps> = ({
  planetId,
  profile,
  userId,
  subscriptionTier,
  cache,
  onCacheUpdate,
  onClose,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [aspectsExpanded, setAspectsExpanded] = React.useState(true);
  const [structuralSummary, setStructuralSummary] = React.useState<string | null>(null);
  const [loadingStructural, setLoadingStructural] = React.useState(false);

  const config = getPlanetGlyphConfig(planetId);
  const position = resolveHeaderPosition(profile, config);
  const reading = cache[planetId];
  const vedicPlanetForCondition = config?.canonicalName
    ? profile?.vedic_natal?.planets?.find((p: any) => p.name === config.canonicalName)
    : null;

  const fetchVedicStructural = React.useCallback(async () => {
    if (!config || config.isAngle || !vedicPlanetForCondition) return;
    setLoadingStructural(true);
    try {
      const res = await fetch("/api/generate-vedic-structural", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, planetId, userId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Falha ao buscar análise estrutural.");
      }
      const data = await res.json();
      if (data.structuralText) {
        setStructuralSummary(data.structuralText);
      }
    } catch (err: any) {
      console.error("[PlanetReadingPanel] Erro ao carregar análise estrutural:", err);
      // Silently fall back to local generation if backend fails
    } finally {
      setLoadingStructural(false);
    }
  }, [config, planetId, profile, userId, vedicPlanetForCondition]);

  const fetchReading = React.useCallback(async () => {
    if (!config) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-planet-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, planetId, userId, subscriptionTier }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Falha ao buscar a leitura do ponto astrológico.");
      }
      const data = await res.json();
      if (data.reading) {
        onCacheUpdate(planetId, data.reading);
      }
    } catch (err: any) {
      setError(err?.message || "Não foi possível carregar a leitura.");
      console.error("[PlanetReadingPanel]", err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planetId, profile, userId, subscriptionTier]);

  React.useEffect(() => {
    if (!reading) {
      fetchReading();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planetId]);

  React.useEffect(() => {
    if (config && !config.isAngle && vedicPlanetForCondition) {
      fetchVedicStructural();
    }
  }, [config, vedicPlanetForCondition, fetchVedicStructural]);

  if (!config) return null;

  return (
    <div className="w-full rounded-2xl border border-[#8c7f70]/15 bg-[#faf9f6] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#8c7f70]/10 bg-[#ede9de]/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl text-[#8c6239] flex-shrink-0">{config.glyph}</span>
          <div className="min-w-0">
            <h3 className="font-serif text-[#3c352d] text-sm tracking-wide truncate">
              {config.label} {position ? `em ${position.sign} ${formatDegree(position.degree)}` : ""}
              {position?.house ? ` — Casa ${position.house}` : ""}
            </h3>
            {position?.isRetrograde && (
              <p className="font-mono text-[9px] text-[#8c6239] uppercase tracking-widest mt-0.5">Retrógrado</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[#8c7f70]/10 text-[#8c7f70] transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-5 h-5 text-[#8c6239] animate-spin" />
            <p className="font-mono text-[10px] text-[#8c7f70] uppercase tracking-widest animate-pulse">
              Lendo o céu tropical...
            </p>
          </div>
        ) : error ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-sans">
              {error}
            </div>
            <button
              onClick={fetchReading}
              className="font-mono text-[10px] text-[#8c6239] uppercase tracking-widest hover:text-[#3c352d] transition-colors"
            >
              ↺ Tentar novamente
            </button>
          </div>
        ) : reading ? (
          <>
            <div>
              <p className="font-mono text-[9px] text-[#5c4d66] uppercase tracking-[0.2em] mb-1.5">
                {reading.energySubtitle}
              </p>
              <p className="font-sans text-[13.5px] text-[#3c352d] leading-relaxed">
                {reading.functionText}
              </p>
            </div>

            {structuralSummary && (
              <div className="rounded-xl border border-[#8c6239]/10 bg-[#f4f1eb] px-4 py-3.5">
                <p className="font-mono text-[9px] text-[#8c6239] uppercase tracking-[0.2em] mb-1.5">
                  ✦ Dinâmica Estrutural
                </p>
                <p className="font-sans text-[12.5px] text-[#3c352d] leading-relaxed">
                  {structuralSummary}
                </p>
              </div>
            )}

            {reading.shadowText && (
              <div className="rounded-xl border border-[#5c4d66]/10 bg-[#f4f1eb] px-4 py-3.5">
                <p className="font-mono text-[9px] text-[#5c4d66] uppercase tracking-[0.2em] mb-1.5">
                  ✦ Aprendizados
                </p>
                <p className="font-sans text-[12.5px] text-[#3c352d] leading-relaxed">
                  {reading.shadowText}
                </p>
              </div>
            )}

            <div className="border-t border-[#8c7f70]/10 pt-4">
              <button
                onClick={() => setAspectsExpanded(prev => !prev)}
                className="w-full flex items-center justify-between"
              >
                <p className="font-mono text-[9px] text-[#8c7f70] uppercase tracking-[0.2em]">
                  ✦ Aspectos Ativos deste {config.isAngle ? "Ponto" : "Planeta"} ({reading.aspectReadings?.length ?? 0})
                </p>
                <ChevronDown className={`w-3.5 h-3.5 text-[#8c7f70] transition-transform ${aspectsExpanded ? "rotate-180" : ""}`} />
              </button>

              {aspectsExpanded && (
                <div className="mt-3 space-y-3">
                  {(reading.aspectReadings?.length ?? 0) === 0 ? (
                    <p className="font-sans text-[12px] text-[#8c7f70]/70 italic">
                      Nenhum aspecto maior ativo para este ponto.
                    </p>
                  ) : (
                    reading.aspectReadings!.map((aspect, idx) => (
                      <div key={idx} className="rounded-lg bg-[#f4f1eb] px-3.5 py-3">
                        <p className="font-serif text-[12.5px] text-[#3c352d] mb-1">
                          <span className="text-[#8c6239]">{ASPECT_GLYPHS[aspect.type] || "✦"}</span>{" "}
                          {aspect.planet1} {aspect.type} {aspect.planet2}{" "}
                          <span className="font-mono text-[9px] text-[#8c7f70]">({aspect.orb}° de orbe)</span>
                        </p>
                        <p className="font-sans text-[12px] text-[#6e6356] leading-relaxed">
                          {aspect.interpretation}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default PlanetReadingPanel;
