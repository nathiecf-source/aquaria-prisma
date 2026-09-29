// Monta os selos e dados determinísticos das duas camadas do motor de trânsitos:
// Camada 1 (Sideral / Rāśi via Whole Sign) e Camada 2 (Tropical / Cúspide via aspecto exato).

import {
  SIGN_NAMES,
  getVedicHouse,
  tropicalToSideral,
  computeLahiriAyanamsha,
} from "./transitEngine";
import {
  getPlanetLongitude,
  getPlanetSpeedGroup,
  findSideralSignWindow,
  findExactPeakDate,
} from "./transitWindowEngine";
import { getTransitNature, TransitNature } from "./transitNatureEngine";

export const HOUSE_THEMES: Record<number, string> = {
  1:  "Identidade e Presença Física",
  2:  "Valores e Recursos Naturais",
  3:  "Comunicação, Aprendizado e Cotidiano",
  4:  "Lar, Raízes e Base Emocional",
  5:  "Criatividade, Prazer e Autenticidade",
  6:  "Rotina, Corpo e Serviço",
  7:  "Relacionamentos, Parcerias e o Espelho do Outro",
  8:  "Transformações, Heranças e as Profundezas da Troca",
  9:  "Visão de Mundo, Crenças e Sentido da Jornada",
  10: "Realização, Direção e Legado",
  11: "Grupos, Causas e Visão de Futuro",
  12: "Interioridade, Inconsciente e Espiritualidade",
};

const ASPECT_CENTERS: Record<string, number> = {
  "Conjunção": 0,
  "Quadratura": 90,
  "Oposição": 180,
};

const ASPECT_GLYPHS: Record<string, string> = {
  "Conjunção": "☌",
  "Quadratura": "□",
  "Oposição": "☍",
};

export interface TransitGeographySeals {
  tropicalSeal: string;
  sideralSeal: string;
}

