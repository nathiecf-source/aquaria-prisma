import type { CompleteAstrologicalProfile, BirthData, PlanetPosition, TropicalNatal } from "./astrology";
import { fetchSolarReturnChart, signRulers } from "./astrology";
import { getFastTransitDegrees, getCurrentTransitDegrees } from "./transitEngine";

export interface ProfectionLordInfo {
  name: string;
  source: "natal" | "solar-return" | "ruler";
  sign?: string;
  house?: number;
  longitude?: number;
}

export interface ProfectionData {
  age: number;
  profectedHouse: number;
  sign: string;
  lords: ProfectionLordInfo[];
  primaryLord: string;
  source: "natal" | "solar-return" | "ruler";
  solarReturn?: TropicalNatal;
  solarReturnYear?: number;
}

const TRADITIONAL_RULERS: Record<string, string> = {
  "Áries": "Marte",
  "Touro": "Vênus",
  "Gêmeos": "Mercúrio",
  "Câncer": "Lua",
  "Leão": "Sol",
  "Virgem": "Mercúrio",
  "Libra": "Vênus",
  "Escorpião": "Marte",
  "Sagitário": "Júpiter",
  "Capricórnio": "Saturno",
  "Aquário": "Saturno",
  "Peixes": "Júpiter",
};

const PROFECTION_PLANETS = new Set([
  "Sol", "Lua", "Mercúrio", "Vênus", "Marte", "Júpiter", "Saturno", "Urano", "Netuno", "Plutão"
]);

const POINTS = /Ascendente|Meio do Céu|MC|Nodo Norte|Nodo Sul|Rahu|Ketu|Quíron|Lilith|Roda da Fortuna|Parte de Fortuna/i;

export function calculateCurrentAge(birthDateStr: string, referenceDate: Date): number {
  const birth = new Date(birthDateStr);
  let age = referenceDate.getFullYear() - birth.getFullYear();
  const m = referenceDate.getMonth() - birth.getMonth();
  const d = referenceDate.getDate() - birth.getDate();
  if (m < 0 || (m === 0 && d < 0)) {
    age--;
  }
  return age;
}

function planetsInSign(planets: PlanetPosition[], sign: string): ProfectionLordInfo[] {
  return planets
    .filter((p) => PROFECTION_PLANETS.has(p.name) && !POINTS.test(p.name) && p.sign === sign)
    .map((p) => ({
      name: p.name,
      source: "natal" as const,
      sign: p.sign,
      house: p.house,
      longitude: p.longitude,
    }));
}

