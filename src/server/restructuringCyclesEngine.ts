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

async function planetLongitudeAtDate(planet: string, date: Date): Promise<number | null> {
  const degrees = await getTropicalTransitDegrees(date, true);
  if (degrees[planet] !== undefined) return degrees[planet];
  return null;
}

function meanNodeLongitudeAtDate(date: Date): number {
  return getMeanLunarNode(jdeAt(date));
}

async function findAspectWindow(
  planet: string,
  natalLongitude: number,
  targetAspect: number,
  centerDate: Date,
  maxDays: number = 365 * 5
): Promise<{ startDate: Date; endDate: Date; peakDate: Date } | null> {
  // Find the start by going backward until outside orb
  let startDate = new Date(centerDate.getTime());
  let prev = startDate;
  for (let i = 0; i < maxDays; i++) {
    const test = new Date(prev.getTime() - MS_PER_DAY);
    const lon = planet === "Nodo Norte" ? meanNodeLongitudeAtDate(test) : await planetLongitudeAtDate(planet, test);
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
    const lon = planet === "Nodo Norte" ? meanNodeLongitudeAtDate(test) : await planetLongitudeAtDate(planet, test);
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
    const lon = planet === "Nodo Norte" ? meanNodeLongitudeAtDate(test) : await planetLongitudeAtDate(planet, test);
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

interface CycleDefinition {
  planet: string;
  cycle: string;
  aspect: number; // 0, 90, 180
  orbitalPeriodYears: number;
}

const CYCLE_DEFINITIONS: CycleDefinition[] = [
  { planet: "Saturno", cycle: "Retorno de Saturno", aspect: 0, orbitalPeriodYears: 29.5 },
  { planet: "Saturno", cycle: "Quadratura de Saturno", aspect: 90, orbitalPeriodYears: 29.5 },
  { planet: "Saturno", cycle: "Oposição de Saturno", aspect: 180, orbitalPeriodYears: 29.5 },
  { planet: "Urano", cycle: "Quadratura de Urano", aspect: 90, orbitalPeriodYears: 84 },
  { planet: "Urano", cycle: "Oposição de Urano", aspect: 180, orbitalPeriodYears: 84 },
  { planet: "Urano", cycle: "Retorno de Urano", aspect: 0, orbitalPeriodYears: 84 },
  { planet: "Netuno", cycle: "Quadratura de Netuno", aspect: 90, orbitalPeriodYears: 165 },
  { planet: "Plutão", cycle: "Quadratura de Plutão", aspect: 90, orbitalPeriodYears: 248 },
];

const NODAL_ORBITAL_PERIOD_YEARS = 18.6;

function getNatalLongitude(points: NatalPoint[], name: string): number | null {
  return points.find(p => p.name === name)?.longitude ?? null;
}

function getNatalHouse(points: NatalPoint[], name: string): number {
  return points.find(p => p.name === name)?.house ?? 0;
}

async function meanDailySpeed(planet: string, referenceDate: Date): Promise<number> {
  const lon1 = planet === "Nodo Norte" ? meanNodeLongitudeAtDate(referenceDate) : await planetLongitudeAtDate(planet, referenceDate);
  const future = new Date(referenceDate.getTime() + 365 * MS_PER_DAY);
  const lon2 = planet === "Nodo Norte" ? meanNodeLongitudeAtDate(future) : await planetLongitudeAtDate(planet, future);
  if (lon1 === null || lon2 === null) return planet === "Nodo Norte" ? -0.053 : 0;
  let delta = normalizeAngle(lon2) - normalizeAngle(lon1);
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta / 365;
}

async function findNextAspectWindow(
  planet: string,
  natalLongitude: number,
  targetAspect: number,
  referenceDate: Date,
  maxAttempts: number = 3
): Promise<{ startDate: Date; endDate: Date; peakDate: Date } | null> {
  const currentLon = planet === "Nodo Norte" ? meanNodeLongitudeAtDate(referenceDate) : await planetLongitudeAtDate(planet, referenceDate);
  if (currentLon === null) {
    console.warn(`[RESTRUCTURING CYCLES] Não foi possível obter longitude atual de ${planet}`);
    return null;
  }

  const speed = await meanDailySpeed(planet, referenceDate);
  if (Math.abs(speed) < 1e-6) {
    console.warn(`[RESTRUCTURING CYCLES] Velocidade média de ${planet} muito pequena (${speed})`);
    return null;
  }

  const targetLongitude = normalizeAngle(natalLongitude + targetAspect);
  let angularGap = normalizeAngle(targetLongitude - normalizeAngle(currentLon));
  if (speed < 0) {
    // For retrograde/nodal motion, the gap direction is opposite
    angularGap = normalizeAngle(-angularGap);
  }

  // First rough estimate: days to reach target longitude
  let estimatedDays = angularGap / Math.abs(speed);
  // If estimated date is in the past, add integer orbital periods in days until future
  const periodDays = 360 / Math.abs(speed);
  while (referenceDate.getTime() + estimatedDays * MS_PER_DAY <= referenceDate.getTime()) {
    estimatedDays += periodDays;
  }

  let attempt = 0;
  let searchCenter = new Date(referenceDate.getTime() + estimatedDays * MS_PER_DAY);

  while (attempt < maxAttempts) {
    console.log(`[RESTRUCTURING CYCLES] ${planet} aspecto ${targetAspect}° — tentativa ${attempt + 1}, centro estimado ${formatDateISO(searchCenter)}`);

    let refinedCenter: Date | null = null;
    let bestOrb = Infinity;
    // Scan +/- 365 days around estimate
    for (let d = -365; d <= 365; d++) {
      const date = new Date(searchCenter.getTime() + d * MS_PER_DAY);
      const lon = planet === "Nodo Norte" ? meanNodeLongitudeAtDate(date) : await planetLongitudeAtDate(planet, date);
      if (lon === null) continue;
      const dist = angularDistance(lon, natalLongitude);
      const orb = Math.abs(dist - targetAspect);
      if (orb <= ORB && orb < bestOrb) {
        bestOrb = orb;
        refinedCenter = date;
      }
      if (orb <= 0.5) break; // close enough
    }

    if (refinedCenter) {
      const window = await findAspectWindow(planet, natalLongitude, targetAspect, refinedCenter, 365 * 2);
      if (window) {
        console.log(`[RESTRUCTURING CYCLES] ${planet} aspecto ${targetAspect}° — janela encontrada: ${formatDateISO(window.startDate)} → ${formatDateISO(window.endDate)}`);
        if (window.endDate.getTime() > referenceDate.getTime()) {
          return window;
        }
        // Window entirely in the past, jump to next orbital period
        searchCenter = new Date(searchCenter.getTime() + periodDays * MS_PER_DAY);
      }
    } else {
      console.warn(`[RESTRUCTURING CYCLES] ${planet} aspecto ${targetAspect}° — centro não refinado em ${formatDateISO(searchCenter)}`);
      searchCenter = new Date(searchCenter.getTime() + periodDays * MS_PER_DAY);
    }

    attempt++;
  }

  console.warn(`[RESTRUCTURING CYCLES] ${planet} aspecto ${targetAspect}° — não encontrou janela futura após ${maxAttempts} tentativas`);
  return null;
}

function concurrentCyclesForHouse(cycles: RestructuringCycle[], house: number | undefined, excludeKey: string): string[] {
  if (!house) return [];
  return cycles
    .filter(c => c.affectedHouse === house && `${c.tradition}-${c.planet}-${c.cycleName}` !== excludeKey)
    .map(c => c.cycleName);
}

export async function calculateRestructuringCycles(
  profile: CompleteAstrologicalProfile,
  referenceDate: Date = new Date()
): Promise<RestructuringCycle[]> {
  console.log(`[RESTRUCTURING CYCLES] Iniciando cálculo para ${profile.birthData?.birthDate || "data desconhecida"}, referência ${formatDateISO(referenceDate)}`);
  console.log(`[RESTRUCTURING CYCLES] vedic_saturn_transits presente: ${!!profile.vedic_saturn_transits}`);

  const cycles: RestructuringCycle[] = [];
  const points = getNatalPoints(profile);

  // Tropical slow planet cycles
  for (const def of CYCLE_DEFINITIONS) {
    const natalLon = getNatalLongitude(points, def.planet);
    if (natalLon === null) {
      console.log(`[RESTRUCTURING CYCLES] ${def.planet}: longitude natal não encontrada`);
      continue;
    }

    const currentLon = await planetLongitudeAtDate(def.planet, referenceDate);
    if (currentLon === null) {
      console.log(`[RESTRUCTURING CYCLES] ${def.planet}: longitude atual não encontrada`);
      continue;
    }

    const dist = angularDistance(currentLon, natalLon);
    const orb = Math.abs(dist - def.aspect);
    const house = getNatalHouse(points, def.planet);
    console.log(`[RESTRUCTURING CYCLES] ${def.planet} ${def.cycle}: dist=${dist.toFixed(2)}°, orb=${orb.toFixed(2)}°, casa=${house}`);

    if (orb <= ORB) {
      const window = await findAspectWindow(def.planet, natalLon, def.aspect, referenceDate);
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
      const nextWindow = await findNextAspectWindow(def.planet, natalLon, def.aspect, referenceDate);
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
      const window = await findAspectWindow("Nodo Norte", northNodeLon, 0, referenceDate);
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
      const nextWindow = await findNextAspectWindow("Nodo Norte", northNodeLon, 0, referenceDate);
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
        const window = await findAspectWindow("Nodo Norte", northNodeLon, 180, referenceDate);
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
        const nextWindow = await findNextAspectWindow("Nodo Norte", northNodeLon, 180, referenceDate);
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

  const todayStr = formatDateISO(referenceDate);

  // Vedic Saturn cycles from JHora data
  const vedic = profile.vedic_saturn_transits;
  const vedicFuturePeriods: { name: string; planet: string; house: number; startDate: string; endDate: string }[] = [];

  if (vedic) {
    function collectVedicPeriod(
      name: string,
      planet: string,
      house: number,
      period: { startDate: string; endDate: string; description?: string } | null | undefined
    ) {
      if (!period || !period.startDate || !period.endDate) return;
      const isActive = todayStr >= period.startDate && todayStr <= period.endDate;
      const cycle: RestructuringCycle = {
        type: isActive ? "ativo" : "proximo",
        tradition: "vedic",
        planet,
        cycleName: name,
        isActive,
        startDate: period.startDate,
        endDate: period.endDate,
        affectedHouse: house,
      };
      cycles.push(cycle);
      if (!isActive && period.startDate >= todayStr) {
        vedicFuturePeriods.push({ name, planet, house, startDate: period.startDate, endDate: period.endDate });
      }
    }

    // Sade Sati sign-based phases
    for (const period of vedic.sadeSati.signBased) {
      if (period.phase1) collectVedicPeriod("Shani Sade Sati — Fase Ascendente", "Saturno", 12, period.phase1);
      if (period.phase2) collectVedicPeriod("Shani Sade Sati — Fase de Pico", "Saturno", 1, period.phase2);
      if (period.phase3) collectVedicPeriod("Shani Sade Sati — Fase de Descida", "Saturno", 2, period.phase3);
    }

    // Moon 4th / 8th
    for (const period of vedic.moonTransits.fourthHouse.signBased) {
      if (period.phase1) collectVedicPeriod("Ardha-Ashtama Shani / Kantaka Shani da Lua", "Saturno", 4, period.phase1);
    }
    for (const period of vedic.moonTransits.eighthHouse.signBased) {
      if (period.phase1) collectVedicPeriod("Ashtama Shani da Lua", "Saturno", 8, period.phase1);
    }

    // Ascendant 4th / 8th
    for (const period of vedic.ascendantTransits.fourthHouse.signBased) {
      if (period.phase1) collectVedicPeriod("Kantaka Shani do Ascendente", "Saturno", 4, period.phase1);
    }
    for (const period of vedic.ascendantTransits.eighthHouse.signBased) {
      if (period.phase1) collectVedicPeriod("Ashtama Shani do Ascendente", "Saturno", 8, period.phase1);
    }

    console.log(`[RESTRUCTURING CYCLES] Ciclos védicos futuros coletados: ${vedicFuturePeriods.length}`);
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

  // Separate active and upcoming; keep only the single closest upcoming cycle
  const active = cycles.filter(c => c.isActive);
  let upcoming = cycles
    .filter(c => !c.isActive && c.startDate && c.startDate >= todayStr)
    .sort((a, b) => (a.startDate || "9999-12-31").localeCompare(b.startDate || "9999-12-31"));

  console.log(`[RESTRUCTURING CYCLES] Ciclos ativos: ${active.length}; próximos candidatos: ${upcoming.length}`);

  // Fallback: if no active and no upcoming tropical/nodal cycle, use the closest JHora Saturn period
  if (active.length === 0 && upcoming.length === 0 && vedicFuturePeriods.length > 0) {
    const nextVedic = vedicFuturePeriods.sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
    console.log(`[RESTRUCTURING CYCLES] Fallback védico: próximo ciclo = ${nextVedic.name} em ${nextVedic.startDate}`);
    upcoming.push({
      type: "proximo",
      tradition: "vedic",
      planet: nextVedic.planet,
      cycleName: nextVedic.name,
      isActive: false,
      startDate: nextVedic.startDate,
      endDate: nextVedic.endDate,
      affectedHouse: nextVedic.house,
    });
  }

  const result = [...active, ...upcoming.slice(0, 1)];
  console.log(`[RESTRUCTURING CYCLES] Resultado final: ${result.length} ciclo(s)`);
  result.forEach(c => console.log(`  - ${c.cycleName} (${c.tradition}, ${c.type}) | ${c.startDate} → ${c.endDate}`));
  return result;
}
