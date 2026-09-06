import { julian, moonposition, planetposition, solar } from "astronomia";
import * as planetDataRaw from "astronomia/data";
import * as circularHoroscopeRaw from "circular-natal-horoscope-js";

/** Structural equivalents of astrology.ts types, deliberately kept local to avoid cycles. */
export interface SolarReturnBirthData {
  birthDate: string;
  birthTime: string;
  birthPlace: {
    latitude: number;
    longitude: number;
    timezone: string;
    name?: string;
  };
}

export interface SolarReturnNatalInput {
  planets?: Array<{
    name: string;
    longitude?: number;
    sign?: string;
    degree?: number;
  }>;
}

export interface SolarReturnPlanetPosition {
  name: string;
  sign: string;
  degree: number;
  house: number;
  isRetrograde: boolean;
  ruler: string;
  longitude?: number;
}

export interface SolarReturnAspect {
  planet1: string;
  planet2: string;
  type: "Conjunção" | "Trígono" | "Quadratura" | "Oposição";
  orb: number;
}

export interface SolarReturnChart {
  planets: SolarReturnPlanetPosition[];
  houses: Array<{ house: number; cuspDegree: number; longitude?: number; sign: string; ruler: string }>;
  aspects: SolarReturnAspect[];
  /** Exact UTC instant of the return; optional so this remains assignable to TropicalNatal. */
  exactReturnInstant?: string;
}

export interface SolarReturnOptions {
  /** Major-aspect orb in degrees (natal-style default: 8°). */
  aspectOrb?: number;
  /** Override position calculation, principally useful for deterministic tests. */
  positionsAt?: (instant: Date) => Record<string, number>;
}

const SIGNS = ["Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem", "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"];
const RULERS: Record<string, string> = {
  "Áries": "Marte", "Touro": "Vênus", "Gêmeos": "Mercúrio", "Câncer": "Lua",
  "Leão": "Sol", "Virgem": "Mercúrio", "Libra": "Vênus", "Escorpião": "Plutão",
  "Sagitário": "Júpiter", "Capricórnio": "Saturno", "Aquário": "Urano", "Peixes": "Netuno",
};
const BODY_NAMES: Record<string, string> = {
  sun: "Sol", moon: "Lua", mercury: "Mercúrio", venus: "Vênus", mars: "Marte",
  jupiter: "Júpiter", saturn: "Saturno", uranus: "Urano", neptune: "Netuno", pluto: "Plutão",
};
const circularHoroscope = (circularHoroscopeRaw as any).default ?? circularHoroscopeRaw;
const { Origin, Horoscope } = circularHoroscope as any;

function resolveData(raw: any): any {
  const candidate = raw?.default ?? raw;
  if (candidate?.vsop87Dearth) return candidate;
  if (raw?.default?.default?.vsop87Dearth) return raw.default.default;
  return raw;
}
const planetData = resolveData(planetDataRaw);
const normalizeAngle = (n: number) => ((n % 360) + 360) % 360;
const wrappedDifference = (longitude: number, target: number) => {
  const d = normalizeAngle(longitude - target);
  return d > 180 ? d - 360 : d;
};
const toDegrees = (radians: number) => normalizeAngle(radians * 180 / Math.PI);
const round2 = (n: number) => Math.round(n * 100) / 100;

function jdeAt(date: Date): number {
  return julian.CalendarGregorianToJD(
    date.getUTCFullYear(), date.getUTCMonth() + 1,
    date.getUTCDate() + date.getUTCHours() / 24 + date.getUTCMinutes() / 1440 +
      date.getUTCSeconds() / 86400 + date.getUTCMilliseconds() / 86400000,
  );
}

function geocentricLongitude(planet: any, earth: any, jde: number): number {
  const e = earth.position2000(jde);
  const p = planet.position2000(jde);
  const ex = e.range * Math.cos(e.lat) * Math.cos(e.lon);
  const ey = e.range * Math.cos(e.lat) * Math.sin(e.lon);
  const px = p.range * Math.cos(p.lat) * Math.cos(p.lon);
  const py = p.range * Math.cos(p.lat) * Math.sin(p.lon);
  return normalizeAngle(Math.atan2(py - ey, px - ex) * 180 / Math.PI);
}