export interface TransitGeographyData {
  planet: string;
  aspecto: string;
  planet_natal: string;
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
  sideral_ingress: Date;
  sideral_egress: Date | null;
  tropical_sign: string;
  tropical_house: number;
  tropical_whole_sign_house: number;
  tropical_sign_at_peak: string | null;
  exact_aspect_date: Date | null;
  aspect_target_longitude: number;
  seals: TransitGeographySeals;
  nature: TransitNature;
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function formatDatePrecise(planet: string, date: Date | null): string | null {
  if (!date) return null;
  const group = getPlanetSpeedGroup(planet);
  if (group === "slow") {
    return String(date.getUTCFullYear());
  }
  if (group === "medium") {
    return capitalize(
      date.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
    );
  }
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Calcula selos e dados determinísticos para um trânsito ativo.
 */
function isTranspersonalPlanet(planet: string): boolean {
  return ["Urano", "Netuno", "Plutão"].includes(planet);
}

export async function buildTransitGeography(
  planet: string,
  aspecto: string,
  planetNatal: string,
  grauNatal: number,
  tropicalHouse: number,
  tropicalAscendantSign: string | null | undefined,
  sideralAscendantSign: string | null | undefined,
  referenceDate: Date
): Promise<TransitGeographyData> {
  const ayanamsha = computeLahiriAyanamsha(referenceDate.getUTCFullYear());
  const transitLonTropical = await getPlanetLongitude(planet, referenceDate);
  const transitLonSideral = tropicalToSideral(transitLonTropical, ayanamsha);
  const sideralSignIndex = Math.floor(normalizeAngle(transitLonSideral) / 30);
  const sideralSign = SIGN_NAMES[sideralSignIndex] ?? "?";
  const tropicalSignIndex = Math.floor(normalizeAngle(transitLonTropical) / 30);
  const tropicalSign = SIGN_NAMES[tropicalSignIndex] ?? "?";

  let tropicalWholeSignHouse = tropicalHouse;
  if (tropicalAscendantSign) {
    const tropicalAscIndex = SIGN_NAMES.indexOf(tropicalAscendantSign);
    if (tropicalAscIndex >= 0) {
      tropicalWholeSignHouse = ((tropicalSignIndex - tropicalAscIndex + 12) % 12) + 1;
    }
  }

  let sideralHouse = 0;
  if (sideralAscendantSign) {
    const sideralAscIndex = SIGN_NAMES.indexOf(sideralAscendantSign);
    if (sideralAscIndex >= 0) {
      sideralHouse = getVedicHouse(sideralSignIndex, sideralAscIndex);
    }
  }

  const sideralWindow = await findSideralSignWindow(planet, ayanamsha, referenceDate);

  const aspectCenter = ASPECT_CENTERS[aspecto] ?? 0;
  const aspectTarget = normalizeAngle(grauNatal + aspectCenter);

  let exactAspectDate: Date | null = null;
  let tropicalSignAtPeak: string | null = null;
  try {
    exactAspectDate = await findExactPeakDate(planet, aspectTarget, referenceDate);
    if (exactAspectDate) {
      const peakLon = await getPlanetLongitude(planet, exactAspectDate);
      tropicalSignAtPeak = SIGN_NAMES[Math.floor(normalizeAngle(peakLon) / 30)] ?? null;
    }
  } catch (err) {
    console.warn(`[transitGeographyEngine] Erro ao calcular pico de aspecto para ${planet}:`, err);
  }

  // Para transpessoais o terreno estrutural é 100% tropical; para os demais, sideral.
  const terrainMode: "tropical" | "sideral" = isTranspersonalPlanet(planet) ? "tropical" : "sideral";
  const structuralSign = terrainMode === "tropical" ? tropicalSign : sideralSign;
  const structuralHouse = terrainMode === "tropical" ? tropicalWholeSignHouse : sideralHouse;
  const structuralLon = terrainMode === "tropical" ? transitLonTropical : transitLonSideral;

  const nature = getTransitNature(planet, structuralLon, structuralHouse || 1);

  // Selos no formato solicitado pelo usuário
  const tropicalSeal = `⚡ Psicológico (Tropical): ${planet} em ${tropicalSignAtPeak ?? tropicalSign} ${ASPECT_GLYPHS[aspecto] ?? aspecto} ${planetNatal} Natal • Casa ${tropicalHouse}`;
  const structuralSeal = `🏛 Estrutural (${terrainMode === "tropical" ? "Tropical" : "Sideral"}): ${planet} em ${structuralSign} [${nature.dignityShort}] • Casa ${structuralHouse} • Casa ${nature.houseClass}`;

  return {
    planet,
    aspecto: `${aspecto} com ${planetNatal} Natal`,
    planet_natal: planetNatal,
    terrain_mode: terrainMode,
    structural_sign: structuralSign,
    structural_house: structuralHouse,
    sideral_sign: sideralSign,
    sideral_house: sideralHouse,
    sideral_house_type: terrainMode === "tropical" ? "" : nature.houseType,
    sideral_house_class: terrainMode === "tropical" ? "" : nature.houseClass,
    sideral_dispositor: terrainMode === "tropical" ? "" : nature.dispositor,
    sideral_dignity: terrainMode === "tropical" ? "" : nature.dignity,
    sideral_dignity_short: terrainMode === "tropical" ? "" : nature.dignityShort,
    sideral_ingress: terrainMode === "tropical" ? new Date(referenceDate) : sideralWindow.ingressDate,
    sideral_egress: terrainMode === "tropical" ? null : sideralWindow.egressDate,
    tropical_sign: tropicalSign,
    tropical_house: tropicalHouse,
    tropical_whole_sign_house: tropicalWholeSignHouse,
    tropical_sign_at_peak: tropicalSignAtPeak,
    exact_aspect_date: exactAspectDate,
    aspect_target_longitude: aspectTarget,
    seals: {
      tropicalSeal,
      sideralSeal: structuralSeal,
    },
    nature,
  };
}
