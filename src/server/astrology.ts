import { calculateSolarReturnChart } from "./solarReturnEngine";
import { fetchAstrologyProviderResult, getBirthDetails, getNakshatraPada, getPlanetaryStates, getRasiChart, getVimsottariDasha, type AstrologyAPIResponse, type AstrologyProviderResult, type JHoraResponse } from "./astrologyProviders";
import * as circularHoroscopeRaw from 'circular-natal-horoscope-js';
import { createClient } from '@supabase/supabase-js';

const circularHoroscope = (circularHoroscopeRaw as any).default ?? circularHoroscopeRaw;
const { Origin, Horoscope } = circularHoroscope;

export type GenderPreference = "feminino" | "masculino" | "neutro" | "neutro_estrutural" | "neutro_direto";

export interface BirthData {
  name: string;
  gender: "masculino" | "feminino";
  gender_preference?: GenderPreference;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM
  birthPlace: {
    latitude: number;
    longitude: number;
    timezone: string;
    name?: string;
  };
  currentDate?: string; // YYYY-MM-DD
}

export interface PlanetPosition {
  name: string;
  sign: string;
  degree: number;
  house: number;
  isRetrograde: boolean;
  ruler: string;
  longitude?: number;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type: "Conjunção" | "Trígono" | "Quadratura" | "Oposição";
  orb: number;
}

export interface TropicalNatal {
  planets: PlanetPosition[];
  houses: { house: number; cuspDegree: number; longitude?: number; sign: string; ruler: string }[];
  aspects: Aspect[];
}

export interface TropicalTransit {
  planet: string;
  transitSign: string;
  transitDegree: number;
  transitHouse: number;       // casa natal por onde o planeta TRANSITA agora
  transitCoHouse?: number;    // co-casa: outra casa cuja cúspide abre no mesmo signo do trânsito
  casaNatal?: number;         // casa onde o planeta NATAL aspectado reside
  aspectToNatal: string; // e.g. "Quadratura com Sol Natal"
  planetaNatal?: string;
  ritmo_tempo?: string;
  casaDoRegenteNatal?: number;        // casa onde o regente do signo natal reside
  casaRegidaPeloTransitante?: number; // casa regida natalmente pelo planeta transitante
}

export interface VedicNatalPlanet {
  name: string;
  sign: string;
  house: number;
  degree: number;
  nakshatra: string;
  pada: number;
  dignity: "Exaltado" | "Moolatrikona" | "Amigo" | "Neutro" | "Inimigo" | "Debilitado";
  isRetrograde: boolean;
  isCombust: boolean;
  /** Exact sidereal longitude supplied by the provider. */
  longitude?: number;
}

export interface VedicNatal {
  planets: VedicNatalPlanet[];
  drishti: string[]; // Vedic Aspects
}

export interface VedicSpecifics {
  lagna: string;
  lagnaNakshatra: string;
  lagnesha: string; // Ruler of Ascendant
  suryaLagna: string;
  chandraLagna: string;
  janmaNakshatra: string;
  karakas: {
    atmakaraka: string;
    amatyakaraka: string;
    darakaraka: string;
  };
  dharmaTrikona: string; // Houses 1, 5, 9 status
  arudhaLag_na: string; // Arudha Lagna house/sign
  arudhaPadas: Record<string, string>;
  upapadaLag_na: string;
  dhanaYogas: string[];
  karmaYoga: string;
  dusthanas: { house: number; ruler: string; status: string }[];
  maranKarakaSthana: string[];
}

export interface VedicBalas {
  shadbala: Record<string, any>;
  ashtakavarga: Record<string, any>;
}

export interface VedicTiming {
  mahadasha: string;
  mahadashaNakshatra: string;
  mahadashaStart: string;
  mahadashaEnd: string;
  antardasha: string;
  antardashaNakshatra: string;
  antardashaStart: string;
  antardashaEnd: string;
  pratyantardasha: string;
  pratyantardashaNakshatra: string;
  pratyantardashaStart: string;
  pratyantardashaEnd: string;
  nextMahadasha: string;
  nextMahadashaStart: string;
  nextAntardasha: string;
  nextAntardashaStart: string;
  nextPratyantardasha: string;
  nextPratyantardashaStart: string;
  startDate: string;
  endDate: string;
}

export interface VedicVargas {
  /** Every exact divisional chart returned by JHora, keyed by provider chart name. */
  charts: Record<string, Record<string, string>>;
  d9Navamsa: Record<string, string>; // planet -> sign
  d10Dasamsa: Record<string, string>; // planet -> sign
}

export interface CompleteAstrologicalProfile {
  birthData: BirthData;
  tropical_natal: TropicalNatal;
  tropical_transits: TropicalTransit[];
  vedic_natal: VedicNatal;
  vedic_specifics: VedicSpecifics;
  vedic_balas: VedicBalas;
  vedic_timing: VedicTiming;
  vedic_vargas: VedicVargas;
  dataSource?: string;
}


export const signRulers: Record<string, string> = {
  "Áries": "Marte",
  "Touro": "Vênus",
  "Gêmeos": "Mercúrio",
  "Câncer": "Lua",
  "Leão": "Sol",
  "Virgem": "Mercúrio",
  "Libra": "Vênus",
  "Escorpião": "Plutão",
  "Sagitário": "Júpiter",
  "Capricórnio": "Saturno",
  "Aquário": "Urano",
  "Peixes": "Netuno"
};

