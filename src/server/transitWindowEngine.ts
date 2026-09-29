// Motor de janelas temporais para trânsitos.
// Calcula datas de ingresso/saída de signo e cruzamento de cúspide com passo adaptativo,
// reutilizando as instâncias VSOP87 para evitar recriação a cada iteração.

import { initAstronomia, SIGN_NAMES, lerpCrossingDate } from "./transitEngine";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const HORIZON_YEARS = 30;

interface AstronomyState {
  julian: any;
  planetposition: any;
  solar: any;
  earth: any;
  bodies: Record<string, any>;
}

let astronomyState: AstronomyState | null = null;

async function getAstronomy(): Promise<AstronomyState> {
  if (astronomyState) return astronomyState;
  const { julian, planetposition, solar, planetData } = await initAstronomia();
  const earth = new planetposition.Planet(planetData.vsop87Dearth);
  astronomyState = {
    julian,
    planetposition,
    solar,
    earth,
    bodies: {
      Sol: null, // tratado separadamente
      Marte: new planetposition.Planet(planetData.vsop87Dmars),
      Júpiter: new planetposition.Planet(planetData.vsop87Djupiter),
      Saturno: new planetposition.Planet(planetData.vsop87Dsaturn),
      Urano: new planetposition.Planet(planetData.vsop87Buranus),
      Netuno: new planetposition.Planet(planetData.vsop87Bneptune),
      Plutão: null, // aproximação linear
    },
  };
  return astronomyState;
}

function toDeg(rad: number): number {
  return ((rad * 180) / Math.PI + 360) % 360;
}

function dateToJde(date: Date, julian: any): number {
  return julian.CalendarGregorianToJD(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate() + date.getHours() / 24 + date.getMinutes() / 1440
  );
}

function getPlutoLongitude(jde: number): number {
  const D = jde - 2451545.0;
  const lon = 253.22 + 0.005597 * D;
  return ((lon % 360) + 360) % 360;
}

function getGeoLon(planet: any, earth: any, jde: number): number {
  const ePos = earth.position2000(jde);
  const pPos = planet.position2000(jde);
  const ex = ePos.range * Math.cos(ePos.lat) * Math.cos(ePos.lon);
  const ey = ePos.range * Math.cos(ePos.lat) * Math.sin(ePos.lon);
  const px = pPos.range * Math.cos(pPos.lat) * Math.cos(pPos.lon);
  const py = pPos.range * Math.cos(pPos.lat) * Math.sin(pPos.lon);
  return (((Math.atan2(py - ey, px - ex) * 180) / Math.PI + 360) % 360);
}

export async function getPlanetLongitude(planet: string, date: Date): Promise<number> {
  const { julian, solar, earth, bodies } = await getAstronomy();
  const jde = dateToJde(date, julian);

  switch (planet) {
    case "Sol":
      return toDeg(solar.apparentVSOP87(earth, jde).lon);
    case "Marte":
    case "Júpiter":
    case "Saturno":
      return getGeoLon(bodies[planet], earth, jde);
    case "Urano":
    case "Netuno":
      return toDeg(bodies[planet].position(jde).lon);
    case "Plutão":
      return getPlutoLongitude(jde);
    default:
      throw new Error(`Planeta não suportado: ${planet}`);
  }
}

export type PlanetSpeedGroup = "fast" | "medium" | "slow";

export function getPlanetSpeedGroup(planet: string): PlanetSpeedGroup {
  if (["Sol", "Marte"].includes(planet)) return "fast";
  if (["Júpiter", "Saturno"].includes(planet)) return "medium";
  return "slow";
}

function stepDaysForGroup(group: PlanetSpeedGroup): number {
  if (group === "fast") return 1;
  if (group === "medium") return 15;
  return 90;
}

