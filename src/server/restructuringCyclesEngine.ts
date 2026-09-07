import {
  getTropicalTransitDegrees,
  getMeanLunarNode,
  SIGN_NAMES,
} from "./transitEngine";
import type { CompleteAstrologicalProfile } from "./astrology";

export interface RestructuringCycle {
  type: "ativo" | "proximo";
  tradition: "tropical" | "vedic";
  planet: string;
  cycleName: string;
  isActive: boolean;
  orb?: number;
  startDate?: string;
  endDate?: string;
  ageAtPeak?: number;
  affectedHouse?: number;
  concurrentTransits?: string[];
}

const ORB = 8;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const SIGNS_PT = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes",
];

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b)) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function jdeAt(date: Date): number {
  const jd = date.getTime() / MS_PER_DAY + 2440587.5;
  return jd;
}

function dateFromJde(jde: number): Date {
  return new Date((jde - 2440587.5) * MS_PER_DAY);
}

function planetLongitudeAtDate(planet: string, date: Date): number | null {
  const degrees = getTropicalTransitDegrees(date, true);
  if (degrees[planet] !== undefined) return degrees[planet];
  return null;
}

function meanNodeLongitudeAtDate(date: Date): number {
  return getMeanLunarNode(jdeAt(date));
}

function findAspectWindow(
  planet: string,
  natalLongitude: number,
  targetAspect: number,
  centerDate: Date,
  maxDays: number = 365 * 5
): { startDate: Date; endDate: Date; peakDate: Date } | null {
  // Find the start by going backward until outside orb
  let startDate = new Date(centerDate.getTime());
  let prev = startDate;
  for (let i = 0; i < maxDays; i++) {
    const test = new Date(prev.getTime() - MS_PER_DAY);
    const lon = planet === "Nodo Norte" ? meanNodeLongitudeAtDate(test) : planetLongitudeAtDate(planet, test);
    if (lon === null) break;
    const dist = angularDistance(lon, natalLongitude);
    if (Math.abs(dist - targetAspect) > ORB) break;
    startDate = test;
    prev = test;
  }

  // Find the end by going forward until outside orb
  let endDate = new Date(centerDate.getTime());
  prev = endDate;
  for (let i = 0; i < maxDays; i++) {
    const test = new Date(prev.getTime() + MS_PER_DAY);
    const lon = planet === "Nodo Norte" ? meanNodeLongitudeAtDate(test) : planetLongitudeAtDate(planet, test);
    if (lon === null) break;
    const dist = angularDistance(lon, natalLongitude);
    if (Math.abs(dist - targetAspect) > ORB) break;
    endDate = test;
    prev = test;
  }

  // Peak = closest to exact aspect within window
  let peakDate = centerDate;
  let bestOrb = Infinity;
  const checkDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / MS_PER_DAY));
  for (let d = 0; d <= checkDays; d++) {
    const test = new Date(startDate.getTime() + d * MS_PER_DAY);
    const lon = planet === "Nodo Norte" ? meanNodeLongitudeAtDate(test) : planetLongitudeAtDate(planet, test);
    if (lon === null) continue;
    const dist = angularDistance(lon, natalLongitude);
    const orb = Math.abs(dist - targetAspect);
    if (orb < bestOrb) {
      bestOrb = orb;
      peakDate = test;
    }
  }

  return { startDate, endDate, peakDate };
}

function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

interface NatalPoint {
  name: string;
  longitude: number;
  house: number;
}

function getNatalPoints(profile: CompleteAstrologicalProfile): NatalPoint[] {
  const planets = profile.tropical_natal?.planets ?? [];
  const points: NatalPoint[] = [];
  for (const p of planets) {
    if (typeof p.longitude === "number" && !isNaN(p.longitude)) {
      points.push({ name: p.name, longitude: p.longitude, house: p.house ?? 0 });
    }
  }
  const northNode = points.find(p => p.name === "Nodo Norte");
  const southNode = points.find(p => p.name === "Nodo Sul");
  if (!northNode && southNode) {
    points.push({
      name: "Nodo Norte",
      longitude: normalizeAngle(southNode.longitude + 180),
      house: southNode.house,
    });
  }
  if (!southNode && northNode) {
    points.push({
      name: "Nodo Sul",
      longitude: normalizeAngle(northNode.longitude + 180),
      house: northNode.house,
    });
  }
  return points;
}