// Traduções e utilitários de mapeamento
export function translatePlanetName(name: string): string {
  const translations: Record<string, string> = {
    "sun": "Sol", "moon": "Lua", "mercury": "Mercúrio", "venus": "Vênus",
    "mars": "Marte", "jupiter": "Júpiter", "saturn": "Saturno", "uranus": "Urano",
    "prajaapati": "Urano", "prajapati": "Urano", "harshala": "Urano",
    "neptune": "Netuno", "varuna": "Netuno", "pluto": "Plutão", "yama": "Plutão",
    "rahu": "Nodo Norte", "raagu": "Nodo Norte", "ketu": "Nodo Sul", "kethu": "Nodo Sul",
    "chiron": "Quíron", "lilith": "Lilith", "ascendant": "Ascendente", "lagna": "Ascendente"
  };
  const key = name.toLowerCase().trim();
  return translations[key] || name;
}

export function translateSignName(name: string): string {
  const translations: Record<string, string> = {
    "aries": "Áries", "taurus": "Touro", "gemini": "Gêmeos", "cancer": "Câncer",
    "leo": "Leão", "virgo": "Virgem", "libra": "Libra", "scorpio": "Escorpião",
    "sagittarius": "Sagitário", "capricorn": "Capricórnio", "aquarius": "Aquário", "pisces": "Peixes",
    // Sanskrit names
    "mesha": "Áries", "mesh": "Áries",
    "vrishabha": "Touro", "vrishabh": "Touro", "vrish": "Touro",
    "mithuna": "Gêmeos", "mithun": "Gêmeos",
    "karka": "Câncer", "karkata": "Câncer", "kark": "Câncer",
    "simha": "Leão",
    "kanya": "Virgem",
    "tula": "Libra",
    "vrishchika": "Escorpião",
    "dhanus": "Sagitário", "dhanu": "Sagitário",
    "makara": "Capricórnio",
    "kumbha": "Aquário", "kumbh": "Aquário",
    "meena": "Peixes", "meen": "Peixes"
  };
  const key = name.toLowerCase().replace(/[^a-z]/g, "").trim();
  return translations[key] || name;
}

function mapApiPlanetsToTropical(apiPlanets: any[]): PlanetPosition[] {
  return apiPlanets.map((p) => {
    const rawName = p.name || p.planet || p.id || "";
    const name = translatePlanetName(rawName);
    const rawSign = p.sign || p.sign_name || p.zodiac_sign || "";
    const sign = translateSignName(rawSign);
    const degree = typeof p.degree === "number" ? p.degree : 0;
    const house = typeof p.house === "number" ? p.house : 1;
    const isRetrograde = !!(p.isRetrograde || p.retrograde || p.retro);

    return {
      name,
      sign,
      degree: Math.round(degree * 100) / 100,
      house,
      isRetrograde,
      ruler: signRulers[sign] || "Sol"
    };
  });
}

function mapApiHouses(apiHouses: any[]): { house: number; cuspDegree: number; sign: string; ruler: string }[] {
  return apiHouses.map((h, index) => {
    const houseNum = h.house || h.id || (index + 1);
    const rawSign = h.sign || h.sign_name || h.zodiac_sign || "";
    const sign = translateSignName(rawSign);
    const cuspDegree = typeof h.degree === "number" ? h.degree : typeof h.cusp === "number" ? h.cusp : 0;

    return {
      house: houseNum,
      cuspDegree: Math.round(cuspDegree * 100) / 100,
      sign,
      ruler: signRulers[sign] || "Sol"
    };
  });
}

function mapApiAspects(apiAspects: any[]): Aspect[] {
  if (!apiAspects || !Array.isArray(apiAspects)) return [];
  return apiAspects.map((a) => {
    return {
      planet1: translatePlanetName(a.planet1 || a.p1 || ""),
      planet2: translatePlanetName(a.planet2 || a.p2 || ""),
      type: a.type || a.aspect_type || "Conjunção",
      orb: typeof a.orb === "number" ? a.orb : 0
    };
  });
}

export async function fetchSolarReturnChart(birthData: BirthData, year: number, natal?: TropicalNatal): Promise<TropicalNatal> {
  console.log(`[AQUAR.IA Backend] Calculando Revolução Solar local para ${year}...`);
  return calculateSolarReturnChart(birthData, year, natal) as TropicalNatal;
}

const SIGNS_PT = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

