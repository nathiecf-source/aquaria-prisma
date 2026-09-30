import {
  getTropicalTransitDegrees,
  getNatalDegrees,
  NATAL_PLANETS_ALLOWED,
  TRANSIT_PLANETS_ALLOWED,
} from "./transitEngine";
import { getPlanetSpeedGroup } from "./transitWindowEngine";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const LOOKBACK_DAYS = 30;

const ASPECT_TARGETS = [
  { nome: "Conjunção" as const, offsets: [0] },
  { nome: "Quadratura" as const, offsets: [90, -90] },
  { nome: "Oposição" as const, offsets: [180] },
];

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function signedDelta(from: number, to: number): number {
  const d = normalizeAngle(from - to);
  return d > 180 ? d - 360 : d;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / MS_PER_DAY));
}

function interpolateDate(start: Date, end: Date, startDelta: number, endDelta: number, target = 0): Date {
  const denominator = endDelta - startDelta;
  const ratio = Math.abs(denominator) < 1e-9 ? 0 : Math.max(0, Math.min(1, (target - startDelta) / denominator));
  return new Date(start.getTime() + (end.getTime() - start.getTime()) * ratio);
}

export function getDynamicOrb(planet: string): number {
  return getPlanetSpeedGroup(planet) === "fast" ? 2 : 4;
}

export function getAspectTargetLongitudes(natalLongitude: number, aspect: "Conjunção" | "Quadratura" | "Oposição"): number[] {
  const definition = ASPECT_TARGETS.find((item) => item.nome === aspect);
  return (definition?.offsets ?? []).map((offset) => normalizeAngle(natalLongitude + offset));
}

export function getAngularOrb(longitude: number, target: number): number {
  return Math.abs(signedDelta(longitude, target));
}

export interface UpcomingTransit {
  planet: string;
  aspecto: "Conjunção" | "Quadratura" | "Oposição";
  planetNatal: string;
  status: "active" | "upcoming";
  activationDate: string;
  peakDate: string | null;
  exitDate: string;
  daysUntilPeak: number | null;
  minOrb: number;
  orbCategory: "slow" | "fast";
}

interface Candidate {
  target: number;
  currentOrb: number;
  peakDate: Date | null;
  activationDate: Date;
  exitDate: Date;
  minOrb: number;
}

function findCrossings(samples: Array<{ date: Date; longitude: number }>, target: number): Date[] {
  const crossings: Date[] = [];
  for (let i = 0; i < samples.length - 1; i++) {
    const current = samples[i];
    const next = samples[i + 1];
    const d0 = signedDelta(current.longitude, target);
    const d1 = signedDelta(next.longitude, target);
    if (Math.abs(d0) < 1e-8) crossings.push(current.date);
    if (d0 * d1 < 0 && Math.abs(d1 - d0) < 180) {
      crossings.push(interpolateDate(current.date, next.date, d0, d1));
    }
  }
  return crossings;
}

function findOrbWindow(
  samples: Array<{ date: Date; longitude: number }>,
  target: number,
  orb: number,
  anchorDate: Date
): { activationDate: Date; exitDate: Date; minOrb: number } {
  const anchorIndex = samples.reduce((best, sample, index) =>
    Math.abs(sample.date.getTime() - anchorDate.getTime()) < Math.abs(samples[best].date.getTime() - anchorDate.getTime()) ? index : best, 0);
  let startIndex = anchorIndex;
  let endIndex = anchorIndex;
  let minOrb = Math.abs(signedDelta(samples[anchorIndex].longitude, target));

  while (startIndex > 0 && Math.abs(signedDelta(samples[startIndex - 1].longitude, target)) <= orb) startIndex--;
  while (endIndex < samples.length - 1 && Math.abs(signedDelta(samples[endIndex + 1].longitude, target)) <= orb) endIndex++;

  for (let i = startIndex; i <= endIndex; i++) {
    minOrb = Math.min(minOrb, Math.abs(signedDelta(samples[i].longitude, target)));
  }

  let activationDate = samples[startIndex].date;
  if (startIndex > 0) {
    const outside = samples[startIndex - 1];
    const inside = samples[startIndex];
    const d0 = Math.abs(signedDelta(outside.longitude, target));
    const d1 = Math.abs(signedDelta(inside.longitude, target));
    activationDate = interpolateDate(outside.date, inside.date, d0, d1, orb);
  }

  let exitDate = samples[endIndex].date;
  if (endIndex < samples.length - 1) {
    const inside = samples[endIndex];
    const outside = samples[endIndex + 1];
    const d0 = Math.abs(signedDelta(inside.longitude, target));
    const d1 = Math.abs(signedDelta(outside.longitude, target));
    exitDate = interpolateDate(inside.date, outside.date, d0, d1, orb);
  }

  return { activationDate, exitDate, minOrb };
}