function signOfLongitude(longitude: number): number {
  return Math.floor(((longitude % 360) + 360) % 360 / 30);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export interface SignWindow {
  ingressDate: Date;
  egressDate: Date | null;
}

async function findSignWindowInternal(
  getLon: (d: Date) => Promise<number>,
  group: PlanetSpeedGroup,
  referenceDate: Date,
  maxYears: number = HORIZON_YEARS
): Promise<SignWindow> {
  const step = stepDaysForGroup(group);
  const lonRef = await getLon(referenceDate);
  const signRef = signOfLongitude(lonRef);

  const maxDate = addDays(referenceDate, maxYears * 365.25);

  // ── INGRESSO: anda para trás até mudar de signo ──
  let prev = referenceDate;
  let curr = addDays(referenceDate, -step);
  let ingressDate = referenceDate;
  while (true) {
    const lon = await getLon(curr);
    const sign = signOfLongitude(lon);
    if (sign !== signRef) {
      ingressDate = lerpCrossingDate(curr, prev, lon, await getLon(prev), signRef * 30);
      break;
    }
    prev = curr;
    curr = addDays(curr, -step);
  }

  // ── SAÍDA DEFINITIVA: anda para frente, tolerando reentradas ──
  const outToleranceDays = group === "fast" ? 30 : group === "medium" ? 180 : 365;
  let lastInSignDate = referenceDate;
  let lastOutOfSignDate: Date | null = null;
  prev = referenceDate;
  curr = addDays(referenceDate, step);

  while (curr.getTime() <= maxDate.getTime()) {
    const lon = await getLon(curr);
    const sign = signOfLongitude(lon);

    if (sign === signRef) {
      lastInSignDate = curr;
      lastOutOfSignDate = null;
    } else {
      if (!lastOutOfSignDate) lastOutOfSignDate = curr;
      // Se ficou fora do signo por mais que a tolerância, a saída é definitiva
      if (curr.getTime() - lastOutOfSignDate.getTime() >= outToleranceDays * MS_PER_DAY) {
        break;
      }
    }
    prev = curr;
    curr = addDays(curr, step);
  }

  if (!lastOutOfSignDate) {
    return { ingressDate, egressDate: null };
  }

  // Refinar a saída entre lastInSignDate e a primeira data fora do signo após ele
  let afterIn = addDays(lastInSignDate, step);
  while (afterIn.getTime() <= maxDate.getTime()) {
    const lon = await getLon(afterIn);
    if (signOfLongitude(lon) !== signRef) break;
    afterIn = addDays(afterIn, step);
  }

  const egressDate = lerpCrossingDate(
    lastInSignDate,
    afterIn,
    await getLon(lastInSignDate),
    await getLon(afterIn),
    ((signRef + 1) % 12) * 30
  );

  return { ingressDate, egressDate };
}

/**
 * Encontra a primeira entrada no signo atual antes de referenceDate
 * e a última saída definitiva dentro de um horizonte.
 * Retrogradações no meio são ignoradas: tudo é tratado como um único ciclo.
 */
export async function findSignWindow(
  planet: string,
  referenceDate: Date,
  maxYears: number = HORIZON_YEARS
): Promise<SignWindow> {
  const group = getPlanetSpeedGroup(planet);
  return findSignWindowInternal(
    (d: Date) => getPlanetLongitude(planet, d),
    group,
    referenceDate,
    maxYears
  );
}

/**
 * Encontra a janela de ingresso/saída no signo SIDERAL atual.
 * Útil para a camada Rāśi (Whole Sign) do motor de trânsitos.
 */
export async function findSideralSignWindow(
  planet: string,
  ayanamsha: number,
  referenceDate: Date,
  maxYears: number = HORIZON_YEARS
): Promise<SignWindow> {
  const { tropicalToSideral } = await import("./transitEngine");
  const group = getPlanetSpeedGroup(planet);
  return findSignWindowInternal(
    async (d: Date) => tropicalToSideral(await getPlanetLongitude(planet, d), ayanamsha),
    group,
    referenceDate,
    maxYears
  );
}

/**
 * Encontra a data mais próxima de referenceDate em que a longitude do planeta
 * atinge o targetLongitude (por exemplo, o grau exato de um aspecto ou de uma cúspide).
 * Retorna null se não houver cruzamento dentro do horizonte temporal.
 */
export async function findExactPeakDate(
  planet: string,
  targetLongitude: number,
  referenceDate: Date,
  maxYears: number = HORIZON_YEARS
): Promise<Date | null> {
  const group = getPlanetSpeedGroup(planet);
  const step = stepDaysForGroup(group);
  const maxDate = addDays(referenceDate, maxYears * 365.25);
  const minDate = addDays(referenceDate, -maxYears * 365.25);

  let previousDate = referenceDate;
  let previousLon = await getPlanetLongitude(planet, previousDate);
  let currentDate = addDays(referenceDate, step);
  let best: { date: Date; distance: number } | null = null;

  // Procurar para frente e para trás a partir da referência
  const directions = [1, -1] as const;
  for (const dir of directions) {
    let prevDate = referenceDate;
    let prevLon = previousLon;
    let currDate = addDays(referenceDate, dir * step);

    while (currDate.getTime() >= minDate.getTime() && currDate.getTime() <= maxDate.getTime()) {
      const currLon = await getPlanetLongitude(planet, currDate);
      const delta = Math.abs(((currLon - targetLongitude + 540) % 360) - 180);
      // Detecta cruzamento do alvo entre as duas amostras
      const prevDelta = Math.abs(((prevLon - targetLongitude + 540) % 360) - 180);
      if (prevDelta > delta && delta < 2) {
        const crossing = lerpCrossingDate(prevDate, currDate, prevLon, currLon, targetLongitude);
        const dist = Math.abs(crossing.getTime() - referenceDate.getTime());
        if (!best || dist < best.distance) {
          best = { date: crossing, distance: dist };
        }
      }
      prevDate = currDate;
      prevLon = currLon;
      currDate = addDays(currDate, dir * step);
    }
  }

  return best ? best.date : null;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function monthYear(date: Date): string {
  return capitalize(
    date.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
  );
}

function formatDayMonthYear(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function formatWeekRange(date: Date): string {
  const start = new Date(date.getTime() - 3 * MS_PER_DAY);
  const end = new Date(date.getTime() + 3 * MS_PER_DAY);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} a ${end.getDate()} de ${capitalize(start.toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" }))} de ${start.getFullYear()}`;
  }
  return `${start.getDate()} de ${capitalize(start.toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" }))} a ${end.getDate()} de ${capitalize(end.toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" }))} de ${end.getFullYear()}`;
}

export interface FormattedWindow {
  palco: string;
  gatilho: string | null;
}

export function formatTransitWindow(
  planet: string,
  ingressDate: Date,
  egressDate: Date | null,
  peakDate: Date | null
): FormattedWindow {
  const group = getPlanetSpeedGroup(planet);

  if (group === "slow") {
    const startYear = ingressDate.getFullYear();
    const endText = egressDate ? String(egressDate.getFullYear()) : "os próximos anos";
    const peakText = peakDate ? `Por volta de ${peakDate.getFullYear()}` : null;
    return {
      palco: `De ${startYear} a ${endText}, o foco prático da sua vida passa por uma transformação estrutural profunda.`,
      gatilho: peakText ? `${peakText}, este movimento atinge um ponto de intensidade especial.` : null,
    };
  }

  if (group === "medium") {
    const startText = monthYear(ingressDate);
    const endText = egressDate ? monthYear(egressDate) : "os próximos anos";
    const peakText = peakDate ? `Na semana de ${formatWeekRange(peakDate)}` : null;
    return {
      palco: `De ${startText} a ${endText}, o foco prático da sua vida pede ajustes e amadurecimento.`,
      gatilho: peakText ? `${peakText}, o trânsito cruza o grau exato da cúspide. O que era ajuste prático atinge o seu limite psicológico.` : null,
    };
  }

  // fast
  const startText = formatDayMonthYear(ingressDate);
  const endText = egressDate ? formatDayMonthYear(egressDate) : "os próximos dias";
  const peakText = peakDate ? formatDayMonthYear(peakDate) : null;
  return {
    palco: `De ${startText} a ${endText}, este pulso ativa a sua vida de forma direta e imediata.`,
    gatilho: peakText ? `Atenção: por volta de ${peakText}, o trânsito cruza o grau exato da cúspide. O gatilho fica nítido.` : null,
  };
}