function getSignAndDegree(longitude: number): { sign: string; degree: number } {
  const normalized = (longitude % 360 + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degree = normalized % 30;
  return {
    sign: SIGNS_PT[signIndex],
    degree: Math.round(degree * 100) / 100
  };
}

function assignHouseFromLong(longitude: number, houses: { house: number; longitude: number }[]): number {
  for (let i = 0; i < 12; i++) {
    const cusp1 = houses[i].longitude;
    const cusp2 = houses[(i + 1) % 12].longitude;
    const relative = (longitude - cusp1 + 360) % 360;
    const cuspRel = (cusp2 - cusp1 + 360) % 360;
    if (relative < cuspRel) {
      return houses[i].house;
    }
  }
  return 1;
}

function createTropicalPoint(
  name: string,
  longitude: number,
  houses: { house: number; longitude: number }[],
  knownHouse?: number,
  isRetrograde = false
): PlanetPosition {
  const { sign, degree } = getSignAndDegree(longitude);
  const house = knownHouse ?? assignHouseFromLong(longitude, houses);
  return {
    name,
    sign,
    degree,
    house,
    isRetrograde,
    ruler: signRulers[sign] || "Sol",
    longitude
  };
}

function calculatePartOfFortune(ascLong: number, sunLong: number, moonLong: number, isDay: boolean): number {
  const raw = isDay ? (ascLong + moonLong - sunLong) : (ascLong + sunLong - moonLong);
  return (raw % 360 + 360) % 360;
}

const TRANSPERSONAL_PLANETS = new Set(["Urano", "Netuno", "Plutão"]);
const SOCIAL_PLANETS = new Set(["Júpiter", "Saturno"]);
const PASSIVE_POINTS = new Set(["Ascendente", "Meio do Céu", "Quíron", "Nodo Norte", "Nodo Sul"]);

function getAspectOrb(p1Name: string, p2Name: string): number {
  const p1IsPoint = PASSIVE_POINTS.has(p1Name);
  const p2IsPoint = PASSIVE_POINTS.has(p2Name);
  // Quíron, Nodos, Ascendente e MC: orbe de 3° quando recebem aspectos
  if (p1IsPoint || p2IsPoint) return 3;

  const p1IsTrans = TRANSPERSONAL_PLANETS.has(p1Name);
  const p2IsTrans = TRANSPERSONAL_PLANETS.has(p2Name);
  if (p1IsTrans && p2IsTrans) return 3;
  if ((p1IsTrans && SOCIAL_PLANETS.has(p2Name)) || (p2IsTrans && SOCIAL_PLANETS.has(p1Name))) return 5;

  return 8;
}

function calculateAspects(planets: { name: string; longitude: number }[]): Aspect[] {
  const aspects: Aspect[] = [];
  const definitions = [
    { name: "Conjunção", angle: 0 },
    { name: "Oposição", angle: 180 },
    { name: "Trígono", angle: 120 },
    { name: "Quadratura", angle: 90 }
  ];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];

      // Pontos passivos (Quíron, Nodos, ASC, MC) só recebem aspectos — não emitem
      if (PASSIVE_POINTS.has(p1.name)) continue;

      const orb = getAspectOrb(p1.name, p2.name);
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const def of definitions) {
        const dev = Math.abs(diff - def.angle);
        if (dev <= orb) {
          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            type: def.name as any,
            orb: Math.round(dev * 100) / 100
          });
        }
      }
    }
  }
  return aspects;
}

const EMPTY_TIMING: VedicTiming = {
  mahadasha: "", mahadashaNakshatra: "", mahadashaStart: "", mahadashaEnd: "",
  antardasha: "", antardashaNakshatra: "", antardashaStart: "", antardashaEnd: "",
  pratyantardasha: "", pratyantardashaNakshatra: "", pratyantardashaStart: "", pratyantardashaEnd: "",
  nextMahadasha: "", nextMahadashaStart: "", nextAntardasha: "", nextAntardashaStart: "",
  nextPratyantardasha: "", nextPratyantardashaStart: "", startDate: "", endDate: "",
};

function record(value: unknown): Record<string, any> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : undefined;
}

function deepSection(root: unknown, names: string[]): any {
  const wanted = new Set(names.map(n => n.toLowerCase().replace(/[^a-z0-9]/g, "")));
  const queue: unknown[] = [root];
  const seen = new Set<unknown>();
  while (queue.length) {
    const value = queue.shift();
    if (!value || typeof value !== "object" || seen.has(value)) continue;
    seen.add(value);
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (wanted.has(key.toLowerCase().replace(/[^a-z0-9]/g, ""))) return child;
      if (child && typeof child === "object") queue.push(child);
    }
  }
  return undefined;
}