/** Tropical geocentric positions supplied by astronomia/VSOP87 (Pluto is added from Horoscope below). */
export function calculateLocalTropicalPositions(instant: Date): Record<string, number> {
  const jde = jdeAt(instant);
  const earth = new planetposition.Planet(planetData.vsop87Dearth);
  const result: Record<string, number> = {
    Sol: toDegrees(solar.apparentVSOP87(earth, jde).lon),
    Lua: toDegrees(moonposition.position(jde).lon),
  };
  const definitions: Array<[string, string]> = [
    ["Mercúrio", "vsop87Dmercury"], ["Vênus", "vsop87Dvenus"], ["Marte", "vsop87Dmars"],
    ["Júpiter", "vsop87Djupiter"], ["Saturno", "vsop87Dsaturn"], ["Urano", "vsop87Duranus"],
    ["Netuno", "vsop87Dneptune"],
  ];
  for (const [name, key] of definitions) {
    if (planetData[key]) result[name] = geocentricLongitude(new planetposition.Planet(planetData[key]), earth, jde);
  }
  return result;
}

function parseBirthInstant(data: SolarReturnBirthData): Date {
  const local = `${data.birthDate}T${data.birthTime}:00`;
  // Derive the IANA-zone offset without relying on the host machine's timezone.
  const guess = new Date(`${local}Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: data.birthPlace.timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(guess).reduce<Record<string, string>>((a, p) => { a[p.type] = p.value; return a; }, {});
  const represented = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return new Date(guess.getTime() - (represented - guess.getTime()));
}

function localParts(instant: Date, timezone: string) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(instant).reduce<Record<string, string>>((a, v) => { a[v.type] = v.value; return a; }, {});
  return { year: +p.year, month: +p.month - 1, date: +p.day, hour: +p.hour, minute: +p.minute };
}

function targetSun(data: SolarReturnBirthData, natal?: SolarReturnNatalInput): number {
  const supplied = natal?.planets?.find(p => p.name.toLocaleLowerCase("pt-BR") === "sol" || p.name.toLowerCase() === "sun");
  if (typeof supplied?.longitude === "number" && Number.isFinite(supplied.longitude)) return normalizeAngle(supplied.longitude);
  if (supplied?.sign && typeof supplied.degree === "number") {
    const index = SIGNS.findIndex(s => s.toLocaleLowerCase("pt-BR") === supplied.sign!.toLocaleLowerCase("pt-BR"));
    if (index >= 0) return normalizeAngle(index * 30 + supplied.degree);
  }
  return calculateLocalTropicalPositions(parseBirthInstant(data)).Sol;
}

/** Bracket then bisect the wrapped solar crossing; convergence is comfortably within one arcsecond. */
export function findExactSolarReturnInstant(data: SolarReturnBirthData, year: number, natal?: SolarReturnNatalInput): Date {
  const target = targetSun(data, natal);
  const [, month, day] = data.birthDate.split("-").map(Number);
  const center = Date.UTC(year, month - 1, day, 12);
  const step = 6 * 3600000;
  let left = center - 8 * 86400000;
  let fLeft = wrappedDifference(calculateLocalTropicalPositions(new Date(left)).Sol, target);
  let bracket: [number, number] | undefined;
  for (let right = left + step; right <= center + 8 * 86400000; right += step) {
    const fRight = wrappedDifference(calculateLocalTropicalPositions(new Date(right)).Sol, target);
    if (fLeft <= 0 && fRight >= 0 && Math.abs(fRight - fLeft) < 10) { bracket = [right - step, right]; break; }
    left = right; fLeft = fRight;
  }
  if (!bracket) throw new Error(`Não foi possível delimitar a Revolução Solar de ${year}.`);
  let [lo, hi] = bracket;
  for (let i = 0; i < 60 && hi - lo > 100; i++) {
    const mid = (lo + hi) / 2;
    const f = wrappedDifference(calculateLocalTropicalPositions(new Date(mid)).Sol, target);
    if (Math.abs(f) <= 1 / 3600) return new Date(mid);
    if (f < 0) lo = mid; else hi = mid;
  }
  return new Date((lo + hi) / 2);
}

function houseFor(longitude: number, houses: SolarReturnChart["houses"]): number {
  for (let i = 0; i < houses.length; i++) {
    const start = houses[i].longitude!;
    const span = normalizeAngle(houses[(i + 1) % houses.length].longitude! - start);
    if (normalizeAngle(longitude - start) < span) return houses[i].house;
  }
  return 1;
}

function aspectsFor(planets: SolarReturnPlanetPosition[], orb: number): SolarReturnAspect[] {
  const targets = [["Conjunção", 0], ["Trígono", 120], ["Quadratura", 90], ["Oposição", 180]] as const;
  const aspects: SolarReturnAspect[] = [];
  for (let i = 0; i < planets.length; i++) for (let j = i + 1; j < planets.length; j++) {
    const d0 = Math.abs(planets[i].longitude! - planets[j].longitude!);
    const distance = d0 > 180 ? 360 - d0 : d0;
    for (const [type, angle] of targets) {
      const difference = Math.abs(distance - angle);
      if (difference <= orb) aspects.push({ planet1: planets[i].name, planet2: planets[j].name, type, orb: round2(difference) });
    }
  }
  return aspects;
}

/** Calculate a wholly local tropical Solar Return at the natal coordinates. */
export function calculateSolarReturnChart(
  data: SolarReturnBirthData, year: number, natal?: SolarReturnNatalInput, options: SolarReturnOptions = {},
): SolarReturnChart {
  const instant = findExactSolarReturnInstant(data, year, natal);
  const lp = localParts(instant, data.birthPlace.timezone);
  const horoscope = new Horoscope({
    origin: new Origin({ ...lp, latitude: data.birthPlace.latitude, longitude: data.birthPlace.longitude }),
    houseSystem: "placidus", zodiac: "tropical", aspectPoints: [], aspectWithPoints: [], aspectTypes: [],
    customOrbs: {}, language: "en",
  });
  const houses: SolarReturnChart["houses"] = horoscope.Houses.map((h: any) => {
    const longitude = normalizeAngle(h.ChartPosition.StartPosition.Ecliptic.DecimalDegrees);
    const sign = SIGNS[Math.floor(longitude / 30)];
    return { house: h.id, cuspDegree: round2(longitude % 30), longitude, sign, ruler: RULERS[sign] };
  }).sort((a: any, b: any) => a.house - b.house);

  const positions = (options.positionsAt ?? calculateLocalTropicalPositions)(instant);
  // VSOP87 has no Pluto series; retain the library's locally-computed Pluto when available.
  const pluto = horoscope.CelestialBodies?.pluto?.ChartPosition?.Ecliptic?.DecimalDegrees;
  if (typeof pluto === "number") positions.Plutão = normalizeAngle(pluto);
  const planets = Object.entries(positions).map(([name, longitude]) => {
    const sign = SIGNS[Math.floor(normalizeAngle(longitude) / 30)];
    const bodyKey = Object.keys(BODY_NAMES).find(k => BODY_NAMES[k] === name);
    const body = bodyKey ? horoscope.CelestialBodies?.[bodyKey] : undefined;
    return {
      name, sign, degree: round2(normalizeAngle(longitude) % 30), house: houseFor(longitude, houses),
      isRetrograde: Boolean(body?.isRetrograde), ruler: RULERS[sign], longitude: normalizeAngle(longitude),
    };
  });
  return { planets, houses, aspects: aspectsFor(planets, options.aspectOrb ?? 8), exactReturnInstant: instant.toISOString() };
}

/** Alias matching the former API-oriented naming while remaining cycle-free. */
export const fetchLocalSolarReturnChart = calculateSolarReturnChart;
