// Monta as frases determinísticas do bloco "A Geografia do Trânsito".
// Palco = janela Whole Sign (primeira entrada a última saída).
// Gatilho = cruzamento da cúspide Placidus do signo.

import { SIGN_NAMES } from "./transitEngine";
import {
  getPlanetLongitude,
  getPlanetSpeedGroup,
  findSignWindow,
  findCuspPeakDate,
  formatTransitWindow,
  FormattedWindow,
} from "./transitWindowEngine";
import { getTransitNature, TransitNature } from "./transitNatureEngine";

const HOUSE_THEMES: Record<number, string> = {
  1: "revisar a sua identidade e o modo como você ocupa o mundo",
  2: "cuidar dos seus recursos, valores e auto-sustentação",
  3: "movimentar a comunicação, o aprendizado e o cotidiano",
  4: "rever as suas raízes, o espaço íntimo e a base emocional",
  5: "abrir espaço para a criatividade, o prazer e a autenticidade",
  6: "ajustar a rotina, os hábitos e os cuidados práticos",
  7: "renegociar relacionamentos, parcerias e o espelho do outro",
  8: "enfrentar transformações, heranças e as profundezas da troca",
  9: "ampliar a visão de mundo, as crenças e o sentido da jornada",
  10: "assumir responsabilidades, direção e o seu lugar no mundo",
  11: "conectar-se a grupos, causas e projetos de futuro",
  12: "recolher-se, finalizar ciclos e escutar a vida interior",
};

function getAscendantSign(natalHouses: any[]): string | null {
  const h1 = natalHouses.find((h) => h.house === 1);
  return h1?.sign ?? null;
}

function wholeSignHouseForSign(transitSignIndex: number, ascendantSignIndex: number): number {
  return ((transitSignIndex - ascendantSignIndex + 12) % 12) + 1;
}

function getCuspLongitude(natalHouses: any[], houseNumber: number): number | null {
  const h = natalHouses.find((h) => h.house === houseNumber);
  if (!h) return null;
  if (typeof h.longitude === "number") return h.longitude;
  const signIndex = SIGN_NAMES.indexOf(h.sign);
  if (signIndex < 0) return null;
  return signIndex * 30 + (h.cuspDegree ?? 0);
}

export interface TransitGeographyWindow {
  ingressDate: Date;
  egressDate: Date | null;
}

export interface TransitGeographyResult {
  wholeSignHouse: number;
  window: TransitGeographyWindow;
  peakDate: Date | null;
  geografia: FormattedWindow;
  natureza: TransitNature;
}

/**
 * Calcula a geografia completa de um trânsito: Whole Sign house, janela de datas,
 * gatilho de cúspide e natureza do evento.
 */
export async function buildTransitGeography(
  planet: string,
  referenceDate: Date,
  natalHouses: any[]
): Promise<TransitGeographyResult> {
  const ascendantSign = getAscendantSign(natalHouses);
  const transitLon = await getPlanetLongitude(planet, referenceDate);
  const transitSignIndex = Math.floor(((transitLon % 360) + 360) % 360 / 30);
  const ascendantSignIndex = ascendantSign ? SIGN_NAMES.indexOf(ascendantSign) : 0;
  const wholeSignHouse = wholeSignHouseForSign(transitSignIndex, ascendantSignIndex);

  const window = await findSignWindow(planet, referenceDate);
  const cuspLongitude = getCuspLongitude(natalHouses, wholeSignHouse);
  const peakDate = cuspLongitude !== null
    ? await findCuspPeakDate(planet, cuspLongitude, referenceDate)
    : null;

  const geografia = formatTransitWindow(planet, window.ingressDate, window.egressDate, peakDate);
  const natureza = getTransitNature(planet, transitLon, wholeSignHouse);

  // Sobrescreve as frases genéricas de palco com o tema específico da casa whole sign
  const theme = HOUSE_THEMES[wholeSignHouse] ?? "reorganizar esta área da sua vida";
  const group = getPlanetSpeedGroup(planet);
  let palco = geografia.palco;
  if (group === "slow") {
    const startYear = window.ingressDate.getFullYear();
    const endText = window.egressDate ? String(window.egressDate.getFullYear()) : "os próximos anos";
    palco = `De ${startYear} a ${endText}, ${theme}.`;
  } else if (group === "medium") {
    const months = dateRangeMonths(window.ingressDate, window.egressDate);
    palco = `De ${months}, ${theme}.`;
  } else {
    const days = dateRangeDays(window.ingressDate, window.egressDate);
    palco = `De ${days}, ${theme}.`;
  }

  return {
    wholeSignHouse,
    window,
    peakDate,
    geografia: {
      palco,
      gatilho: geografia.gatilho,
    },
    natureza,
  };
}

function dateRangeMonths(start: Date, end: Date | null): string {
  const startText = capitalize(
    start.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
  );
  if (!end) return `${startText} em diante`;
  const endText = capitalize(
    end.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
  );
  return `${startText} a ${endText}`;
}

function dateRangeDays(start: Date, end: Date | null): string {
  const startText = start.toLocaleDateString("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" });
  if (!end) return `${startText} em diante`;
  const endText = end.toLocaleDateString("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" });
  return `${startText} a ${endText}`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
