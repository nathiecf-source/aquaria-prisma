// Motor de horizonte futuro de trânsitos.
// Em vez de varrer dia a dia (custo alto com VSOP87), faz uma interpolação linear
// por segmentos de 15 dias sobre as posições calculadas em três pontos: início,
// meio e fim do horizonte. Detecta ativações (entrada no orbe) e o aspecto exato,
// refinando o pico com findExactPeakDate apenas para os candidatos encontrados.

import {
  getTropicalTransitDegrees,
  getNatalDegrees,
  NATAL_PLANETS_ALLOWED,
  TRANSIT_PLANETS_ALLOWED,
} from "./transitEngine";
import { getPlanetLongitude, getPlanetSpeedGroup, findExactPeakDate } from "./transitWindowEngine";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const SEGMENT_DAYS = 15;

const ASPECT_TARGETS = [
  { nome: "Conjunção" as const, centro: 0 },
  { nome: "Quadratura" as const, centro: 90 },
  { nome: "Oposição" as const, centro: 180 },
];

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/** Delta angular com sinal, no intervalo (-180, +180]. */
function signedDelta(from: number, to: number): number {
  const d = normalizeAngle(to - from);
  return d > 180 ? d - 360 : d;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/** Orbe permitido: lentos 4°, rápidos 2°. */
export function getDynamicOrb(planet: string): number {
  return getPlanetSpeedGroup(planet) === "fast" ? 2 : 4;
}

interface LinearActivation {
  tStart: number; // dias desde startDate
  tEnd: number;
  tExact: number | null;
}

/**
 * Encontra intervalos onde |d0 + slope*t| <= orb dentro de um segmento linear.
 * Considera também os casos de borda (ativo no início ou no fim do segmento).
 */
function findLinearActivations(d0: number, dEnd: number, orb: number, segmentDays: number): LinearActivation[] {
  if (orb <= 0 || segmentDays <= 0) return [];
  const slope = (dEnd - d0) / segmentDays;

  // Quase estacionário: se ambos os extremos estão dentro do orbe, todo o segmento é ativo.
  if (Math.abs(slope) < 1e-6) {
    if (Math.abs(d0) <= orb) return [{ tStart: 0, tEnd: segmentDays, tExact: null }];
    return [];
  }

  const candidates: number[] = [0, segmentDays];

  // Aspecto exato (cruza zero)
  const tExact = -d0 / slope;
  if (tExact > 0 && tExact < segmentDays) candidates.push(tExact);

  // Cruza os limites do orbe (+orb e -orb)
  const tPos = (orb - d0) / slope;
  const tNeg = (-orb - d0) / slope;
  if (tPos > 0 && tPos < segmentDays) candidates.push(tPos);
  if (tNeg > 0 && tNeg < segmentDays) candidates.push(tNeg);

  candidates.sort((a, b) => a - b);

  const intervals: LinearActivation[] = [];
  for (let i = 0; i < candidates.length - 1; i++) {
    const mid = (candidates[i] + candidates[i + 1]) / 2;
    if (Math.abs(d0 + slope * mid) <= orb) {
      const exact = tExact > candidates[i] && tExact < candidates[i + 1] ? tExact : null;
      intervals.push({ tStart: candidates[i], tEnd: candidates[i + 1], tExact: exact });
    }
  }

  return intervals;
}

export interface TransitInterval {
  planet: string;
  aspecto: "Conjunção" | "Quadratura" | "Oposição";
  planetNatal: string;
  activationDate: Date;
  exitDate: Date;
  peakDate: Date | null;
  minOrb: number;
}

export interface UpcomingTransit {
  planet: string;
  aspecto: "Conjunção" | "Quadratura" | "Oposição";
  planetNatal: string;
  status: "active" | "upcoming";
  activationDate: string; // ISO
  peakDate: string | null; // ISO
  exitDate: string; // ISO
  daysUntilPeak: number | null;
  minOrb: number;
  orbCategory: "slow" | "fast";
}

/**
 * Varre o horizonte futuro e retorna trânsitos que entrarem na zona de ativação
 * (orbe dinâmico) dentro do período, ou que já estejam ativos no dia de início.
 */
export async function findUpcomingTransits(
  profile: any,
  startDate: Date = new Date(),
  horizonDays: number = 30
): Promise<UpcomingTransit[]> {
  const natalPlanets = getNatalDegrees(profile);
  const allowedNatal = natalPlanets.filter((p) =>
    NATAL_PLANETS_ALLOWED.some((n) => n.toLowerCase() === p.name.toLowerCase())
  );

  // Posições nos pontos de ancoragem: início, meio(s) e fim do horizonte.
  const midDays = Math.ceil(horizonDays / 2);
  const [startPositions, midPositions, endPositions] = await Promise.all([
    getTropicalTransitDegrees(startDate, true),
    getTropicalTransitDegrees(addDays(startDate, midDays), true),
    getTropicalTransitDegrees(addDays(startDate, horizonDays), true),
  ]);

  const results: TransitInterval[] = [];
  const seen = new Set<string>();

  for (const transitPlanet of TRANSIT_PLANETS_ALLOWED) {
    const orb = getDynamicOrb(transitPlanet);
    const lonStart = startPositions[transitPlanet];
    const lonMid = midPositions[transitPlanet];
    const lonEnd = endPositions[transitPlanet];
    if (lonStart == null || lonMid == null || lonEnd == null) continue;

    for (const natal of allowedNatal) {
      for (const aspect of ASPECT_TARGETS) {
        const key = `${transitPlanet}|${natal.name}|${aspect.nome}`;
        if (seen.has(key)) continue;

        const target = normalizeAngle(natal.longitude + aspect.centro);

        // Segmento 1: início -> meio
        const d0 = signedDelta(lonStart, target);
        const d1 = signedDelta(lonMid, target);
        const seg1 = findLinearActivations(d0, d1, orb, midDays);

        // Segmento 2: meio -> fim
        const d2 = signedDelta(lonEnd, target);
        const seg2 = findLinearActivations(d1, d2, orb, horizonDays - midDays).map((i) => ({
          tStart: i.tStart + midDays,
          tEnd: i.tEnd + midDays,
          tExact: i.tExact == null ? null : i.tExact + midDays,
        }));

        const all = [...seg1, ...seg2];
        if (all.length === 0) continue;

        // Junta intervalos adjacentes
        all.sort((a, b) => a.tStart - b.tStart);
        const merged: LinearActivation[] = [];
        for (const interval of all) {
          const last = merged[merged.length - 1];
          if (last && Math.abs(interval.tStart - last.tEnd) < 0.001) {
            last.tEnd = interval.tEnd;
            if (interval.tExact != null) last.tExact = interval.tExact;
          } else {
            merged.push({ ...interval });
          }
        }

        for (const interval of merged) {
          const activationDate = addDays(startDate, interval.tStart);
          const exitDate = addDays(startDate, interval.tEnd);

          // Refina o pico exato a partir da estimativa linear
          let peakDate: Date | null = null;
          const tExact = interval.tExact;
          if (tExact != null) {
            const estimate = addDays(startDate, tExact);
            try {
              peakDate = await findExactPeakDate(transitPlanet, target, estimate, 1);
            } catch (err) {
              console.warn(`[transitHorizonEngine] Erro ao refinar pico para ${transitPlanet} ${aspect.nome} ${natal.name}:`, err);
            }
          }
          // Se a estimativa linear não cruzou zero no segmento, tenta refinar a partir
          // do ponto médio do intervalo (caso de borda).
          if (!peakDate) {
            const midEstimate = addDays(startDate, (interval.tStart + interval.tEnd) / 2);
            try {
              peakDate = await findExactPeakDate(transitPlanet, target, midEstimate, 1);
            } catch (err) {
              // ignora
            }
          }

          results.push({
            planet: transitPlanet,
            aspecto: aspect.nome,
            planetNatal: natal.name,
            activationDate,
            exitDate,
            peakDate,
            minOrb: 0, // calculado abaixo
          });
        }

        seen.add(key);
      }
    }
  }

  // Converte para o formato final, calcula status e orb mínima estimada
  const upcoming: UpcomingTransit[] = [];
  for (const r of results) {
    const status = r.activationDate.getTime() <= startDate.getTime() ? "active" : "upcoming";

    let daysUntilPeak: number | null = null;
    if (r.peakDate && r.peakDate.getTime() >= startDate.getTime()) {
      daysUntilPeak = daysBetween(startDate, r.peakDate);
    }

    upcoming.push({
      planet: r.planet,
      aspecto: r.aspecto,
      planetNatal: r.planetNatal,
      status,
      activationDate: r.activationDate.toISOString(),
      peakDate: r.peakDate ? r.peakDate.toISOString() : null,
      exitDate: r.exitDate.toISOString(),
      daysUntilPeak,
      minOrb: Math.round(r.minOrb * 100) / 100,
      orbCategory: getPlanetSpeedGroup(r.planet) === "fast" ? "fast" : "slow",
    });
  }

  // Ordena: ativos primeiro, depois por proximidade do pico
  upcoming.sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    const da = a.daysUntilPeak ?? Infinity;
    const db = b.daysUntilPeak ?? Infinity;
    return da - db;
  });

  return upcoming;
}