function ageAtDate(birthDateStr: string, date: Date): number {
  const birth = new Date(`${birthDateStr}T00:00:00`);
  let years = date.getFullYear() - birth.getFullYear();
  const m = date.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && date.getDate() < birth.getDate())) years--;
  return years;
}

const CYCLE_DEFINITIONS: {
  planet: string;
  cycle: string;
  aspect: number;
  approximateAge: number;
  upcomingAges?: number[];
}[] = [
  { planet: "Saturno", cycle: "Retorno de Saturno", aspect: 0, approximateAge: 29.5, upcomingAges: [29.5, 59, 88] },
  { planet: "Saturno", cycle: "Quadratura de Saturno", aspect: 90, approximateAge: 7.25 },
  { planet: "Saturno", cycle: "Oposição de Saturno", aspect: 180, approximateAge: 14.75 },
  { planet: "Urano", cycle: "Quadratura de Urano", aspect: 90, approximateAge: 21 },
  { planet: "Urano", cycle: "Oposição de Urano", aspect: 180, approximateAge: 42 },
  { planet: "Urano", cycle: "Retorno de Urano", aspect: 0, approximateAge: 84 },
  { planet: "Netuno", cycle: "Quadratura de Netuno", aspect: 90, approximateAge: 42 },
  { planet: "Plutão", cycle: "Quadratura de Plutão", aspect: 90, approximateAge: 60 },
];

function getNatalLongitude(points: NatalPoint[], name: string): number | null {
  return points.find(p => p.name === name)?.longitude ?? null;
}

function getNatalHouse(points: NatalPoint[], name: string): number {
  return points.find(p => p.name === name)?.house ?? 0;
}

function findNextApproximateCycleDate(
  planet: string,
  natalLongitude: number,
  targetAspect: number,
  referenceDate: Date
): { startDate: Date; endDate: Date; peakDate: Date } | null {
  // Scan forward up to 1 year for entering the orb window
  for (let d = 0; d <= 365; d++) {
    const date = new Date(referenceDate.getTime() + d * MS_PER_DAY);
    const lon = planet === "Nodo Norte" ? meanNodeLongitudeAtDate(date) : planetLongitudeAtDate(planet, date);
    if (lon === null) continue;
    const dist = angularDistance(lon, natalLongitude);
    if (Math.abs(dist - targetAspect) <= ORB) {
      return findAspectWindow(planet, natalLongitude, targetAspect, date, 365 * 2);
    }
  }
  return null;
}

function concurrentCyclesForHouse(cycles: RestructuringCycle[], house: number | undefined, excludeKey: string): string[] {
  if (!house) return [];
  return cycles
    .filter(c => c.affectedHouse === house && `${c.tradition}-${c.planet}-${c.cycleName}` !== excludeKey)
    .map(c => c.cycleName);
}