export async function findUpcomingTransits(
  profile: any,
  startDate: Date = new Date(),
  horizonDays: number = 30
): Promise<UpcomingTransit[]> {
  const natalPlanets = getNatalDegrees(profile).filter((planet) =>
    NATAL_PLANETS_ALLOWED.some((allowed) => allowed.toLowerCase() === planet.name.toLowerCase())
  );
  const offsets = Array.from({ length: LOOKBACK_DAYS + horizonDays + 1 }, (_, index) => index - LOOKBACK_DAYS);
  const dailyPositions = await Promise.all(offsets.map(async (offset) => ({
    offset,
    date: addDays(startDate, offset),
    positions: await getTropicalTransitDegrees(addDays(startDate, offset), true),
  })));
  const results: UpcomingTransit[] = [];

  for (const transitPlanet of TRANSIT_PLANETS_ALLOWED) {
    const orb = getDynamicOrb(transitPlanet);
    const samples = dailyPositions
      .map(({ date, positions }) => ({ date, longitude: positions[transitPlanet] }))
      .filter((sample): sample is { date: Date; longitude: number } => typeof sample.longitude === "number");
    const current = samples.find((sample) => sample.date.getTime() === startDate.getTime()) ?? samples[LOOKBACK_DAYS];
    if (!current) continue;

    for (const natal of natalPlanets) {
      for (const aspect of ASPECT_TARGETS) {
        const candidates: Candidate[] = [];
        for (const target of getAspectTargetLongitudes(natal.longitude, aspect.nome)) {
          const crossings = findCrossings(samples, target);
          const futureCrossings = crossings.filter((date) => date >= startDate && date <= addDays(startDate, horizonDays));
          const pastCrossings = crossings.filter((date) => date < startDate);
          const currentOrb = Math.abs(signedDelta(current.longitude, target));
          const isActive = currentOrb <= orb;
          const peakDate = isActive
            ? [...pastCrossings, ...futureCrossings].sort((a, b) => Math.abs(a.getTime() - startDate.getTime()) - Math.abs(b.getTime() - startDate.getTime()))[0] ?? null
            : futureCrossings[0] ?? null;
          if (!isActive && !peakDate) continue;
          const window = findOrbWindow(samples, target, orb, peakDate ?? startDate);
          candidates.push({ target, currentOrb, peakDate, ...window });
        }

        if (candidates.length === 0) continue;
        candidates.sort((a, b) => {
          const aActive = a.currentOrb <= orb;
          const bActive = b.currentOrb <= orb;
          if (aActive !== bActive) return aActive ? -1 : 1;
          return (a.peakDate?.getTime() ?? Infinity) - (b.peakDate?.getTime() ?? Infinity);
        });
        const selected = candidates[0];
        const status = selected.currentOrb <= orb ? "active" : "upcoming";
        const daysUntilPeak = selected.peakDate && selected.peakDate >= startDate
          ? daysBetween(startDate, selected.peakDate)
          : null;
        if (status === "upcoming" && (daysUntilPeak == null || daysUntilPeak > horizonDays)) continue;

        results.push({
          planet: transitPlanet,
          aspecto: aspect.nome,
          planetNatal: natal.name,
          status,
          activationDate: selected.activationDate.toISOString(),
          peakDate: selected.peakDate?.toISOString() ?? null,
          exitDate: selected.exitDate.toISOString(),
          daysUntilPeak,
          minOrb: Math.round(selected.minOrb * 100) / 100,
          orbCategory: getPlanetSpeedGroup(transitPlanet) === "fast" ? "fast" : "slow",
        });
      }
    }
  }

  return results.sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    const peakDiff = (a.daysUntilPeak ?? Infinity) - (b.daysUntilPeak ?? Infinity);
    if (peakDiff !== 0) return peakDiff;
    return `${a.planet}|${a.aspecto}|${a.planetNatal}`.localeCompare(`${b.planet}|${b.aspecto}|${b.planetNatal}`, "pt-BR");
  });
}
