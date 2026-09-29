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
export async function buildTransitGeography(
  planet: string,
  aspecto: string,
  planetNatal: string,
  grauNatal: number,
  tropicalHouse: number,
  sideralAscendantSign: string | null | undefined,
  referenceDate: Date
): Promise<TransitGeographyData> {
  const ayanamsha = computeLahiriAyanamsha(referenceDate.getUTCFullYear());
  const transitLonTropical = await getPlanetLongitude(planet, referenceDate);
  const transitLonSideral = tropicalToSideral(transitLonTropical, ayanamsha);
  const sideralSignIndex = Math.floor(normalizeAngle(transitLonSideral) / 30);
  const sideralSign = SIGN_NAMES[sideralSignIndex] ?? "?";
  const tropicalSign = SIGN_NAMES[Math.floor(normalizeAngle(transitLonTropical) / 30)] ?? "?";

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

  const nature = getTransitNature(planet, transitLonSideral, sideralHouse || 1);

  // Selos no formato solicitado pelo usuário
  const tropicalSeal = `⚡ Psicológico (Tropical): ${planet} em ${tropicalSignAtPeak ?? tropicalSign} ${ASPECT_GLYPHS[aspecto] ?? aspecto} ${planetNatal} Natal • Casa ${tropicalHouse}`;
  const sideralSeal = `🏛 Estrutural (Sideral): ${planet} em ${sideralSign} [${nature.dignityShort}] • Casa ${sideralHouse} • Casa ${nature.houseClass}`;

  return {
    planet,
    aspecto: `${aspecto} com ${planetNatal} Natal`,
    planet_natal: planetNatal,
    sideral_sign: sideralSign,
    sideral_house: sideralHouse,
    sideral_house_type: nature.houseType,
    sideral_house_class: nature.houseClass,
    sideral_dispositor: nature.dispositor,
    sideral_dignity: nature.dignity,
    sideral_dignity_short: nature.dignityShort,
    sideral_ingress: sideralWindow.ingressDate,
    sideral_egress: sideralWindow.egressDate,
    tropical_sign: tropicalSign,
    tropical_house: tropicalHouse,
    tropical_sign_at_peak: tropicalSignAtPeak,
    exact_aspect_date: exactAspectDate,
    aspect_target_longitude: aspectTarget,
    seals: {
      tropicalSeal,
      sideralSeal,
    },
    nature,
  };
}