export function calculateRestructuringCycles(
  profile: CompleteAstrologicalProfile,
  referenceDate: Date = new Date()
): RestructuringCycle[] {
  const cycles: RestructuringCycle[] = [];
  const points = getNatalPoints(profile);

  // Tropical slow planet cycles
  for (const def of CYCLE_DEFINITIONS) {
    const natalLon = getNatalLongitude(points, def.planet);
    if (natalLon === null) continue;

    const currentLon = planetLongitudeAtDate(def.planet, referenceDate);
    if (currentLon === null) continue;

    const dist = angularDistance(currentLon, natalLon);
    const orb = Math.abs(dist - def.aspect);
    const house = getNatalHouse(points, def.planet);

    if (orb <= ORB) {
      const window = findAspectWindow(def.planet, natalLon, def.aspect, referenceDate);
      if (window) {
        const cycle: RestructuringCycle = {
          type: "ativo",
          tradition: "tropical",
          planet: def.planet,
          cycleName: def.cycle,
          isActive: true,
          orb: Math.round(orb * 10) / 10,
          startDate: formatDateISO(window.startDate),
          endDate: formatDateISO(window.endDate),
          ageAtPeak: ageAtDate(profile.birthData.birthDate, window.peakDate),
          affectedHouse: house,
        };
        cycle.concurrentTransits = concurrentCyclesForHouse(cycles, house, `${cycle.tradition}-${cycle.planet}-${cycle.cycleName}`);
        cycles.push(cycle);
      }
    } else {
      const nextWindow = findNextApproximateCycleDate(def.planet, natalLon, def.aspect, referenceDate);
      if (nextWindow) {
        cycles.push({
          type: "proximo",
          tradition: "tropical",
          planet: def.planet,
          cycleName: def.cycle,
          isActive: false,
          startDate: formatDateISO(nextWindow.startDate),
          endDate: formatDateISO(nextWindow.endDate),
          ageAtPeak: ageAtDate(profile.birthData.birthDate, nextWindow.peakDate),
          affectedHouse: house,
        });
      }
    }
  }

  // Nodal cycles (tropical)
  const northNodeLon = getNatalLongitude(points, "Nodo Norte");
  const southNodeLon = getNatalLongitude(points, "Nodo Sul");
  const nodalHouse = northNodeLon !== null ? getNatalHouse(points, "Nodo Norte") : 0;

  if (northNodeLon !== null) {
    const currentNode = meanNodeLongitudeAtDate(referenceDate);
    const nodeReturnDist = angularDistance(currentNode, northNodeLon);
    const nodeReturnOrb = Math.abs(nodeReturnDist - 0);

    if (nodeReturnOrb <= ORB) {
      const window = findAspectWindow("Nodo Norte", northNodeLon, 0, referenceDate);
      if (window) {
        const cycle: RestructuringCycle = {
          type: "ativo",
          tradition: "tropical",
          planet: "Nodo Norte",
          cycleName: "Retorno Nodal",
          isActive: true,
          orb: Math.round(nodeReturnOrb * 10) / 10,
          startDate: formatDateISO(window.startDate),
          endDate: formatDateISO(window.endDate),
          ageAtPeak: ageAtDate(profile.birthData.birthDate, window.peakDate),
          affectedHouse: nodalHouse,
        };
        cycle.concurrentTransits = concurrentCyclesForHouse(cycles, nodalHouse, `${cycle.tradition}-${cycle.planet}-${cycle.cycleName}`);
        cycles.push(cycle);
      }
    } else {
      const nextWindow = findNextApproximateCycleDate("Nodo Norte", northNodeLon, 0, referenceDate);
      if (nextWindow) {
        cycles.push({
          type: "proximo",
          tradition: "tropical",
          planet: "Nodo Norte",
          cycleName: "Retorno Nodal",
          isActive: false,
          startDate: formatDateISO(nextWindow.startDate),
          endDate: formatDateISO(nextWindow.endDate),
          ageAtPeak: ageAtDate(profile.birthData.birthDate, nextWindow.peakDate),
          affectedHouse: nodalHouse,
        });
      }
    }

    if (southNodeLon !== null) {
      const oppositionDist = angularDistance(currentNode, northNodeLon);
      const oppositionOrb = Math.abs(oppositionDist - 180);

      if (oppositionOrb <= ORB) {
        const window = findAspectWindow("Nodo Norte", northNodeLon, 180, referenceDate);
        if (window) {
          const cycle: RestructuringCycle = {
            type: "ativo",
            tradition: "tropical",
            planet: "Nodo Norte",
            cycleName: "Oposição Nodal",
            isActive: true,
            orb: Math.round(oppositionOrb * 10) / 10,
            startDate: formatDateISO(window.startDate),
            endDate: formatDateISO(window.endDate),
            ageAtPeak: ageAtDate(profile.birthData.birthDate, window.peakDate),
            affectedHouse: nodalHouse,
          };
          cycle.concurrentTransits = concurrentCyclesForHouse(cycles, nodalHouse, `${cycle.tradition}-${cycle.planet}-${cycle.cycleName}`);
          cycles.push(cycle);
        }
      } else {
        const nextWindow = findNextApproximateCycleDate("Nodo Norte", northNodeLon, 180, referenceDate);
        if (nextWindow) {
          cycles.push({
            type: "proximo",
            tradition: "tropical",
            planet: "Nodo Norte",
            cycleName: "Oposição Nodal",
            isActive: false,
            startDate: formatDateISO(nextWindow.startDate),
            endDate: formatDateISO(nextWindow.endDate),
            ageAtPeak: ageAtDate(profile.birthData.birthDate, nextWindow.peakDate),
            affectedHouse: nodalHouse,
          });
        }
      }
    }
  }

  // Vedic Saturn cycles from JHora data
  const vedic = profile.vedic_saturn_transits;
  if (vedic) {
    const todayStr = formatDateISO(referenceDate);

    function addVedicCycle(
      name: string,
      planet: string,
      house: number,
      period: { startDate: string; endDate: string; description?: string }
    ) {
      const isActive = todayStr >= period.startDate && todayStr <= period.endDate;
      const startInFuture = period.startDate >= todayStr && period.startDate <= formatDateISO(new Date(referenceDate.getTime() + 365 * MS_PER_DAY));
      cycles.push({
        type: isActive ? "ativo" : "proximo",
        tradition: "vedic",
        planet,
        cycleName: name,
        isActive,
        startDate: period.startDate,
        endDate: period.endDate,
        affectedHouse: house,
      });
    }

    // Sade Sati sign-based phases
    for (const period of vedic.sadeSati.signBased) {
      if (period.phase1) addVedicCycle("Shani Sade Sati — Fase Ascendente", "Saturno", 12, period.phase1);
      if (period.phase2) addVedicCycle("Shani Sade Sati — Fase de Pico", "Saturno", 1, period.phase2);
      if (period.phase3) addVedicCycle("Shani Sade Sati — Fase de Descida", "Saturno", 2, period.phase3);
    }

    // Moon 4th / 8th
    for (const period of vedic.moonTransits.fourthHouse.signBased) {
      if (period.phase1) addVedicCycle("Ardha-Ashtama Shani / Kantaka Shani da Lua", "Saturno", 4, period.phase1);
    }
    for (const period of vedic.moonTransits.eighthHouse.signBased) {
      if (period.phase1) addVedicCycle("Ashtama Shani da Lua", "Saturno", 8, period.phase1);
    }

    // Ascendant 4th / 8th
    for (const period of vedic.ascendantTransits.fourthHouse.signBased) {
      if (period.phase1) addVedicCycle("Kantaka Shani do Ascendente", "Saturno", 4, period.phase1);
    }
    for (const period of vedic.ascendantTransits.eighthHouse.signBased) {
      if (period.phase1) addVedicCycle("Ashtama Shani do Ascendente", "Saturno", 8, period.phase1);
    }
  }

  // Fill concurrent transits for vedic entries too
  for (const cycle of cycles) {
    if (!cycle.concurrentTransits) {
      cycle.concurrentTransits = concurrentCyclesForHouse(
        cycles,
        cycle.affectedHouse,
        `${cycle.tradition}-${cycle.planet}-${cycle.cycleName}`
      );
    }
  }

  // Sort: active first, then by start date
  return cycles.sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    const aDate = a.startDate || "9999-12-31";
    const bDate = b.startDate || "9999-12-31";
    return aDate.localeCompare(bDate);
  });
}