export async function calculateProfectionLord(
  profile: CompleteAstrologicalProfile,
  referenceDate: Date = new Date(),
  options: { allowSolarReturnFetch?: boolean } = {}
): Promise<ProfectionData> {
  const birthData: BirthData = profile.birthData;
  const age = calculateCurrentAge(birthData.birthDate, referenceDate);
  const profectedHouse = ((age % 12) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

  const natalHouses = profile.tropical_natal?.houses || [];
  const natalPlanets = profile.tropical_natal?.planets || [];

  const house = natalHouses.find((h) => h.house === profectedHouse);
  if (!house) {
    throw new Error(`Casa profectada ${profectedHouse} não encontrada no mapa natal.`);
  }

  const sign = house.sign;

  // Condição 1: planetas no signo profectado no mapa natal
  let lords = planetsInSign(natalPlanets, sign);
  let source: ProfectionData["source"] = "natal";
  let solarReturn: TropicalNatal | undefined;
  let solarReturnYear: number | undefined;

  // Condição 2: se vazio, buscar Revolução Solar
  if (lords.length === 0 && options.allowSolarReturnFetch !== false) {
    const currentYear = referenceDate.getFullYear();
    const [, birthMonth, birthDay] = birthData.birthDate.split("-").map(Number);
    const birthdayThisYear = new Date(currentYear, birthMonth - 1, birthDay, 23, 59, 59);
    solarReturnYear = referenceDate <= birthdayThisYear ? currentYear - 1 : currentYear;
    try {
      solarReturn = await fetchSolarReturnChart(birthData, solarReturnYear, profile.tropical_natal);
      const rsPlanets = solarReturn?.planets || [];
      const rsLords = rsPlanets
        .filter((p) => PROFECTION_PLANETS.has(p.name) && !POINTS.test(p.name) && p.sign === sign)
        .map((p) => ({
          name: p.name,
          source: "solar-return" as const,
          sign: p.sign,
          house: p.house,
          longitude: p.longitude,
        }));
      if (rsLords.length > 0) {
        lords = rsLords;
        source = "solar-return";
      }
    } catch (err: any) {
      console.warn("[PROFECTION] Falha ao calcular Revolução Solar local:", err?.message || err);
      solarReturn = undefined;
    }
  }

  // Condição 3: regente tradicional do signo
  if (lords.length === 0) {
    const ruler = TRADITIONAL_RULERS[sign];
    if (ruler) {
      // posição do regente no natal, se disponível
      const natalRuler = natalPlanets.find((p) => p.name === ruler && PROFECTION_PLANETS.has(p.name));
      lords = [
        {
          name: ruler,
          source: "ruler" as const,
          sign: natalRuler?.sign,
          house: natalRuler?.house,
          longitude: natalRuler?.longitude,
        }
      ];
      source = "ruler";
    }
  }

  const primaryLord = lords[0]?.name || "Desconhecido";

  return {
    age,
    profectedHouse,
    sign,
    lords,
    primaryLord,
    source,
    solarReturn,
    solarReturnYear,
  };
}

const SIGNS_PT = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

function signOfDegree(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  return SIGNS_PT[Math.floor(normalized / 30)];
}

function degreeInSign(deg: number): number {
  const normalized = ((deg % 360) + 360) % 360;
  return Math.round((normalized % 30) * 100) / 100;
}

interface HouseLongitude {
  house: number;
  longitude: number;
}

function natalHousesWithLongitude(
  houses: { house: number; cuspDegree: number; sign: string }[]
): HouseLongitude[] {
  return houses
    .map((h) => ({
      house: h.house,
      longitude: (SIGNS_PT.indexOf(h.sign) * 30) + (h.cuspDegree ?? 0),
    }))
    .sort((a, b) => a.house - b.house);
}

function houseOfDegree(deg: number, houses: HouseLongitude[]): number {
  const normalized = ((deg % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const c1 = houses[i].longitude;
    const c2 = houses[(i + 1) % 12].longitude;
    const relative = (normalized - c1 + 360) % 360;
    const span = (c2 - c1 + 360) % 360;
    if (relative < span) {
      return houses[i].house;
    }
  }
  return 1;
}

export interface RapidActivation {
  type: "invasao" | "toque-no-regente" | "senhor-em-movimento";
  planet: string;
  description: string;
  target?: string;
  house?: number;
  sign?: string;
  aspect?: string;
  orb?: number;
}

const ASPECT_TARGETS = [
  { name: "Conjunção", angle: 0 },
  { name: "Trígono", angle: 120 },
  { name: "Quadratura", angle: 90 },
  { name: "Oposição", angle: 180 },
];

const RAPID_ORB = 2;

export async function calculateRapidActivations(
  profile: CompleteAstrologicalProfile,
  profection: ProfectionData,
  referenceDate: Date = new Date()
): Promise<RapidActivation[]> {
  const [fastPositions, allCurrentPositions] = await Promise.all([
    getFastTransitDegrees(referenceDate),
    getCurrentTransitDegrees(referenceDate),
  ]);
  const natalHouses = natalHousesWithLongitude(profile.tropical_natal?.houses || []);
  const activations: RapidActivation[] = [];
  const seen = new Set<string>();

  if (natalHouses.length !== 12) {
    return activations;
  }

  // ── Condição A: planeta rápido invadindo a Casa Profectada ──
  const profectedIndex = profection.profectedHouse - 1;
  const startCusp = natalHouses[profectedIndex].longitude;
  const endCusp = natalHouses[(profectedIndex + 1) % 12].longitude;
  const houseSpan = (endCusp - startCusp + 360) % 360;

  for (const [planet, deg] of Object.entries(fastPositions)) {
    const relative = (deg - startCusp + 360) % 360;
    if (relative < houseSpan) {
      const key = `invasao-${planet}`;
      if (seen.has(key)) continue;
      seen.add(key);
      activations.push({
        type: "invasao",
        planet,
        description: `${planet} está transitando pela Casa ${profection.profectedHouse}, o território profectado deste ano.`,
        house: profection.profectedHouse,
        sign: signOfDegree(deg),
      });
    }
  }

  // ── Condição B: planeta rápido em aspecto exato com o Regente do Ano ──
  const lordTargets: { name: string; longitude: number; origin: string }[] = [];
  for (const lord of profection.lords) {
    if (lord.longitude !== undefined) {
      const origin = lord.source === "natal" ? "no mapa natal" : "na Revolução Solar";
      lordTargets.push({ name: lord.name, longitude: lord.longitude, origin });
    } else if (lord.source === "ruler") {
      // Se o Senhor veio da regência tradicional, usamos sua posição atual como referência
      const currentDeg = allCurrentPositions[lord.name];
      if (currentDeg !== undefined) {
        lordTargets.push({ name: lord.name, longitude: currentDeg, origin: "no trânsito atual" });
      }
    }
  }

  for (const [planet, deg] of Object.entries(fastPositions)) {
    for (const lord of lordTargets) {
      const diff = Math.abs(deg - lord.longitude) % 360;
      const distance = diff > 180 ? 360 - diff : diff;
      for (const asp of ASPECT_TARGETS) {
        const orb = Math.abs(distance - asp.angle);
        if (orb <= RAPID_ORB) {
          const key = `toque-${planet}-${lord.name}-${asp.name}`;
          if (seen.has(key)) continue;
          seen.add(key);
          activations.push({
            type: "toque-no-regente",
            planet,
            target: `${lord.name} ${lord.origin}`,
            aspect: asp.name,
            orb: Math.round(orb * 100) / 100,
            sign: signOfDegree(deg),
            description: `${planet} forma ${asp.name} com ${lord.name} ${lord.origin} (orb ${orb.toFixed(1)}°).`,
          });
        }
      }
    }
  }

  // ── Condição C: o próprio Regente do Ano em movimento ──
  for (const lord of profection.lords) {
    const currentDeg = allCurrentPositions[lord.name];
    if (currentDeg === undefined) continue;
    const house = houseOfDegree(currentDeg, natalHouses);
    const key = `senhor-${lord.name}-${house}`;
    if (seen.has(key)) continue;
    seen.add(key);
    activations.push({
      type: "senhor-em-movimento",
      planet: lord.name,
      house,
      sign: signOfDegree(currentDeg),
      description: `${lord.name}, Regente do Ano, está transitando pela Casa ${house} do mapa natal.`,
    });
  }

  return activations;
}