function numeric(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function booleanValue(value: unknown): boolean {
  return value === true || value === 1 || (typeof value === "string" && /^(true|yes|retrograde|r)$/i.test(value));
}

function providerAyanamsha(jhora: JHoraResponse): number {
  const birth = getBirthDetails(jhora);
  const horoscope = record(jhora.horoscope);
  const exact = numeric(horoscope?.ayanamsa_value ?? birth?.ayanamsha ?? birth?.ayanamsa ?? deepSection(jhora, ["ayanamsha", "ayanamsa"]));
  if (exact !== undefined) return exact;
  const year = Number(String(birth?.date || "").slice(0, 4)) || 2000;
  return 23.853056 + (year - 2000) * 0.0139697;
}

function chartEntries(raw: unknown): Array<[string, Record<string, any>]> {
  const obj = record(raw);
  return obj ? Object.entries(obj).filter(([, v]) => !!record(v)).map(([k, v]) => [k, v as Record<string, any>]) : [];
}

function exactNakshatra(section: Record<string, Record<string, unknown>> | undefined, providerName: string) {
  const aliases = [providerName, translatePlanetName(providerName)];
  const entry = Object.entries(section || {}).find(([k]) => aliases.some(a => k.toLowerCase() === a.toLowerCase()))?.[1];
  return {
    name: String(entry?.nakshatra ?? entry?.name ?? entry?.nakshatra_name ?? ""),
    pada: numeric(entry?.pada ?? entry?.quarter) ?? 0,
  };
}

function stateFor(states: Record<string, unknown> | undefined, providerName: string): Record<string, any> {
  if (!states) return {};
  const normalized = providerName.toLowerCase();
  const inList = (key: string) => Array.isArray(states[key]) && (states[key] as unknown[]).some((name) => String(name).toLowerCase() === normalized);
  return {
    is_retrograde: inList("retrograde_planets"),
    is_combust: inList("combusted_planets"),
    dignity: inList("exalted_planets") ? "exalted" : inList("debilitated_planets") ? "debilitated" : inList("own_sign_planets") ? "moolatrikona" : inList("friend_sign_planets") ? "friend" : inList("enemy_sign_planets") ? "enemy" : "neutral",
  };
}

function mapCharaKarakas(raw: Record<string, any>): VedicSpecifics["karakas"] {
  const planet = (key: string) => translatePlanetName(String(record(raw[key])?.planet || ""));
  return {
    atmakaraka: planet("atma_karaka"),
    amatyakaraka: planet("amatya_karaka"),
    darakaraka: planet("data_karaka") || planet("dara_karaka"),
  };
}

function mapJHoraVedic(jhora: JHoraResponse) {
  const rasi = getRasiChart(jhora) || {};
  const nakshatras = getNakshatraPada(jhora);
  const states = getPlanetaryStates(jhora);
  const asc = Object.entries(rasi).find(([name]) => /asc|lagna/i.test(name));
  if (!asc || numeric(asc[1].longitude) === undefined) throw new Error("JHora D1 sem Ascendente exato");
  const absoluteLongitude = (entry: Record<string, any>) => {
    const degree = numeric(entry.longitude);
    const sign = translateSignName(String(entry.sign || entry.rasi || entry.zodiac || ""));
    const signIndex = SIGNS_PT.indexOf(sign);
    if (degree === undefined || signIndex < 0) throw new Error(`JHora D1 com posição inválida em ${sign || "signo desconhecido"}`);
    return signIndex * 30 + degree;
  };
  const ascLongitude = absoluteLongitude(asc[1]);
  const planets: VedicNatalPlanet[] = Object.entries(rasi)
    .filter(([name]) => !/asc|lagna/i.test(name))
    .map(([providerName, entry]) => {
      const longitude = absoluteLongitude(entry);
      if (!Number.isFinite(longitude)) throw new Error(`JHora D1 sem longitude para ${providerName}`);
      const state = stateFor(states, providerName);
      const nak = exactNakshatra(nakshatras, providerName);
      const sign = translateSignName(String(entry.sign || entry.rasi || entry.zodiac || getSignAndDegree(longitude).sign));
      const rawDignity = String(state.dignity ?? state.status ?? entry.dignity ?? "Neutro");
      const dignityMap: Record<string, VedicNatalPlanet["dignity"]> = { exalted: "Exaltado", exaltado: "Exaltado", moolatrikona: "Moolatrikona", friend: "Amigo", amigo: "Amigo", enemy: "Inimigo", inimigo: "Inimigo", debilitated: "Debilitado", debilitado: "Debilitado", neutral: "Neutro", neutro: "Neutro" };
      return {
        name: translatePlanetName(providerName), sign,
        house: (Math.floor(longitude / 30) - Math.floor(ascLongitude / 30) + 12) % 12 + 1,
        degree: numeric(entry.degree) ?? longitude % 30,
        nakshatra: nak.name, pada: nak.pada,
        dignity: dignityMap[rawDignity.toLowerCase()] || "Neutro",
        isRetrograde: booleanValue(state.retrograde ?? state.is_retrograde ?? entry.retrograde),
        isCombust: booleanValue(state.combust ?? state.is_combust ?? entry.combust),
        longitude,
      };
    });
  return { planets, ascLongitude, ascNakshatra: exactNakshatra(nakshatras, asc[0]).name };
}

function mapAstrologyAPIVedic(api: AstrologyAPIResponse) {
  const asc = api.planets.find(p => /asc/i.test(p.name));
  const ascLongitude = numeric(asc?.fullDegree) ?? 0;
  const planets: VedicNatalPlanet[] = api.planets.filter(p => !/asc/i.test(p.name)).map(p => ({
    name: translatePlanetName(p.name), sign: translateSignName(p.sign), house: p.house || 0,
    degree: numeric(p.normDegree) ?? 0, nakshatra: p.nakshatra || "", pada: numeric(p.nakshatra_pad) ?? 0,
    dignity: "Neutro", isRetrograde: booleanValue(p.isRetro), isCombust: false,
    longitude: numeric(p.fullDegree),
  }));
  return { planets, ascLongitude, ascNakshatra: "" };
}

function localTropicalChart(birthData: BirthData, siderealLongitude: number, ayanamsha: number, vedicPlanets: VedicNatalPlanet[]): TropicalNatal {
  const tropicalByName = new Map(vedicPlanets.map(p => [p.name, (p.longitude ?? (p.sign ? SIGNS_PT.indexOf(p.sign) * 30 + p.degree : 0)) + ayanamsha]));
  const [year, month, date] = birthData.birthDate.split("-").map(Number);
  const [hour, minute] = birthData.birthTime.split(":").map(Number);
  const horoscope = new Horoscope({ origin: new Origin({ year, month: month - 1, date, hour, minute, latitude: birthData.birthPlace.latitude, longitude: birthData.birthPlace.longitude }), houseSystem: "placidus", zodiac: "tropical", aspectPoints: ["bodies", "points", "angles"], aspectWithPoints: ["bodies", "points", "angles"], aspectTypes: ["major", "minor"], customOrbs: {}, language: "en" });
  const houses = horoscope.Houses.map((h: any) => {
    const longitude = ((h.ChartPosition.StartPosition.Ecliptic.DecimalDegrees % 360) + 360) % 360;
    const { sign, degree } = getSignAndDegree(longitude);
    return { house: h.id, cuspDegree: degree, longitude, sign, ruler: signRulers[sign] || "Sol" };
  }).sort((a: any, b: any) => a.house - b.house);
  const houseFor = (longitude: number) => houses.find((h: any, i: number) => ((longitude - h.longitude + 360) % 360) < ((houses[(i + 1) % 12].longitude - h.longitude + 360) % 360))?.house || 1;
  const planets: PlanetPosition[] = [...tropicalByName.entries()].map(([name, raw]) => {
    const longitude = ((raw % 360) + 360) % 360; const { sign, degree } = getSignAndDegree(longitude);
    return { name, sign, degree, house: houseFor(longitude), isRetrograde: vedicPlanets.find(p => p.name === name)?.isRetrograde || false, ruler: signRulers[sign] || "Sol", longitude };
  });
  const bodies: Record<string, string> = { chiron: "Quíron", lilith: "Lilith" };
  for (const [key, name] of Object.entries(bodies)) {
    const body = key === "lilith" ? horoscope._celestialPoints?.lilith : horoscope.CelestialBodies?.[key];
    const longitude = numeric(body?.ChartPosition?.Ecliptic?.DecimalDegrees);
    if (longitude !== undefined && !planets.some(p => p.name === name)) planets.push(createTropicalPoint(name, longitude, houses, body?.House?.id, !!body?.isRetrograde));
  }
  const ascTropical = (siderealLongitude + ayanamsha + 360) % 360;
  const sun = planets.find(p => p.name === "Sol"), moon = planets.find(p => p.name === "Lua");
  if (sun && moon) planets.push(createTropicalPoint("Roda da Fortuna", calculatePartOfFortune(ascTropical, sun.longitude!, moon.longitude!, sun.house > 6), houses));
  const aspectPoints = planets.filter(p => p.name !== "Lilith" && p.name !== "Roda da Fortuna").map(p => ({ name: p.name, longitude: p.longitude! }));
  aspectPoints.push({ name: "Ascendente", longitude: houses[0].longitude! }, { name: "Meio do Céu", longitude: houses[9].longitude! });
  return { planets, houses, aspects: calculateAspects(aspectPoints) };
}

function mapVargas(jhora?: JHoraResponse): VedicVargas {
  const chartsRoot = record(deepSection(jhora, ["divisional_charts", "divisionalcharts"])) || {};
  const charts: Record<string, Record<string, string>> = {};
  for (const [chartName, rawChart] of chartEntries(chartsRoot)) {
    charts[chartName] = Object.fromEntries(chartEntries(rawChart).map(([planet, value]) => [translatePlanetName(planet), translateSignName(String(value.sign ?? value.rasi ?? value.zodiac ?? ""))]));
  }
  const find = (n: number) => Object.entries(charts).find(([key]) => new RegExp(`^D-?${n}(?:_|$)`, "i").test(key))?.[1] || {};
  return { charts, d9Navamsa: find(9), d10Dasamsa: find(10) };
}

function providerDateTimestamp(value: string): number {
  const isoLike = new Date(value.replace(" ", "T") + (value.includes("Z") ? "" : "Z")).getTime();
  if (Number.isFinite(isoLike)) return isoLike;
  const match = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/);
  return match ? Date.UTC(+match[3], +match[2] - 1, +match[1], +(match[4] || 0), +(match[5] || 0)) : NaN;
}

