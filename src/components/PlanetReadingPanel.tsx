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

const VEDIC_STRUCTURAL_TEMPLATES: Record<string, string> = {
  Sol: "identidade e propósito",
  Lua: "emoção, nutrição e pertencimento",
  Mercúrio: "mente, comunicação e adaptação",
  Vênus: "relacionamentos, valores e prazer",
  Marte: "ação, coragem e iniciativa",
  Júpiter: "expansão, sabedoria e confiança",
  Saturno: "estrutura, tempo e responsabilidade",
  Urano: "liberdade, ruptura e originalidade",
  Netuno: "intuição, dissolução e idealização",
  Plutão: "poder, transformação e profundidade",
  "Nodo Norte": "direção de crescimento e chamados do caminho",
  "Nodo Sul": "padrões herdados e recursos do passado",
};

function classifyVedicCondition(
  dignity: string | undefined,
  house: number | undefined,
  shadbala: number | undefined
): "confortavel" | "desafiadora" | "neutra" {
  const goodDignities = /Exaltado|Moolatrikona|Amigo/;
  const hardDignities = /Inimigo|Debilitado/;
  const angularOrTrinal = [1, 4, 5, 7, 9, 10];
  const hardHouses = [6, 8, 12];

  let score = 0;
  if (dignity) {
    if (goodDignities.test(dignity)) score += 2;
    if (hardDignities.test(dignity)) score -= 2;
    if (dignity === "Neutro") score += 0;
  }
  if (house) {
    if (angularOrTrinal.includes(house)) score += 1;
    if (hardHouses.includes(house)) score -= 1;
  }
  if (typeof shadbala === "number" && !isNaN(shadbala)) {
    if (shadbala >= 1.1) score += 1;
    if (shadbala <= 0.9) score -= 1;
  }

  if (score > 0) return "confortavel";
  if (score < 0) return "desafiadora";
  return "neutra";
}

function getVedicStructuralSummary(profile: any, canonicalName: string): string | null {
  const vedicPlanet = profile?.vedic_natal?.planets?.find(
    (p: any) => p.name === canonicalName
  );
  if (!vedicPlanet) return null;

  const theme = VEDIC_STRUCTURAL_TEMPLATES[canonicalName] || "potencial e desafios";
  const condition = classifyVedicCondition(
    vedicPlanet.dignity,
    typeof vedicPlanet.house === "number" ? vedicPlanet.house : undefined,
    profile?.vedic_balas?.shadbala?.[canonicalName]
  );

  if (condition === "confortavel") {
    return `Na estrutura silenciosa do mapa, seu ${canonicalName} encontra apoio natural para expressar seus ${theme}. O terreno pede menos esforço de reconstrução e mais confiança no ritmo próprio.`;
  }
  if (condition === "desafiadora") {
    return `Na estrutura silenciosa do mapa, seu ${canonicalName} ocupa um terreno que pede paciência e reconstrução em torno de ${theme}. A pressão aqui não é punição, mas convite para construir de modo mais consciente.`;
  }
  return `Na estrutura silenciosa do mapa, seu ${canonicalName} mantém uma posição equilibrada para ${theme}. O terreno não acelera nem bloqueia: pede discernimento e ajustes sutis.`;
}

function getIntegrationBalanceLine(condition: "confortavel" | "desafiadora" | "neutra"): string {
  if (condition === "confortavel") {
    return "A leveza da compreensão encontra aqui um terreno estável: deixe que o que você sente psicologicamente se ancore no que a vida já oferece como sustentação.";
  }
  if (condition === "desafiadora") {
    return "A leveza da compreensão precisa encontrar a solidez da prática: o que a psique revela pede, aqui, ser sustentado com paciência e reconstrução cotidiana.";
  }
  return "A compreensão e a estrutura caminham lado a lado: deixe que o insight psicológico se torne um hábito silencioso, nem forçado nem negligenciado.";
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

  const config = getPlanetGlyphConfig(planetId);
  const position = resolveHeaderPosition(profile, config);
  const reading = cache[planetId];
  const vedicPlanetForCondition = config?.canonicalName
    ? profile?.vedic_natal?.planets?.find((p: any) => p.name === config.canonicalName)
    : null;
  const structuralSummary = config && !config.isAngle && vedicPlanetForCondition
    ? getVedicStructuralSummary(profile, config.canonicalName)
    : null;
  const structuralCondition = structuralSummary
    ? classifyVedicCondition(
        vedicPlanetForCondition?.dignity,
        typeof vedicPlanetForCondition?.house === "number" ? vedicPlanetForCondition.house : undefined,
        profile?.vedic_balas?.shadbala?.[config?.canonicalName]
      )
    : "neutra";

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
                {structuralSummary && (
                  <p className="font-sans text-[12px] text-[#5c544d] leading-relaxed mt-2 pt-2 border-t border-[#8c7f70]/10 italic">
                    {getIntegrationBalanceLine(structuralCondition)}
                  </p>
                )}
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