function mapTiming(result: AstrologyProviderResult, currentDateStr: string): VedicTiming {
  const periods = result.jhora ? getVimsottariDasha(result.jhora) || [] : result.astrologyapi?.majorDasha || [];
  if (!periods.length) return { ...EMPTY_TIMING };
  const target = new Date(`${currentDateStr}T12:00:00Z`).getTime();
  const normalized = periods.map((period: any) => {
    const label = String(Array.isArray(period) ? period[0] : period.planet || period.name || "");
    const names = label.split("-").map((name) => translatePlanetName(name));
    return { names, start: String(Array.isArray(period) ? period[1] : period.start || ""), end: String(Array.isArray(period) ? "" : period.end || "") };
  }).filter((period) => Number.isFinite(providerDateTimestamp(period.start)));
  const timestamps = normalized.map((period) => providerDateTimestamp(period.start));
  let index = 0;
  for (let i = 0; i < timestamps.length; i++) {
    if (timestamps[i] <= target) index = i;
    else break;
  }
  const current = normalized[index];
  const next = normalized[index + 1];
  const end = current.end || next?.start || "";
  return {
    ...EMPTY_TIMING,
    mahadasha: current.names[0] || "", antardasha: current.names[1] || "", pratyantardasha: current.names[2] || "",
    mahadashaStart: current.start, antardashaStart: current.start, pratyantardashaStart: current.start,
    mahadashaEnd: end, antardashaEnd: end, pratyantardashaEnd: end,
    nextMahadasha: next?.names[0] || "", nextAntardasha: next?.names[1] || "", nextPratyantardasha: next?.names[2] || "",
    nextMahadashaStart: next?.start || "", nextAntardashaStart: next?.start || "", nextPratyantardashaStart: next?.start || "",
    startDate: normalized[0]?.start || "", endDate: normalized.at(-1)?.end || normalized.at(-1)?.start || "",
  };
}

export async function fetchAstrologicalData(birthData: BirthData, currentDateStr: string, userId?: string, token?: string): Promise<CompleteAstrologicalProfile> {
  const clean = (v: unknown) => typeof v === "string" && v.trim() && !/^(null|undefined)$/.test(v.trim()) ? v.trim() : undefined;
  const url = clean(process.env.SUPABASE_URL) || clean(process.env.VITE_SUPABASE_URL) || clean((import.meta as any).env?.VITE_SUPABASE_URL);
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const supabase = url && key ? createClient(url, key) : null;
  if (userId && !supabase) throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias para o cache astrológico.");
  let cached: any;
  if (supabase && userId) {
    const { data, error } = await supabase.from("user_chart").select("raw_data, astrology_provider, astrology_cache_completeness, astrology_schema_version, astrology_cached_at, jhora_retry_after, birth_date, birth_time, latitude, longitude").eq("user_id", userId).maybeSingle();
    if (error) throw new Error(`[ASTROLOGY CACHE] Falha ao consultar cache: ${error.message}`);
    cached = data;
  }
  const cacheMatchesBirth = cached?.astrology_schema_version === 1 && cached?.birth_date === birthData.birthDate && cached?.birth_time === birthData.birthTime && Math.abs(Number(cached?.latitude) - birthData.birthPlace.latitude) < 1e-7 && Math.abs(Number(cached?.longitude) - birthData.birthPlace.longitude) < 1e-7;
  const cachedRaw = cacheMatchesBirth ? record(cached?.raw_data) : undefined;
  const cachedResult: AstrologyProviderResult | undefined = cachedRaw && (cached?.astrology_provider === "jhora" || cached?.astrology_provider === "astrologyapi") ? {
    ...(cached.astrology_provider === "jhora" ? { jhora: cachedRaw as JHoraResponse } : { astrologyapi: cachedRaw as unknown as AstrologyAPIResponse }),
    meta: { source: cached.astrology_provider, status: cached.astrology_cache_completeness || (cached.astrology_provider === "jhora" ? "full" : "partial"), attempted: [], errors: [] },
  } as AstrologyProviderResult : undefined;
  const isFull = cached?.astrology_cache_completeness === "full" && cached?.astrology_provider === "jhora";
  const retryAt = cached?.jhora_retry_after ? new Date(cached.jhora_retry_after).getTime() : 0;
  let result: AstrologyProviderResult;
  let fromCache = false;
  if (cachedResult && (isFull || (cached?.astrology_cache_completeness === "partial" && Date.now() < retryAt))) {
    result = cachedResult; fromCache = true;
  } else {
    result = await fetchAstrologyProviderResult({ name: birthData.name, date: birthData.birthDate, time: birthData.birthTime, latitude: birthData.birthPlace.latitude, longitude: birthData.birthPlace.longitude, timezone: birthData.birthPlace.timezone, place: birthData.birthPlace.name || "unknown" });
    if (supabase && userId) {
      const configuredRetryMinutes = Number(process.env.JHORA_RETRY_AFTER_MINUTES ?? 15);
      const retryMinutes = Number.isFinite(configuredRetryMinutes) && configuredRetryMinutes > 0 ? configuredRetryMinutes : 15;
      const partialRetry = result.meta.status === "partial" ? new Date(Date.now() + retryMinutes * 60 * 1000).toISOString() : null;
      const { error } = await supabase.from("user_chart").upsert({ user_id: userId, birth_date: birthData.birthDate, birth_time: birthData.birthTime, latitude: birthData.birthPlace.latitude, longitude: birthData.birthPlace.longitude, raw_data: result.jhora ?? result.astrologyapi, astrology_provider: result.meta.source, astrology_cache_completeness: result.meta.status, astrology_schema_version: 1, astrology_cached_at: new Date().toISOString(), jhora_retry_after: partialRetry, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw new Error(`[ASTROLOGY CACHE] Falha ao salvar resultado do provedor: ${error.message}`);
    }
  }
  const mapped = result.jhora ? mapJHoraVedic(result.jhora) : mapAstrologyAPIVedic(result.astrologyapi!);
  const ayanamsha = result.jhora ? providerAyanamsha(result.jhora) : providerAyanamsha({ birth_details: { date: birthData.birthDate } });
  const tropical = localTropicalChart(birthData, mapped.ascLongitude, ayanamsha, mapped.planets);
  const lagna = getSignAndDegree(mapped.ascLongitude).sign;
  const horoscope = result.jhora ? record(result.jhora.horoscope) || {} : {};
  const specificsRaw = record(deepSection(horoscope, ["vedic_specifics", "special_lagnas", "lagnas"])) || {};
  const charaKarakas = record(horoscope.chara_karakas) || {};
  const arudhaPadhas = record(horoscope.arudha_padhas) || {};
  const arudhaEntry = (label: string) => String(Object.entries(arudhaPadhas).find(([key]) => key.startsWith("D-1-") && key.includes(label))?.[1] || "");
  const yogaList = record(record(horoscope.yogas)?.yoga_list) || {};
  const yogaText = (value: unknown) => Array.isArray(value) ? `${value[1] || "Yoga"}: ${value[3] || value[2] || ""}` : String(value || "");
  const dhanaYogas = Object.entries(yogaList).filter(([key, value]) => /dhana|wealth|prosper/i.test(`${key} ${yogaText(value)}`)).map(([, value]) => yogaText(value));
  const karmaYoga = Object.entries(yogaList).find(([key]) => /karma/i.test(key));
  const specifics: VedicSpecifics = {
    lagna, lagnaNakshatra: mapped.ascNakshatra, lagnesha: signRulers[lagna] || "", suryaLagna: mapped.planets.find(p => p.name === "Sol")?.sign || "", chandraLagna: mapped.planets.find(p => p.name === "Lua")?.sign || "", janmaNakshatra: mapped.planets.find(p => p.name === "Lua")?.nakshatra || "",
    karakas: mapCharaKarakas(charaKarakas), dharmaTrikona: "", arudhaLag_na: arudhaEntry("Arudha Lagna"), arudhaPadas: Object.fromEntries(Object.entries(arudhaPadhas).filter(([key]) => key.startsWith("D-1-")).map(([key, value]) => [key, String(value)])), upapadaLag_na: arudhaEntry("Upapada Lagna"), dhanaYogas, karmaYoga: karmaYoga ? yogaText(karmaYoga[1]) : "", dusthanas: [], maranKarakaSthana: [],
  };
  const shadRaw = horoscope.shad_bala;
  const shad = record(shadRaw) || {};
  if (Array.isArray(shadRaw)) {
    shad.components = shadRaw;
    const totalValues = record(shadRaw[6])?.value;
    if (Array.isArray(totalValues)) {
      ["Sol", "Lua", "Marte", "Mercúrio", "Júpiter", "Vênus", "Saturno"].forEach((planet, index) => {
        if (typeof totalValues[index] === "number") shad[planet] = totalValues[index];
      });
    }
  }
  const ashta = record(horoscope.ashtakavarga) || {};
  return { birthData, tropical_natal: tropical, tropical_transits: [], vedic_natal: { planets: mapped.planets, drishti: [] }, vedic_specifics: specifics, vedic_balas: { shadbala: shad, ashtakavarga: ashta }, vedic_timing: mapTiming(result, currentDateStr), vedic_vargas: mapVargas(result.jhora), dataSource: `${fromCache ? "cache:" : ""}${result.meta.source}:${result.meta.status}` };
}

export function calculateHighlights(profile: CompleteAstrologicalProfile): string[] {
  const scores: Record<string, number> = {};

  // 1. Elements
  const fireSigns = ["Áries", "Leão", "Sagitário"];
  const earthSigns = ["Touro", "Virgem", "Capricórnio"];
  const waterSigns = ["Câncer", "Escorpião", "Peixes"];
  const airSigns = ["Gêmeos", "Libra", "Aquário"];

  let fireScore = 0;
  let earthScore = 0;
  let waterScore = 0;
  let airScore = 0;

  profile.tropical_natal.planets.forEach((p) => {
    if (fireSigns.includes(p.sign)) fireScore += 10;
    if (earthSigns.includes(p.sign)) earthScore += 10;
    if (waterSigns.includes(p.sign)) waterScore += 10;
    if (airSigns.includes(p.sign)) airScore += 10;
  });

  scores["petal-fire"] = fireScore;
  scores["petal-earth"] = earthScore;
  scores["petal-water"] = waterScore;
  scores["petal-air"] = airScore;

  // 2. Qualities
  const cardealSigns = ["Áries", "Câncer", "Libra", "Capricórnio"];
  const fixoSigns = ["Touro", "Leão", "Escorpião", "Aquário"];
  const mutavelSigns = ["Gêmeos", "Virgem", "Sagitário", "Peixes"];

  let cardealScore = 0;
  let fixoScore = 0;
  let mutavelScore = 0;

  profile.tropical_natal.planets.forEach((p) => {
    if (cardealSigns.includes(p.sign)) cardealScore += 10;
    if (fixoSigns.includes(p.sign)) fixoScore += 10;
    if (mutavelSigns.includes(p.sign)) mutavelScore += 10;
  });

  scores["petala-cardeal"] = cardealScore;
  scores["petala-fixo"] = fixoScore;
  scores["petala-mutavel"] = mutavelScore;

  // 3. Houses & Axes
  const ashtakavargaTotals = profile.vedic_balas.ashtakavarga.samudhaya_ashtaka_varga;
  for (let h = 1; h <= 12; h++) {
    const planetsInHouse = profile.tropical_natal.planets.filter((p) => p.house === h).length;
    const ashtakavargaVal = Array.isArray(ashtakavargaTotals) && typeof ashtakavargaTotals[h - 1] === "number" ? ashtakavargaTotals[h - 1] : 0;
    scores[`casa-${h}`] = planetsInHouse * 15 + ashtakavargaVal;
  }

  // Axes scores based on corresponding houses (1, 4, 7, 10)
  scores["eixo-asc"] = (scores["casa-1"] || 0) + 10;
  scores["eixo-ic"] = (scores["casa-4"] || 0) + 10;
  scores["eixo-dsc"] = (scores["casa-7"] || 0) + 10;
  scores["eixo-mc"] = (scores["casa-10"] || 0) + 10;

  // 4. Paths
  const saturnPlacements = profile.tropical_natal.planets.filter(p => p.name === "Saturno" || p.name.includes("Nodo"));
  scores["caminho-assimilacao"] = saturnPlacements.length * 15 + (scores["casa-1"] || 0) * 0.5 + (scores["casa-5"] || 0) * 0.5 + (scores["casa-9"] || 0) * 0.5;

  const transformPlanets = profile.tropical_natal.planets.filter(p => p.name === "Plutão" || p.name === "Quíron" || p.name === "Lilith");
  scores["caminho-transformacao"] = transformPlanets.length * 15 + (scores["casa-8"] || 0) * 0.8 + (scores["casa-12"] || 0) * 0.8;

  const manifestPlanets = profile.tropical_natal.planets.filter(p => p.name === "Vênus" || p.name === "Júpiter");
  scores["caminho-manifestacao"] = manifestPlanets.length * 15 + (scores["casa-2"] || 0) * 0.8 + (scores["casa-11"] || 0) * 0.8;

  // 5. Moon Phases
  const sunPos = profile.tropical_natal.planets.find(p => p.name === "Sol");
  const moonPos = profile.tropical_natal.planets.find(p => p.name === "Lua");
  const signNames = [
    "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
    "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
  ];
  if (sunPos && moonPos) {
    const sunLong = signNames.indexOf(sunPos.sign) * 30 + sunPos.degree;
    const moonLong = signNames.indexOf(moonPos.sign) * 30 + moonPos.degree;
    let diff = moonLong - sunLong;
    if (diff < 0) diff += 360;
    
    if (diff >= 0 && diff < 90) scores["lua-nova"] = 45;
    else if (diff >= 90 && diff < 180) scores["lua-crescente"] = 45;
    else if (diff >= 180 && diff < 270) scores["lua-cheia"] = 45;
    else scores["lua-minguante"] = 45;
  }

  const sortedKeys = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map((entry) => entry[0]);

  return sortedKeys.slice(0, 3);
}

export interface VisualStateHouseItem {
  id: number;
  state: 'tropical-active' | 'vedic-active' | 'intersect-active' | 'inactive';
  element: 'fire' | 'earth' | 'air' | 'water';
  sign: string;
  elementClass: string;
  stateClass: string;
}

export interface VisualState {
  houses: VisualStateHouseItem[];
  petals: string[];
}

export function calculateVisualState(profile: CompleteAstrologicalProfile): VisualState {
  const fireSigns = ["Áries", "Leão", "Sagitário"];
  const earthSigns = ["Touro", "Virgem", "Capricórnio"];
  const airSigns = ["Gêmeos", "Libra", "Aquário"];
  const waterSigns = ["Câncer", "Escorpião", "Peixes"];

  const cardinalSigns = ["Áries", "Câncer", "Libra", "Capricórnio"];
  const fixoSigns = ["Touro", "Leão", "Escorpião", "Aquário"];
  const mutavelSigns = ["Gêmeos", "Virgem", "Sagitário", "Peixes"];

  let fire = 0;
  let earth = 0;
  let air = 0;
  let water = 0;

  let cardinal = 0;
  let fixo = 0;
  let mutavel = 0;

  profile.tropical_natal.planets.forEach(p => {
    const sign = p.sign;
    if (fireSigns.includes(sign)) fire++;
    if (earthSigns.includes(sign)) earth++;
    if (airSigns.includes(sign)) air++;
    if (waterSigns.includes(sign)) water++;

    if (cardinalSigns.includes(sign)) cardinal++;
    if (fixoSigns.includes(sign)) fixo++;
    if (mutavelSigns.includes(sign)) mutavel++;
  });

  const maxElementScore = Math.max(fire, earth, air, water);
  const elementIds: string[] = [];
  if (fire === maxElementScore && maxElementScore > 0) elementIds.push("petal-fire");
  if (earth === maxElementScore && maxElementScore > 0) elementIds.push("petal-earth");
  if (water === maxElementScore && maxElementScore > 0) elementIds.push("petal-water");
  if (air === maxElementScore && maxElementScore > 0) elementIds.push("petal-air");

  const maxQualityScore = Math.max(cardinal, fixo, mutavel);
  const qualityIds: string[] = [];
  if (cardinal === maxQualityScore && maxQualityScore > 0) qualityIds.push("petala-cardeal");
  if (fixo === maxQualityScore && maxQualityScore > 0) qualityIds.push("petala-fixo");
  if (mutavel === maxQualityScore && maxQualityScore > 0) qualityIds.push("petala-mutavel");

  const petals = [...elementIds, ...qualityIds];

  const houses: VisualStateHouseItem[] = [];
  for (let h = 1; h <= 12; h++) {
    const hasTropical = profile.tropical_natal.planets.some(p => p.house === h);
    const hasVedic = profile.vedic_natal.planets.some(p => p.house === h);

    let state: 'tropical-active' | 'vedic-active' | 'intersect-active' | 'inactive' = 'inactive';
    if (hasTropical && hasVedic) {
      state = 'intersect-active';
    } else if (hasTropical) {
      state = 'tropical-active';
    } else if (hasVedic) {
      state = 'vedic-active';
    }

    const houseObj = profile.tropical_natal.houses.find(houseItem => houseItem.house === h);
    const sign = houseObj ? houseObj.sign : "Áries";

    let element: 'fire' | 'earth' | 'air' | 'water' = 'fire';
    if (fireSigns.includes(sign)) element = 'fire';
    else if (earthSigns.includes(sign)) element = 'earth';
    else if (airSigns.includes(sign)) element = 'air';
    else if (waterSigns.includes(sign)) element = 'water';

    const elementClass = `element-${element}`;
    const stateClass = state === 'intersect-active' ? 'state-intersect' : state === 'tropical-active' ? 'state-tropical' : state === 'vedic-active' ? 'state-vedic' : 'state-inactive';

    houses.push({
      id: h,
      state,
      element,
      sign,
      elementClass,
      stateClass
    });
  }

  return {
    houses,
    petals
  };
}
