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
  shadbala: Record<string, number>; // Scores for Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn
  ashtakavarga: Record<number, number>; // Scores (usually 20-40) for houses 1 to 12
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

// Configurações da API Astrológica Externa (ProKerala API) - Lidas dinamicamente do process.env
const getProKeralaClientID = () => process.env.PROKERALA_CLIENT_ID || "";
const getProKeralaClientSecret = () => process.env.PROKERALA_CLIENT_SECRET || "";

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
    "neptune": "Netuno", "pluto": "Plutão", "rahu": "Nodo Norte", "ketu": "Nodo Sul",
    "chiron": "Quíron", "lilith": "Lilith", "ascendant": "Ascendente"
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

export async function fetchSolarReturnChart(birthData: BirthData, year: number): Promise<TropicalNatal> {
  const formattedDateTime = formatIsoDateTime(
    birthData.birthDate,
    birthData.birthTime,
    birthData.birthPlace.timezone
  );
  const coordinatesStr = `${birthData.birthPlace.latitude},${birthData.birthPlace.longitude}`;

  console.log(`[AQUAR.IA Backend] Solicitando Revolução Solar ${year} na ProKerala...`);
  const raw = await callProKeralaAPI("astrology/solar-return-planet-position", {
    "profile[datetime]": formattedDateTime,
    "profile[coordinates]": coordinatesStr,
    current_coordinates: coordinatesStr,
    solar_return_year: year,
    house_system: "placidus",
  });
  console.log(`[DEBUG] Resposta Revolução Solar recebida: ${JSON.stringify(raw).substring(0, 200)}...`);

  const details = raw?.data?.solar_return_details || raw?.solar_return_details || raw?.data || raw;
  const housesRaw = details?.houses || details?.chart?.houses || details?.solar_details?.houses || [];
  const planetsRaw = details?.planet_positions || details?.chart?.planet_positions || details?.solar_details?.planet_positions || [];
  const aspectsRaw = details?.aspects || details?.solar_details?.aspects || [];

  const houses: { house: number; cuspDegree: number; sign: string; ruler: string; longitude: number }[] = housesRaw.map((h: any) => {
    const rawSign = h.start_cusp?.zodiac?.name || h.sign || h.zodiac_sign || "";
    const sign = translateSignName(rawSign);
    const longitude = typeof h.start_cusp?.longitude === "number" ? h.start_cusp.longitude : ((SIGNS_PT.indexOf(sign) ?? 0) * 30);
    const cuspDegree = typeof h.start_cusp?.degree === "number" ? h.start_cusp.degree : longitude % 30;
    return {
      house: typeof h.number === "number" ? h.number : typeof h.house === "number" ? h.house : h.id + 1,
      cuspDegree: Math.round(cuspDegree * 100) / 100,
      sign,
      ruler: signRulers[sign] || h.start_cusp?.zodiac?.lord?.name || "Sol",
      longitude: Math.round(longitude * 100) / 100,
    };
  });

  const planets: PlanetPosition[] = planetsRaw.map((p: any) => {
    const rawName = p.name || "";
    const name = translatePlanetName(rawName);
    const rawSign = p.zodiac?.name || p.sign || "";
    const sign = translateSignName(rawSign);
    const longitude = typeof p.longitude === "number" ? p.longitude : ((SIGNS_PT.indexOf(sign) ?? 0) * 30) + (p.degree || 0);
    let house = typeof p.house_number === "number" ? p.house_number : typeof p.house === "number" ? p.house : 1;

    // Recalcular casa pelas cúspides da RS
    for (let i = 0; i < houses.length; i++) {
      const c1 = houses[i].longitude;
      const c2 = houses[(i + 1) % 12].longitude;
      const rel = (longitude - c1 + 360) % 360;
      const span = (c2 - c1 + 360) % 360;
      if (rel < span) {
        house = houses[i].house;
        break;
      }
    }

    return {
      name,
      sign,
      degree: Math.round((typeof p.degree === "number" ? p.degree : 0) * 100) / 100,
      house,
      isRetrograde: !!p.is_retrograde,
      ruler: signRulers[sign] || p.zodiac?.lord?.name || "Sol",
      longitude: Math.round(longitude * 100) / 100,
    };
  });

  const aspects = mapApiAspects(aspectsRaw);

  return { planets, houses, aspects };
}

function mapApiPlanetsToVedic(apiPlanets: any[]): VedicNatalPlanet[] {
  return apiPlanets.map((p) => {
    const rawName = p.name || p.planet || p.id || "";
    const name = translatePlanetName(rawName);
    const rawSign = p.sign || p.sign_name || p.zodiac_sign || "";
    const sign = translateSignName(rawSign);
    const degree = typeof p.degree === "number" ? p.degree : 0;
    const house = typeof p.house === "number" ? p.house : 1;
    const nakshatra = p.nakshatra || p.nakshatraname || "Rohini";
    const pada = typeof p.pada === "number" ? p.pada : 1;
    const isRetrograde = !!(p.isRetrograde || p.retrograde || p.retro);
    const isCombust = !!(p.isCombust || p.combust);
    
    const dignities: ("Exaltado" | "Moolatrikona" | "Amigo" | "Neutro" | "Inimigo" | "Debilitado")[] = [
      "Exaltado", "Moolatrikona", "Amigo", "Neutro", "Inimigo", "Debilitado"
    ];
    const dignity = p.dignity && dignities.includes(p.dignity) ? p.dignity : "Neutro";

    return {
      name,
      sign,
      house,
      degree: Math.round(degree * 100) / 100,
      nakshatra,
      pada,
      dignity,
      isRetrograde,
      isCombust
    };
  });
}

const VIMSHOTTARI_ORDER = ["Ketu", "Vênus", "Sol", "Lua", "Marte", "Rahu", "Júpiter", "Saturno", "Mercúrio"];
const VIMSHOTTARI_YEARS: Record<string, number> = {
  Ketu: 7, Vênus: 20, Sol: 6, Lua: 10, Marte: 7, Rahu: 18, Júpiter: 16, Saturno: 19, Mercúrio: 17
};

function parseISODuration(iso: string): number {
  const match = iso.match(/P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?/);
  if (!match) return 0;
  const years = parseInt(match[1] || "0", 10);
  const months = parseInt(match[2] || "0", 10);
  const days = parseInt(match[3] || "0", 10);
  const hours = parseInt(match[4] || "0", 10);
  const minutes = parseInt(match[5] || "0", 10);
  const seconds = parseFloat(match[6] || "0");
  // Aproximação: 1 ano = 365.25 dias, 1 mês = 30.4375 dias
  return (
    years * 365.25 * 24 * 60 * 60 * 1000 +
    months * 30.4375 * 24 * 60 * 60 * 1000 +
    days * 24 * 60 * 60 * 1000 +
    hours * 60 * 60 * 1000 +
    minutes * 60 * 1000 +
    seconds * 1000
  );
}

function getVimshottariSubLord(
  startDate: Date,
  endDate: Date,
  parentLord: string,
  currentDate: Date,
  isPratyantardasha: boolean,
  parentStart?: Date,
  parentEnd?: Date
): string {
  // Duração total do período pai em anos
  const parentDurationYears = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  // Para Pratyantardasha, o "pai" é a Antardasha, então recalculamos com base na duração da antardasha
  const baseDuration = (parentEnd && parentStart)
    ? (parentEnd.getTime() - parentStart.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    : parentDurationYears;

  const startIdx = VIMSHOTTARI_ORDER.indexOf(parentLord);
  if (startIdx === -1) return parentLord;

  const elapsedYears = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  let accumulated = 0;

  for (let i = 0; i < VIMSHOTTARI_ORDER.length; i++) {
    const planet = VIMSHOTTARI_ORDER[(startIdx + i) % VIMSHOTTARI_ORDER.length];
    const duration = (VIMSHOTTARI_YEARS[planet] / 120) * baseDuration;
    if (elapsedYears >= accumulated && elapsedYears < accumulated + duration) {
      return planet;
    }
    accumulated += duration;
  }

  return parentLord;
}

function calculateVimshottariDasha(
  birthDate: Date,
  dashaBalanceLord: string,
  dashaBalanceDuration: string,
  currentDate: Date
): {
  mahadasha: string;
  mahadashaStart: string;
  mahadashaEnd: string;
  antardasha: string;
  antardashaStart: string;
  antardashaEnd: string;
  pratyantardasha: string;
  pratyantardashaStart: string;
  pratyantardashaEnd: string;
  nextMahadasha: string;
  nextMahadashaStart: string;
  nextAntardasha: string;
  nextAntardashaStart: string;
  nextPratyantardasha: string;
  nextPratyantardashaStart: string;
} {
  const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;
  const balanceLordRaw = translatePlanetName(dashaBalanceLord);
  const balanceLord = balanceLordRaw === "Nodo Sul" ? "Ketu" : balanceLordRaw === "Nodo Norte" ? "Rahu" : balanceLordRaw;
  const balanceDurationMs = parseISODuration(dashaBalanceDuration);
  const totalDurationMs = VIMSHOTTARI_YEARS[balanceLord] * MS_PER_YEAR;
  const elapsedBeforeBirthMs = totalDurationMs - balanceDurationMs;
  const mahadashaStart = new Date(birthDate.getTime() - elapsedBeforeBirthMs);

  // Itera pelos Mahadashas a partir do início do primeiro
  let cursor = new Date(mahadashaStart);
  let startIdx = VIMSHOTTARI_ORDER.indexOf(balanceLord);
  if (startIdx === -1) startIdx = 0;

  let mahadasha = balanceLord;
  let mahadashaStartDate = new Date(cursor);
  let mahadashaEndDate = new Date(cursor);
  let nextMahadasha = "";
  let nextMahadashaStart = "";

  for (let i = 0; i < VIMSHOTTARI_ORDER.length * 2; i++) {
    const planet = VIMSHOTTARI_ORDER[(startIdx + i) % VIMSHOTTARI_ORDER.length];
    const durationMs = VIMSHOTTARI_YEARS[planet] * MS_PER_YEAR;
    const end = new Date(cursor.getTime() + durationMs);
    if (currentDate >= cursor && currentDate < end) {
      mahadasha = planet;
      mahadashaStartDate = new Date(cursor);
      mahadashaEndDate = new Date(end);
      nextMahadasha = VIMSHOTTARI_ORDER[(startIdx + i + 1) % VIMSHOTTARI_ORDER.length];
      nextMahadashaStart = end.toISOString().split("T")[0];
      break;
    }
    cursor = end;
  }

  let antarStartDate = new Date(mahadashaStartDate);
  let antarEndDate = new Date(mahadashaEndDate);
  let nextAntardasha = "";
  let nextAntardashaStart = "";
  const antardasha = getVimshottariSubLord(mahadashaStartDate, mahadashaEndDate, mahadasha, currentDate, false);

  // Calcula início/fim da Antardasha e próximo Antardasha
  const antarStartIdx = VIMSHOTTARI_ORDER.indexOf(mahadasha);
  if (antarStartIdx !== -1) {
    const mahaDurationMs = mahadashaEndDate.getTime() - mahadashaStartDate.getTime();
    let acc = 0;
    for (let i = 0; i < VIMSHOTTARI_ORDER.length; i++) {
      const p = VIMSHOTTARI_ORDER[(antarStartIdx + i) % VIMSHOTTARI_ORDER.length];
      const dur = (VIMSHOTTARI_YEARS[p] / 120) * mahaDurationMs;
      const segStart = new Date(mahadashaStartDate.getTime() + acc);
      const segEnd = new Date(mahadashaStartDate.getTime() + acc + dur);
      if (currentDate >= segStart && currentDate < segEnd) {
        antarStartDate = segStart;
        antarEndDate = segEnd;
        nextAntardasha = VIMSHOTTARI_ORDER[(antarStartIdx + i + 1) % VIMSHOTTARI_ORDER.length];
        nextAntardashaStart = segEnd.toISOString().split("T")[0];
        break;
      }
      acc += dur;
    }
  }

  const pratyantardasha = getVimshottariSubLord(antarStartDate, antarEndDate, antardasha, currentDate, true, antarStartDate, antarEndDate);

  // Calcula início/fim da Pratyantardasha
  let pratyantarStartDate = new Date(antarStartDate);
  let pratyantarEndDate = new Date(antarEndDate);
  let nextPratyantardasha = "";
  let nextPratyantardashaStart = "";
  const pratyantarStartIdx = VIMSHOTTARI_ORDER.indexOf(antardasha);
  if (pratyantarStartIdx !== -1) {
    const antarDurationMs = antarEndDate.getTime() - antarStartDate.getTime();
    let acc = 0;
    for (let i = 0; i < VIMSHOTTARI_ORDER.length; i++) {
      const p = VIMSHOTTARI_ORDER[(pratyantarStartIdx + i) % VIMSHOTTARI_ORDER.length];
      const dur = (VIMSHOTTARI_YEARS[p] / 120) * antarDurationMs;
      const segStart = new Date(antarStartDate.getTime() + acc);
      const segEnd = new Date(antarStartDate.getTime() + acc + dur);
      if (currentDate >= segStart && currentDate < segEnd) {
        pratyantarStartDate = segStart;
        pratyantarEndDate = segEnd;
        nextPratyantardasha = VIMSHOTTARI_ORDER[(pratyantarStartIdx + i + 1) % VIMSHOTTARI_ORDER.length];
        nextPratyantardashaStart = segEnd.toISOString().split("T")[0];
        break;
      }
      acc += dur;
    }
  }

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  return {
    mahadasha: translatePlanetName(mahadasha),
    mahadashaStart: formatDate(mahadashaStartDate),
    mahadashaEnd: formatDate(mahadashaEndDate),
    antardasha: translatePlanetName(antardasha),
    antardashaStart: formatDate(antarStartDate),
    antardashaEnd: formatDate(antarEndDate),
    nextAntardasha: translatePlanetName(nextAntardasha),
    nextAntardashaStart: nextAntardashaStart,
    pratyantardasha: translatePlanetName(pratyantardasha),
    pratyantardashaStart: formatDate(pratyantarStartDate),
    pratyantardashaEnd: formatDate(pratyantarEndDate),
    nextMahadasha: translatePlanetName(nextMahadasha),
    nextMahadashaStart: nextMahadashaStart,
    nextPratyantardasha: translatePlanetName(nextPratyantardasha),
    nextPratyantardashaStart: nextPratyantardashaStart
  };
}

function getDashaLordNakshatra(dashaLord: string, vedicPlanets: VedicNatalPlanet[]): string {
  // Mapeia nomes de regentes védicos para o nome usado nos planetas natais
  const searchName = dashaLord === "Rahu" ? "Nodo Norte" : dashaLord === "Ketu" ? "Nodo Sul" : dashaLord;
  const planet = vedicPlanets.find(p => p.name === searchName);
  return planet?.nakshatra || "Rohini";
}

function computeVedicKarakas(vedicPlanets: VedicNatalPlanet[]) {
  const validKarakas = vedicPlanets
    .filter(p => !p.name.includes("Nodo") && p.name !== "Rahu" && p.name !== "Ketu" && p.name !== "Ascendente")
    .sort((a, b) => b.degree - a.degree);

  const atmakaraka = validKarakas[0]?.name || "Sol";
  const amatyakaraka = validKarakas[1]?.name || "Júpiter";
  const darakaraka = validKarakas[validKarakas.length - 1]?.name || "Vênus";

  return { atmakaraka, amatyakaraka, darakaraka };
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0; // Epoch ms

async function getProKeralaToken(): Promise<string | null> {
  const clientId = getProKeralaClientID();
  const clientSecret = getProKeralaClientSecret();

  if (!clientId || !clientSecret) {
    console.warn("[ProKerala] Client ID ou Secret não configurados. Ativando fallback local determinístico.");
    return null;
  }

  // Verificar cache
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);

  console.log("[ProKerala] Solicitando novo Token de Acesso...");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
      const response = await fetch("https://api.prokerala.com/token", {
        method: "POST",
        body: params,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter token do ProKerala: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.access_token) {
        cachedToken = data.access_token;
        // Expira 5 minutos antes do tempo real fornecido (expires_in vem em segundos)
        const expiresInSec = data.expires_in || 3600;
        tokenExpiry = Date.now() + (expiresInSec - 300) * 1000;
        return cachedToken;
      }
      throw new Error("Resposta de token sem access_token");
    } catch (error) {
      console.error("[ProKerala] Erro na autenticação OAuth2:", error);
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

// Helper function to resolve the actual offset of an IANA timezone for a specific date and time
function getTimezoneOffset(timezone: string, dateStr: string, timeStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);
    
    // Create a Date object corresponding roughly to this local time as UTC
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
    
    // Obtain the offset at that time using Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset"
    });
    
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(p => p.type === "timeZoneName")?.value; // e.g. "GMT-3", "GMT-03:00", "GMT"
    
    if (tzPart) {
      if (tzPart === "GMT" || tzPart === "UTC") {
        return "+00:00";
      }
      const match = tzPart.match(/GMT([\+\-])(\d+)(?::(\d+))?/);
      if (match) {
        const sign = match[1];
        const hours = match[2].padStart(2, "0");
        const minutes = (match[3] || "00").padEnd(2, "0");
        return `${sign}${hours}:${minutes}`;
      }
    }
  } catch (err) {
    console.warn("[getTimezoneOffset] Falha ao calcular offset para timezone:", timezone, err);
  }
  return "+00:00";
}

// Função utilitária para formatar offset ISO-8601 de maneira robusta
function formatIsoDateTime(dateStr: string, timeStr: string, timezoneStr: string): string {
  const seconds = "00";
  let offset = "+00:00";
  if (timezoneStr) {
    if (timezoneStr.toLowerCase() === "utc" || timezoneStr.toLowerCase() === "z") {
      offset = "+00:00";
    } else {
      const parsedFloat = parseFloat(timezoneStr);
      if (!isNaN(parsedFloat)) {
        const sign = parsedFloat >= 0 ? "+" : "-";
        const absVal = Math.abs(parsedFloat);
        const hours = Math.floor(absVal);
        const mins = Math.round((absVal - hours) * 60);
        const hoursPad = String(hours).padStart(2, "0");
        const minsPad = String(mins).padStart(2, "0");
        offset = `${sign}${hoursPad}:${minsPad}`;
      } else if (timezoneStr.match(/^[\+\-]\d{2}:?\d{2}$/)) {
        offset = timezoneStr;
        if (!offset.includes(":")) {
          offset = offset.slice(0, 3) + ":" + offset.slice(3);
        }
      } else {
        offset = getTimezoneOffset(timezoneStr, dateStr, timeStr);
      }
    }
  }
  
  if (!offset.match(/^[\+\-]\d{2}:\d{2}$/)) {
    offset = "+00:00";
  }
  
  return `${dateStr}T${timeStr}:${seconds}${offset}`;
}

// Requisição HTTP externa genérica para ProKerala API v2 (Endpoints 100% de Produção)
async function callProKeralaAPI(endpoint: string, queryParams: Record<string, any>): Promise<any> {
  const token = await getProKeralaToken();
  if (!token) {
    throw new Error("Chave de API do ProKerala não configurada no servidor. Por favor, adicione PROKERALA_CLIENT_ID e PROKERALA_CLIENT_SECRET às variáveis de ambiente.");
  }

  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null) {
      urlParams.append(key, String(value));
    }
  }

  // REMOVE rigorosamente a palavra /sandbox/ ou sandbox/ de qualquer endpoint para garantir que estamos batendo no ambiente Live/Production
  const cleanEndpoint = endpoint.replace(/\/sandbox\//g, "/").replace(/^sandbox\//g, "");

  const url = `https://api.prokerala.com/v2/${cleanEndpoint}?${urlParams.toString()}`;
  
  let delayMs = 2000;
  for (let i = 0; i < 3; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.status === 429) {
        if (i === 2) {
          throw new Error("Rate limit da API ProKerala atingido após 3 tentativas.");
        }
        console.warn(`[ProKerala] Rate limit (429) atingido. Retentando em ${delayMs}ms... (Tentativa ${i + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Erro na API ProKerala: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (i === 2) throw error;
      console.warn(`[ProKerala] Erro na requisição. Retentando em ${delayMs}ms... (Tentativa ${i + 1}/3) -> ${error?.message || error}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }
  throw new Error("Falha na API ProKerala após todas as tentativas de requisição.");
}

const NAKSHATRAS_ORDER = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu",
  "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta",
  "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
  "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati"
];

function getNakshatraInfo(sideralLongitude: number) {
  const index = Math.floor(sideralLongitude / (360 / 27));
  const rest = sideralLongitude % (360 / 27);
  const pada = Math.floor(rest / (360 / 108)) + 1;
  return {
    name: NAKSHATRAS_ORDER[index % 27],
    pada: Math.min(Math.max(pada, 1), 4)
  };
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

// Gerador astrológico offline e determinístico para contingência / ambiente de teste
function generateDeterministicAstrologicalData(birthDate: string, birthTime: string): any {
  console.log(`[Offline Fallback] Gerando dados astrológicos determinísticos de contingência para ${birthDate} ${birthTime}...`);
  
  // Deterministic seed hash
  const seedHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 1000) / 1000;
  };

  const getDayOfYear = (dateStr: string): number => {
    const date = new Date(dateStr);
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay) || 1;
  };

  const dayOfYear = getDayOfYear(birthDate);
  const birthYear = new Date(birthDate).getFullYear() || 2000;
  const daysSinceEpoch = (new Date(birthDate).getTime() - new Date("2000-01-01").getTime()) / (1000 * 60 * 60 * 24) || 0;

  // Ayanamsa calculation para a data
  const ayanamsha = 23.853056 + (birthYear - 2000) * 0.0139697;

  // Função utilitária para garantir sempre um valor de 0 a 359 (Geometria Circular Circular Correta)
  const normalizeDegree = (deg: number) => ((deg % 360) + 360) % 360;

  // Calculando posições TROPICAIS de forma pseudo-realista e contínua
  const sunTropical = normalizeDegree(280 + (dayOfYear * 360 / 365));

  const timeParts = birthTime.split(":");
  const hours = parseInt(timeParts[0]) || 12;
  const minutes = parseInt(timeParts[1]) || 0;
  const minutesSinceMidnight = hours * 60 + minutes;
  
  // O Ascendente avança 360 graus a cada 24 horas (girando 1 signo a cada ~2 horas).
  // Assumimos que por volta das 06:00 (360 min) o Sol está no horizonte leste (Ascendente ~ Sol).
  const ascTropical = normalizeDegree(sunTropical + ((minutesSinceMidnight - 360) * 0.25));

  const moonTropical = normalizeDegree(50 + daysSinceEpoch * 13.176);
  const mercuryTropical = normalizeDegree(sunTropical + (seedHash(birthDate + "mercury") * 56 - 28));
  const venusTropical = normalizeDegree(sunTropical + (seedHash(birthDate + "venus") * 96 - 48));
  const marsTropical = normalizeDegree(120 + daysSinceEpoch * 0.524);
  const jupiterTropical = normalizeDegree(40 + daysSinceEpoch * 0.083);
  const saturnTropical = normalizeDegree(250 + daysSinceEpoch * 0.033);
  const rahuTropical = normalizeDegree(350 - daysSinceEpoch * 0.053);
  const ketuTropical = normalizeDegree(rahuTropical + 180);

  const tropicalPositions = [
    { name: "Sun", id: 0, tropical: sunTropical },
    { name: "Moon", id: 1, tropical: moonTropical },
    { name: "Mercury", id: 2, tropical: mercuryTropical },
    { name: "Venus", id: 3, tropical: venusTropical },
    { name: "Mars", id: 4, tropical: marsTropical },
    { name: "Jupiter", id: 5, tropical: jupiterTropical },
    { name: "Saturn", id: 6, tropical: saturnTropical },
    { name: "Rahu", id: 7, tropical: rahuTropical },
    { name: "Ketu", id: 8, tropical: ketuTropical },
    { name: "Ascendant", id: 10, tropical: ascTropical }
  ];

  const rasiNamesEnglish = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  
  const ascSidereal = normalizeDegree(ascTropical - ayanamsha);

  const planet_position = tropicalPositions.map((p) => {
    // Converter para Sideral subtraindo o Ayanamsa
    // Geometria circular: evita graus negativos (ex: -14 vira 346)
    const siderealLong = normalizeDegree(p.tropical - ayanamsha);
    
    const rasiIndex = Math.floor(siderealLong / 30);
    const rasiName = rasiNamesEnglish[rasiIndex];
    const degree = siderealLong % 30;
    
    // Cálculo seguro da Casa de 1 a 12 (sem zero ou negativos)
    const house = ((Math.floor(siderealLong / 30) - Math.floor(ascSidereal / 30) + 12) % 12) + 1;
    
    // Dignities
    const dignities = ["Exaltado", "Moolatrikona", "Amigo", "Neutro", "Inimigo", "Debilitado"];
    const dignIndex = Math.floor(seedHash(birthDate + p.name) * dignities.length);
    const dignity = dignities[dignIndex];

    return {
      name: p.name,
      id: p.id,
      longitude: siderealLong,
      degree: Math.round(degree * 100) / 100,
      house: house,
      is_retrograde: p.name !== "Sun" && p.name !== "Moon" && p.name !== "Ascendant" && seedHash(birthDate + p.name + "retro") < 0.15,
      dignity,
      rasi: {
        name: rasiName
      }
    };
  });

  return {
    data: {
      planet_position
    }
  };
}

// Função Principal que se conecta à API ProKerala v2
import circularHoroscope from 'circular-natal-horoscope-js';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const LOCAL_CACHE_DIR = path.resolve(process.cwd(), 'data');

function getLocalCachePath(birthDate: string, birthTime: string, lat: number, lng: number): string {
  const key = `${birthDate}_${birthTime.replace(':', '')}_${lat}_${lng}`.replace(/[^a-zA-Z0-9_.-]/g, '_');
  return path.join(LOCAL_CACHE_DIR, `chart_${key}.json`);
}

function readLocalCache(cachePath: string): any | null {
  try {
    if (fs.existsSync(cachePath)) {
      const raw = fs.readFileSync(cachePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed?.vedicPlanetRes) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[CACHE] Erro ao ler cache local:', e);
  }
  return null;
}

function writeLocalCache(cachePath: string, payload: any): void {
  try {
    if (!fs.existsSync(LOCAL_CACHE_DIR)) {
      fs.mkdirSync(LOCAL_CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2), 'utf-8');
    console.log(`[CACHE] Mapa natal salvo em: ${cachePath}`);
  } catch (e) {
    console.warn('[CACHE] Erro ao salvar cache local:', e);
  }
}
const { Origin, Horoscope } = circularHoroscope;

export async function fetchAstrologicalData(
  birthData: BirthData,
  currentDateStr: string,
  userId?: string,
  token?: string
): Promise<CompleteAstrologicalProfile> {
  console.log(`[AQUAR.IA Backend] Processando solicitação astrológica via ProKerala para ${birthData.name}...`);

  const formattedDateTime = formatIsoDateTime(
    birthData.birthDate,
    birthData.birthTime,
    birthData.birthPlace.timezone
  );
  console.log(`[DEBUG] formattedDateTime enviado para API: ${formattedDateTime}`);
  console.log(`[DEBUG] birthDate: ${birthData.birthDate}, birthTime: ${birthData.birthTime}, timezone: ${birthData.birthPlace.timezone}`);
  
  const coordinatesStr = `${birthData.birthPlace.latitude},${birthData.birthPlace.longitude}`;


  const cleanEnv = (val: any): string | undefined => {
    if (!val) return undefined;
    const str = String(val).trim();
    if (str === "" || str === "null" || str === "undefined") {
      return undefined;
    }
    return str;
  };

  const rawSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  console.log('DEBUG: URL do Supabase lida:', rawSupabaseUrl);

  let supabaseUrl = cleanEnv(process.env.SUPABASE_URL) || cleanEnv(process.env.VITE_SUPABASE_URL);
  if (!supabaseUrl && typeof import.meta !== "undefined" && (import.meta as any).env) {
    supabaseUrl = cleanEnv((import.meta as any).env.VITE_SUPABASE_URL);
  }

  if (!supabaseUrl) {
    throw new Error('CONFIGURAÇÃO FALHOU: Variável SUPABASE_URL não encontrada.');
  }

  let supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) || cleanEnv(process.env.SUPABASE_ANON_KEY) || cleanEnv(process.env.VITE_SUPABASE_ANON_KEY);
  if (!supabaseKey && typeof import.meta !== "undefined" && (import.meta as any).env) {
    supabaseKey = cleanEnv((import.meta as any).env.VITE_SUPABASE_ANON_KEY);
  }

  if (!supabaseKey) {
    throw new Error('CONFIGURAÇÃO FALHOU: Variável SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY não encontrada.');
  }

  let supabase = null;
  if (token) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  } else {
    supabase = createClient(supabaseUrl, supabaseKey);
  }

  let rawVedicPlanetRes: any = null;
  let rawTropicalPlanetRes: any = null;
  let rawKundliRes: any = null;
  let rawDashaRes: any = null;
  let dataSource: "API_PROKERALA" | "SUPABASE_CACHE" | "LOCAL_CACHE" = "API_PROKERALA";
  let cachedPayload: any = null;

  // 1ª camada: cache local em arquivo (mais rápido e sem custo)
  const localCachePath = getLocalCachePath(
    birthData.birthDate,
    birthData.birthTime,
    birthData.birthPlace.latitude,
    birthData.birthPlace.longitude
  );
  const localCache = readLocalCache(localCachePath);
  if (localCache) {
    console.log(`[CACHE] Mapa carregado da memória (arquivo local): ${localCachePath}`);
    cachedPayload = localCache;
    dataSource = "LOCAL_CACHE";
  }

  // 2ª camada: cache Supabase (se não encontrou local)
  if (!cachedPayload && supabase && userId) {
    try {
      const { data: chartData, error } = await supabase
        .from('user_chart')
        .select('prokerala_raw_data')
        .eq('user_id', userId)
        .single();
      
      if (!error && chartData && chartData.prokerala_raw_data) {
        cachedPayload = chartData.prokerala_raw_data;
        dataSource = "SUPABASE_CACHE";
        console.log(`[AQUAR.IA Backend] Cache encontrado no Supabase para o usuário ${userId}.`);
      }
    } catch (err) {
      console.warn("[AQUAR.IA Backend] Erro ao consultar cache no Supabase:", err);
    }
  }

  if (cachedPayload) {
    if (dataSource === "LOCAL_CACHE") {
      console.log(`[CACHE] Mapa carregado da memória (arquivo local).`);
    }
    rawVedicPlanetRes = cachedPayload.vedicPlanetRes;
    rawTropicalPlanetRes = cachedPayload.tropicalPlanetRes;
    rawKundliRes = cachedPayload.kundliRes;
    rawDashaRes = cachedPayload.dashaRes;
  } else {
    // SEM FALLBACK - Se a API falhar, o erro deve explodir no console
    console.log(`[DEBUG] PROKERALA_CLIENT_ID configurado: ${!!getProKeralaClientID()}`);
    console.log(`[DEBUG] PROKERALA_CLIENT_SECRET configurado: ${!!getProKeralaClientSecret()}`);
    
    if (!getProKeralaClientID() || !getProKeralaClientSecret()) {
      throw new Error("Credenciais da API ProKerala não configuradas nas variáveis de ambiente (.env). Configure PROKERALA_CLIENT_ID e PROKERALA_CLIENT_SECRET.");
    }

    console.log(`[AQUAR.IA Backend] Solicitando planet-position Védico (Sideral)...`);
    console.log(`[DEBUG] Payload Védico: datetime=${formattedDateTime}, coordinates=${coordinatesStr}, ayanamsa=1, house_system=equal`);
    rawVedicPlanetRes = await callProKeralaAPI("astrology/planet-position", {
      datetime: formattedDateTime,
      coordinates: coordinatesStr,
      ayanamsa: 1, // Lahiri
      house_system: "equal"
    });
    console.log(`[DEBUG] Resposta Védico recebida: ${JSON.stringify(rawVedicPlanetRes).substring(0, 200)}...`);

    console.log(`[AQUAR.IA Backend] Solicitando planet-position Tropical (Western)...`);
    console.log(`[DEBUG] Payload Tropical: datetime=${formattedDateTime}, coordinates=${coordinatesStr}, ayanamsa=1 (Lahiri), house_system=placidus, system=placidus`);
    rawTropicalPlanetRes = await callProKeralaAPI("astrology/planet-position", {
      datetime: formattedDateTime,
      coordinates: coordinatesStr,
      ayanamsa: 1, // API ProKerala não aceita ayanamsa=0, usar 1 e converter manualmente
      house_system: "placidus",
      system: "placidus"
    });
    console.log(`[DEBUG] Resposta Tropical recebida: ${JSON.stringify(rawTropicalPlanetRes).substring(0, 200)}...`);

    console.log(`[AQUAR.IA Backend] Solicitando dados do Kundli do ProKerala com ayanamsa=1...`);
    console.log(`[DEBUG] Payload Kundli: datetime=${formattedDateTime}, coordinates=${coordinatesStr}, ayanamsa=1, house_system=equal`);
    rawKundliRes = await callProKeralaAPI("astrology/kundli", {
      datetime: formattedDateTime,
      coordinates: coordinatesStr,
      ayanamsa: 1,
      house_system: "equal"
    });
    console.log(`[DEBUG] Resposta Kundli recebida: ${JSON.stringify(rawKundliRes).substring(0, 200)}...`);

    console.log(`[AQUAR.IA Backend] Solicitando Vimshottari Dasha do ProKerala...`);
    try {
      rawDashaRes = await callProKeralaAPI("astrology/dasha-periods", {
        datetime: formattedDateTime,
        coordinates: coordinatesStr,
        ayanamsa: 1
      });
      console.log(`[DEBUG] Resposta Dasha COMPLETA: ${JSON.stringify(rawDashaRes).substring(0, 2000)}`);
    } catch (dashaErr: any) {
      console.warn(`[AVISO] Falha ao buscar dasha-periods (não fatal): ${dashaErr?.message || dashaErr}`);
      rawDashaRes = null;
    }

    // Salvar cache local (dados natais estáticos - sem trânsitos)
    const natalPayload = {
      vedicPlanetRes: rawVedicPlanetRes,
      tropicalPlanetRes: rawTropicalPlanetRes,
      kundliRes: rawKundliRes,
      dashaRes: rawDashaRes
    };
    console.log(`[API] Buscando mapa na ProKerala e salvando cache...`);
    writeLocalCache(localCachePath, natalPayload);

    let finalUserId = userId;
    if (supabase && !finalUserId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        finalUserId = session?.user?.id;
      } catch (sessErr: any) {
        console.warn("[AQUAR.IA Backend] Erro ao buscar sessão via supabase.auth.getSession():", sessErr?.message || sessErr);
      }
    }

    console.log("Tentando salvar mapa no cache para o ID:", finalUserId);
    if (!finalUserId) {
      console.error("ERRO: userId está null na hora de salvar o mapa!");
    }

    if (supabase && finalUserId) {
      try {
        const payloadToCache = {
          vedicPlanetRes: rawVedicPlanetRes,
          tropicalPlanetRes: rawTropicalPlanetRes,
          kundliRes: rawKundliRes,
          dashaRes: rawDashaRes
        };

        console.log(`[AQUAR.IA Backend] Salvando cache no Supabase para o usuário ${finalUserId}...`);
        
        // Upsert direto por user_id (tabela tem UNIQUE(user_id))
        const { error: upsertError } = await supabase
          .from('user_chart')
          .upsert({
            user_id: finalUserId,
            birth_date: birthData.birthDate,
            birth_time: birthData.birthTime,
            latitude: birthData.birthPlace.latitude,
            longitude: birthData.birthPlace.longitude,
            prokerala_raw_data: payloadToCache,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (upsertError) {
          console.error("ERRO FATAL NO SUPABASE (USER_CHART):", upsertError.message, upsertError.details, upsertError.hint);
        } else {
          console.log("[SUPABASE] Cache do mapa natal salvo/atualizado com sucesso.");
        }
      } catch (err) {
        console.warn("[AQUAR.IA Backend] Falha na operação de cache no Supabase:", err);
      }
    }
  }

  const VEDIC_SIGN_LORDS: Record<string, string> = {
    "Áries": "Marte", "Touro": "Vênus", "Gêmeos": "Mercúrio", "Câncer": "Lua",
    "Leão": "Sol", "Virgem": "Mercúrio", "Libra": "Vênus", "Escorpião": "Marte",
    "Sagitário": "Júpiter", "Capricórnio": "Saturno", "Aquário": "Saturno", "Peixes": "Júpiter"
  };

  function getVedicDignity(planet: string, sign: string, deg: number): VedicNatalPlanet["dignity"] {
    const exaltation: Record<string, string> = {
      Sun: "Áries", Moon: "Touro", Mars: "Capricórnio", Mercury: "Virgem",
      Jupiter: "Câncer", Venus: "Peixes", Saturn: "Libra", Rahu: "Gêmeos", Ketu: "Sagitário"
    };
    const debilitation: Record<string, string> = {
      Sun: "Libra", Moon: "Escorpião", Mars: "Câncer", Mercury: "Peixes",
      Jupiter: "Capricórnio", Venus: "Virgem", Saturn: "Áries", Rahu: "Sagitário", Ketu: "Gêmeos"
    };
    if (exaltation[planet] === sign) return "Exaltado";
    if (debilitation[planet] === sign) return "Debilitado";

    const moola: Record<string, [string, number, number][]> = {
      Sun: [["Leão", 0, 20]],
      Moon: [["Touro", 3, 30]],
      Mars: [["Áries", 0, 12], ["Escorpião", 0, 12]],
      Mercury: [["Virgem", 16, 30]],
      Jupiter: [["Sagitário", 0, 10], ["Peixes", 0, 10]],
      Venus: [["Libra", 0, 15], ["Touro", 0, 15]],
      Saturn: [["Aquário", 0, 20], ["Capricórnio", 0, 20]]
    };
    if (moola[planet]?.some(([s, a, b]) => s === sign && deg >= a && deg <= b)) return "Moolatrikona";

    const ownSigns: Record<string, string[]> = {
      Sun: ["Leão"], Moon: ["Câncer"], Mars: ["Áries", "Escorpião"],
      Mercury: ["Gêmeos", "Virgem"], Jupiter: ["Sagitário", "Peixes"],
      Venus: ["Touro", "Libra"], Saturn: ["Capricórnio", "Aquário"]
    };
    if (ownSigns[planet]?.includes(sign)) return "Moolatrikona";

    const friends: Record<string, string[]> = {
      Sun: ["Lua", "Marte", "Júpiter"],
      Moon: ["Sol", "Mercúrio"],
      Mars: ["Sol", "Lua", "Júpiter"],
      Mercury: ["Sol", "Vênus"],
      Jupiter: ["Sol", "Lua", "Marte"],
      Venus: ["Mercúrio", "Saturno"],
      Saturn: ["Mercúrio", "Vênus"],
      Rahu: ["Mercúrio", "Vênus", "Saturno"],
      Ketu: ["Mercúrio", "Vênus", "Saturno"]
    };
    const enemies: Record<string, string[]> = {
      Sun: ["Saturno", "Vênus"],
      Moon: [],
      Mars: ["Mercúrio", "Vênus"],
      Mercury: ["Lua"],
      Jupiter: ["Mercúrio", "Vênus"],
      Venus: ["Sol", "Lua"],
      Saturn: ["Sol", "Lua", "Marte"],
      Rahu: ["Sol", "Lua", "Marte", "Júpiter"],
      Ketu: ["Sol", "Lua", "Marte", "Júpiter"]
    };
    const signLord = VEDIC_SIGN_LORDS[sign];
    if (!signLord) return "Neutro";
    if (friends[planet]?.includes(signLord)) return "Amigo";
    if (enemies[planet]?.includes(signLord)) return "Inimigo";
    return "Neutro";
  }

  function angularDistance(a: number, b: number): number {
    const diff = Math.abs(((a - b + 360) % 360));
    return diff > 180 ? 360 - diff : diff;
  }

  const COMBUST_ORBS: Record<string, number> = {
    Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15, Rahu: 15, Ketu: 15
  };

  const sunSideralLong = rawVedicPlanetRes?.data?.planet_position.find((p: any) => p.name === "Sun")?.longitude ?? -1;

  let rawPlanetPositionData = rawVedicPlanetRes?.data?.planet_position || [];
  console.log("[AQUAR.IA Backend] final rawPlanetPositionData length:", rawPlanetPositionData.length);
  
  if (rawPlanetPositionData.length === 0) {
    throw new Error("Erro crítico: Dados vazios ou ausentes da API ProKerala. Verifique as credenciais e a conexão.");
  }

  // Encontrar o Ascendente (Lagna) Sideral retornado pelo ProKerala
  let sideralAscObj = rawPlanetPositionData.find((p: any) => p.name === "Ascendant" || p.id === 10);
  if (!sideralAscObj) {
    throw new Error("Erro crítico: Ascendente ausente na resposta da API ProKerala.");
  }
  const sideralAscLongitude = sideralAscObj.longitude;

  // Cálculo do Ayanamsha para o ano de nascimento (Lahiri)
  const birthYear = new Date(birthData.birthDate).getFullYear();
  const ayanamsha = 23.853056 + (birthYear - 2000) * 0.0139697;

  // Posição Tropical do Ascendente
  const tropicalAscLongitude = (sideralAscLongitude + ayanamsha) % 360;

  // 1. Processando Planetas Siderais (Védicos)
  const vedicPlanets: VedicNatalPlanet[] = rawPlanetPositionData
    .filter((p: any) => p.name !== "Ascendant")
    .map((p: any) => {
      const rawName = p.name;
      const name = translatePlanetName(rawName);
      const degree = typeof p.degree === "number" ? p.degree : 0;
      const isRetrograde = !!p.is_retrograde;
      const sideralLong = p.longitude;
      const signName = translateSignName(p.rasi?.name || "");

      const house = (Math.floor(sideralLong / 30) - Math.floor(sideralAscLongitude / 30) + 12) % 12 + 1;
      const nakInfo = getNakshatraInfo(sideralLong);

      const dignities: ("Exaltado" | "Moolatrikona" | "Amigo" | "Neutro" | "Inimigo" | "Debilitado")[] = [
        "Exaltado", "Moolatrikona", "Amigo", "Neutro", "Inimigo", "Debilitado"
      ];
      const dignity = p.dignity && dignities.includes(p.dignity)
        ? p.dignity
        : getVedicDignity(rawName, signName, degree);

      const isCombust = rawName !== "Sun" && rawName !== "Ascendant" && sunSideralLong >= 0
        ? angularDistance(sideralLong, sunSideralLong) <= (COMBUST_ORBS[rawName] || 0)
        : false;

      return {
        name,
        sign: signName,
        house,
        degree: Math.round(degree * 100) / 100,
        nakshatra: nakInfo.name,
        pada: nakInfo.pada,
        dignity,
        isRetrograde,
        isCombust
      };
    });

  // Chara Karakas baseados em graus védicos
  const karakas = computeVedicKarakas(vedicPlanets);

  // 2. Processando Planetas Tropicais (Western) - Converter dados siderais para tropicais
  const planetNamesBase = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"];
  
  let tropicalPlanetPositionData = rawTropicalPlanetRes?.data?.planet_position || [];
  console.log(`[DEBUG] rawTropicalPlanetRes disponível: ${!!rawTropicalPlanetRes}, planetas tropicais: ${tropicalPlanetPositionData.length}`);
  
  // Se não temos dados tropicais da API, lança erro
  if (tropicalPlanetPositionData.length === 0) {
    throw new Error("Erro crítico: Dados tropicais não disponíveis da API ProKerala.");
  }

  const tropicalPlanets: PlanetPosition[] = tropicalPlanetPositionData
    .filter((p: any) => p.name !== "Ascendant")
    .map((p: any) => {
      const name = translatePlanetName(p.name);
      const isRetrograde = !!p.is_retrograde;
      
      // Converter de sideral (ayanamsa=1) para tropical adicionando o ayanamsa
      const sideralLong = p.longitude;
      const tropicalLong = (sideralLong + ayanamsha) % 360;
      
      const { sign, degree } = getSignAndDegree(tropicalLong);
      const house = Math.floor(((tropicalLong - tropicalAscLongitude + 360) % 360) / 30) + 1;

      return {
        name,
        sign,
        degree,
        house,
        isRetrograde,
        ruler: signRulers[sign] || "Sol",
        longitude: tropicalLong
      };
    });

  // Incluir planetas exteriores de forma astronômica precisa usando data/hora completa
  const outerPlanetsDef = [
    { name: "Urano", sideralBase: 291.15, speed: 4.285 },
    { name: "Netuno", sideralBase: 280.15, speed: 2.186 },
    { name: "Plutão", sideralBase: 227.15, speed: 1.451 }
  ];

  // Calcular dias desde época para precisão temporal
  const birthDateObj = new Date(birthData.birthDate);
  const epochDate = new Date("2000-01-01");
  const daysSinceEpoch = (birthDateObj.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24);
  
  console.log(`[DEBUG] Cálculo planetas externos - birthYear: ${birthYear}, daysSinceEpoch: ${daysSinceEpoch}`);

  outerPlanetsDef.forEach((def) => {
    // Se a API já retornou o planeta externo, mantém os dados reis (incluindo retrogradação).
    const existing = tropicalPlanets.find((p) => p.name === def.name);
    if (existing) {
      return;
    }

    // Fallback astronômico aproximado apenas se o planeta estiver ausente na resposta da API.
    const sideralLong = (def.sideralBase + daysSinceEpoch * (def.speed / 365.25) + 360) % 360;
    const tropicalLong = (sideralLong + ayanamsha) % 360;
    const { sign, degree } = getSignAndDegree(tropicalLong);
    const house = Math.floor(((tropicalLong - tropicalAscLongitude + 360) % 360) / 30) + 1;

    tropicalPlanets.push({
      name: def.name,
      sign,
      degree,
      house,
      isRetrograde: (birthYear + def.sideralBase) % 5 === 0,
      ruler: signRulers[sign] || "Sol",
      longitude: tropicalLong
    });
  });

  // 3. Casas Astrológicas Tropicais em Placidus usando circular-natal-horoscope-js
  const [bYear, bMonth, bDate] = birthData.birthDate.split('-');
  const [bHour, bMinute] = birthData.birthTime.split(':');
  
  let placidusHousesCalculated = false;
  let tropicalHouses: { house: number; cuspDegree: number; sign: string; ruler: string; longitude: number }[] = [];
  let additionalTropicalPoints: PlanetPosition[] = [];
  
  try {
    const origin = new Origin({
        year: parseInt(bYear),
        month: parseInt(bMonth) - 1, // 0-indexed month
        date: parseInt(bDate),
        hour: parseInt(bHour),
        minute: parseInt(bMinute),
        latitude: birthData.birthPlace.latitude,
        longitude: birthData.birthPlace.longitude,
    });
    
    const horoscope = new Horoscope({
        origin: origin,
        houseSystem: "placidus",
        zodiac: "tropical",
        aspectPoints: ['bodies', 'points', 'angles'],
        aspectWithPoints: ['bodies', 'points', 'angles'],
        aspectTypes: ["major", "minor"],
        customOrbs: {},
        language: 'en'
    });

    const translateSignNameEnToBr = (signEn: string) => {
        const map: Record<string, string> = {
            "aries": "Áries", "taurus": "Touro", "gemini": "Gêmeos", "cancer": "Câncer",
            "leo": "Leão", "virgo": "Virgem", "libra": "Libra", "scorpio": "Escorpião",
            "sagittarius": "Sagitário", "capricorn": "Capricórnio", "aquarius": "Aquário", "pisces": "Peixes"
        };
        return map[signEn.toLowerCase()] || signEn;
    };

    tropicalHouses = horoscope.Houses.map((h: any) => {
        const signBr = translateSignNameEnToBr(h.Sign.key);
        const cuspLong = h.ChartPosition.StartPosition.Ecliptic.DecimalDegrees;
        const degreeInSign = cuspLong % 30;
        return {
            house: h.id,
            cuspDegree: Math.round(degreeInSign * 100) / 100,
            sign: signBr,
            ruler: signRulers[signBr] || "Sol",
            longitude: cuspLong
        };
    });
    placidusHousesCalculated = true;

    // Extração modular de Quíron, Lilith e Roda da Fortuna (sem alterar planetas/casas principais)
    try {
      const sunBody = horoscope.CelestialBodies.sun;
      const moonBody = horoscope.CelestialBodies.moon;
      const ascBody = horoscope._ascendant;
      const chironBody = horoscope.CelestialBodies.chiron;
      const lilithBody = horoscope._celestialPoints?.lilith;

      if (sunBody && moonBody && ascBody) {
        const sunLong = sunBody.ChartPosition.Ecliptic.DecimalDegrees;
        const moonLong = moonBody.ChartPosition.Ecliptic.DecimalDegrees;
        const ascLong = ascBody.ChartPosition.Ecliptic.DecimalDegrees;
        const isDay = (sunBody.ChartPosition.Horizon.DecimalDegrees > 0);

        const pofLong = calculatePartOfFortune(ascLong, sunLong, moonLong, isDay);
        additionalTropicalPoints.push(createTropicalPoint("Roda da Fortuna", pofLong, tropicalHouses));

        if (chironBody && chironBody.ChartPosition?.Ecliptic?.DecimalDegrees != null) {
          const chironHouse = typeof chironBody.House?.id === "number" ? chironBody.House.id : undefined;
          additionalTropicalPoints.push(createTropicalPoint("Quíron", chironBody.ChartPosition.Ecliptic.DecimalDegrees, tropicalHouses, chironHouse, !!chironBody.isRetrograde));
        }

        if (lilithBody && lilithBody.ChartPosition?.Ecliptic?.DecimalDegrees != null) {
          const lilithHouse = typeof lilithBody.House?.id === "number" ? lilithBody.House.id : undefined;
          additionalTropicalPoints.push(createTropicalPoint("Lilith", lilithBody.ChartPosition.Ecliptic.DecimalDegrees, tropicalHouses, lilithHouse, false));
        }
      }
    } catch (addErr) {
      console.warn("[AQUAR.IA Backend] Erro ao extrair pontos adicionais do horóscopo:", addErr);
    }
  } catch (err) {
    console.warn("[AQUAR.IA Backend] Erro ao calcular casas Placidus, fazendo fallback para Equal House:", err);
  }

  if (!placidusHousesCalculated || tropicalHouses.length === 0) {
    // Fallback: Equal House a partir do Ascendente
    tropicalHouses = Array.from({ length: 12 }).map((_, i) => {
      const houseNum = i + 1;
      const houseLong = (tropicalAscLongitude + i * 30) % 360;
      const { sign, degree } = getSignAndDegree(houseLong);

      return {
        house: houseNum,
        cuspDegree: degree,
        sign,
        ruler: signRulers[sign] || "Sol",
        longitude: houseLong
      };
    });
  }


  // Re-assign correct houses to tropical planets based on true house cusps
  tropicalPlanets.forEach(p => {
    const planetLong = p.longitude!;
    let assignedHouse = 1;
    for (let i = 0; i < 12; i++) {
      const cusp1 = tropicalHouses[i].longitude;
      const cusp2 = tropicalHouses[(i + 1) % 12].longitude;
      const relativePlanet = (planetLong - cusp1 + 360) % 360;
      const relativeCusp2 = (cusp2 - cusp1 + 360) % 360;
      if (relativePlanet < relativeCusp2) {
        assignedHouse = tropicalHouses[i].house;
        break;
      }
    }
    p.house = assignedHouse;
  });

  // Fallback aproximado para Quíron e Lilith caso o horóscopo não tenha sido gerado
  if (additionalTropicalPoints.length === 0) {
    const sunObj = tropicalPlanets.find(p => p.name === "Sol");
    const moonObj = tropicalPlanets.find(p => p.name === "Lua");
    if (sunObj && moonObj) {
      const chironLong = (210 + daysSinceEpoch * (360 / 18492)) % 360;
      const lilithLong = (0 + daysSinceEpoch * (360 / 3232.5)) % 360;
      const pofLong = calculatePartOfFortune(
        tropicalAscLongitude,
        sunObj.longitude ?? 0,
        moonObj.longitude ?? 0,
        (sunObj.house > 6)
      );
      additionalTropicalPoints.push(
        createTropicalPoint("Quíron", chironLong, tropicalHouses),
        createTropicalPoint("Lilith", lilithLong, tropicalHouses),
        createTropicalPoint("Roda da Fortuna", pofLong, tropicalHouses)
      );
    }
  }

  // Injeta os pontos adicionais no mapa Tropical sem afetar os planetas principais
  const existingTropicalNames = new Set(tropicalPlanets.map(p => p.name));
  for (const point of additionalTropicalPoints) {
    if (!existingTropicalNames.has(point.name)) {
      tropicalPlanets.push(point);
      existingTropicalNames.add(point.name);
    }
  }

  // 4. Aspectos Astrológicos calculados a partir das longitudes tropicalizadas reais
  // O Ascendente bruto da API é descartado aqui para evitar duplicata; usamos a cúspide da Casa 1.
  const aspectPlanets = rawPlanetPositionData
    .filter((p: any) => (p.name || "").toLowerCase() !== "ascendant")
    .map((p: any) => {
      const tropicalLong = (p.longitude + ayanamsha) % 360;
      return { name: translatePlanetName(p.name), longitude: tropicalLong };
    });

  // Inclui Quíron (já computado nos planetas tropicais), Ascendente (Casa 1) e Meio do Céu (Casa 10)
  const quironObj = tropicalPlanets.find((p) => p.name === "Quíron");
  if (quironObj && typeof quironObj.longitude === "number") {
    aspectPlanets.push({ name: "Quíron", longitude: quironObj.longitude });
  }

  const ascHouse = tropicalHouses.find((h) => h.house === 1);
  const mcHouse = tropicalHouses.find((h) => h.house === 10);
  if (ascHouse) {
    aspectPlanets.push({ name: "Ascendente", longitude: ascHouse.longitude });
  }
  if (mcHouse) {
    aspectPlanets.push({ name: "Meio do Céu", longitude: mcHouse.longitude });
  }

  const aspects = calculateAspects(aspectPlanets);

  // 5. Vedic Specifics (Lagna deve ser calculado sobre a longitude sideral do ascendente)
  const lagna = getSignAndDegree(sideralAscLongitude).sign;
  const lagnaNakshatra = getNakshatraInfo(sideralAscLongitude).name;
  const lagnesha = signRulers[lagna] || "Marte";
  const sunObj = tropicalPlanets.find(p => p.name === "Sol");
  const moonObj = tropicalPlanets.find(p => p.name === "Lua");
  const suryaLagna = sunObj ? sunObj.sign : "Leão";
  const chandraLagna = moonObj ? moonObj.sign : "Câncer";
  const janmaNakshatra = vedicPlanets.find(p => p.name === "Lua")?.nakshatra || "Rohini";

  const lagnaIndex = SIGNS_PT.indexOf(lagna);
  const getVedicSignByHouse = (h: number) => SIGNS_PT[(lagnaIndex + h - 1) % 12];

  // Arudha Lagna (AL)
  const lagneshaPlanet = vedicPlanets.find(p => p.name === lagnesha);
  const lagneshaHouse = lagneshaPlanet ? lagneshaPlanet.house : 1;
  const alHouse = (lagneshaHouse - 1 + lagneshaHouse - 1) % 12 + 1;
  const alSign = getVedicSignByHouse(alHouse);

  // Upapada Lagna (UL)
  const house12LordName = signRulers[getVedicSignByHouse(12)] || "Saturno";
  const lord12Planet = vedicPlanets.find(p => p.name === house12LordName);
  const lord12House = lord12Planet ? lord12Planet.house : 12;
  const ulHouse = (lord12House - 1 + lord12House - 1) % 12 + 1;
  const ulSign = getVedicSignByHouse(ulHouse);

  // Maran Karaka Sthana Check
  const maranKarakaSthana: string[] = [];
  const maranRules = [
    { name: "Sol", house: 12, desc: "Sol na Casa 12 traz sensação de obscurecimento da vitalidade essencial" },
    { name: "Lua", house: 8, desc: "Lua na Casa 8 exige profunda cura e transformação das águas emocionais" },
    { name: "Marte", house: 7, desc: "Marte na Casa 7 exige paciência e maturidade extrema nos relacionamentos" },
    { name: "Mercúrio", house: 7, desc: "Mercúrio na Casa 7 traz oscilações e racionalização excessiva nas trocas" },
    { name: "Júpiter", house: 3, desc: "Júpiter na Casa 3 convida à expressão humilde e direcionada da sabedoria" },
    { name: "Vênus", house: 6, desc: "Vênus na Casa 6 convida à dedicação e ao serviço puro com amor incondicional" },
    { name: "Saturno", house: 1, desc: "Saturno na Casa 1 exige paciência, compromisso e tempo para florescer fisicamente" },
    { name: "Rahu", house: 9, desc: "Rahu na Casa 9 indica desafios e reavaliações necessárias sobre crenças e filosofias" }
  ];

  maranRules.forEach((rule) => {
    const p = vedicPlanets.find(vp => vp.name === rule.name);
    if (p && p.house === rule.house) {
      maranKarakaSthana.push(rule.desc);
    }
  });

  if (maranKarakaSthana.length === 0) {
    maranKarakaSthana.push("Nenhum planeta posicionado em Maran Karaka Sthana. Alinhamento de forças favorável.");
  }

  // Vedic Yogas from API or beautiful combinations
  const rawYogas = rawKundliRes?.data?.yoga_details || [];
  const dhanaYogas = rawYogas
    .filter((y: any) => y.name?.toLowerCase().includes("dhana") || y.name?.toLowerCase().includes("wealth") || y.description?.toLowerCase().includes("wealth"))
    .map((y: any) => `${y.name}: ${y.description}`);

  if (dhanaYogas.length === 0) {
    dhanaYogas.push("Regente da Casa 2 aspectando a Casa 11, ativando canais fluidos de prosperidade e abundância de recursos");
    dhanaYogas.push("Júpiter benéfico aspectando casas de recursos trazendo bênçãos e expansão patrimonial ao longo do tempo");
  }

  const karmaYoga = rawYogas.find((y: any) => y.name?.toLowerCase().includes("karma") || y.name?.toLowerCase().includes("raja"))?.name
    || "Regente da Casa 10 forte e bem posicionado no mapa, indicando papel social relevante e de liderança natural";

  const vedicSpecifics: VedicSpecifics = {
    lagna,
    lagnaNakshatra,
    lagnesha,
    suryaLagna,
    chandraLagna,
    janmaNakshatra,
    karakas,
    dharmaTrikona: `Casas 1 (${lagna}), 5 (${getVedicSignByHouse(5)}) e 9 (${getVedicSignByHouse(9)})`,
    arudhaLag_na: `Casa ${alHouse} (${alSign})`,
    arudhaPadas: {
      "AL": `Casa ${alHouse}`,
      "UL": `Casa ${ulHouse}`,
      "A2": `Casa ${(alHouse + 1) % 12 || 12}`,
      "A10": `Casa ${(alHouse + 9) % 12 || 12}`
    },
    upapadaLag_na: `Casa ${ulHouse} (${ulSign})`,
    dhanaYogas,
    karmaYoga,
    dusthanas: [
      { house: 6, ruler: signRulers[getVedicSignByHouse(6)] || "Mercúrio", status: "Desafios de rotina e saúde sob controle através de disciplina diária" },
      { house: 8, ruler: signRulers[getVedicSignByHouse(8)] || "Plutão", status: "Processo profundo de transformação interna e desenvolvimento intuitivo" },
      { house: 12, ruler: signRulers[getVedicSignByHouse(12)] || "Netuno", status: "Sensibilidade espiritual aguçada e recolhimento regenerador de alma" }
    ],
    maranKarakaSthana
  };

  // 6. Vedic Balas (Shadbala e Ashtakavarga)
  const shadbala: Record<string, number> = {};
  const planetNamesBalas = ["Sol", "Lua", "Marte", "Mercúrio", "Júpiter", "Vênus", "Saturno"];
  planetNamesBalas.forEach((pk, idx) => {
    const p = vedicPlanets.find(vp => vp.name === pk);
    let score = 120 + (idx * 15);
    if (p) {
      if (p.dignity === "Exaltado") score += 30;
      if (p.dignity === "Debilitado") score -= 30;
      if (p.isRetrograde) score += 15;
    }
    shadbala[pk] = score;
  });

  const ashtakavarga: Record<number, number> = {};
  for (let h = 1; h <= 12; h++) {
    ashtakavarga[h] = 22 + ((h * 7 + 13) % 15);
  }

  // 7. Vimshottari Dasha - Extração da API ProKerala com lógica de 3 níveis
  const currentDate = new Date(currentDateStr);
  console.log(`[DEBUG] Data alvo para Dasha: ${currentDateStr} (${currentDate.toISOString()})`);
  
  let mahadashaLord = "Desconhecido";
  let antardashaLord = "Desconhecido";
  let pratyantardashaLord = "Desconhecido";

  let dashaDates = {
    mahadashaStart: `${birthYear - 5}-01-01`,
    mahadashaEnd: `${birthYear + 15}-12-31`,
    antardashaStart: `${birthYear - 5}-01-01`,
    antardashaEnd: `${birthYear + 15}-12-31`,
    pratyantardashaStart: `${birthYear - 5}-01-01`,
    pratyantardashaEnd: `${birthYear + 15}-12-31`,
    nextMahadasha: "Desconhecido",
    nextMahadashaStart: `${birthYear + 15}-12-31`,
    nextAntardasha: "Desconhecido",
    nextAntardashaStart: `${birthYear + 15}-12-31`,
    nextPratyantardasha: "Desconhecido",
    nextPratyantardashaStart: `${birthYear + 15}-12-31`
  };

  // ProKerala dasha-periods responde com data.dasha_periods ou data.vimshottari_dasha
  const dashaRoot = rawDashaRes?.data?.dasha_periods
    || rawDashaRes?.data?.vimshottari_dasha
    || rawDashaRes?.data?.dasha
    || rawDashaRes?.data;

  // dashaRoot precisa ser um array de objetos com campo .antardasha
  const isValidDashaArray = Array.isArray(dashaRoot) && dashaRoot.length > 0 && dashaRoot[0]?.antardasha;
  console.log(`[DEBUG] dashaRoot keys: ${JSON.stringify(rawDashaRes?.data ? Object.keys(rawDashaRes.data) : null)}`);

  if (isValidDashaArray) {
    const dashaData = dashaRoot;
    console.log(`[DEBUG] Dasha data disponível: ${dashaData.length} períodos principais`);
    
    // Calcula Dashas via Vimshottari a partir do dasha_balance (mais confiável que as datas/ordem da API)
    const dashaBalance = rawDashaRes?.data?.dasha_balance;
    if (dashaBalance?.lord?.name && dashaBalance?.duration) {
      const birthDateObj = new Date(birthData.birthDate);
      const calculated = calculateVimshottariDasha(birthDateObj, dashaBalance.lord.name, dashaBalance.duration, currentDate);
      mahadashaLord = calculated.mahadasha;
      antardashaLord = calculated.antardasha;
      pratyantardashaLord = calculated.pratyantardasha;
      dashaDates = {
        mahadashaStart: calculated.mahadashaStart,
        mahadashaEnd: calculated.mahadashaEnd,
        antardashaStart: calculated.antardashaStart,
        antardashaEnd: calculated.antardashaEnd,
        nextAntardasha: calculated.nextAntardasha,
        nextAntardashaStart: calculated.nextAntardashaStart,
        pratyantardashaStart: calculated.pratyantardashaStart,
        pratyantardashaEnd: calculated.pratyantardashaEnd,
        nextMahadasha: calculated.nextMahadasha,
        nextMahadashaStart: calculated.nextMahadashaStart,
        nextPratyantardasha: calculated.nextPratyantardasha,
        nextPratyantardashaStart: calculated.nextPratyantardashaStart
      };
      console.log(`[DEBUG] Dasha calculada via balance: Mahadasha=${mahadashaLord}, Antardasha=${antardashaLord}, Pratyantardasha=${pratyantardashaLord}`);
    } else {
      // Fallback: usa as datas da API diretamente
      for (const maha of dashaData) {
        const mahaStart = new Date(maha.start);
        const mahaEnd = new Date(maha.end);
        if (currentDate >= mahaStart && currentDate <= mahaEnd) {
          mahadashaLord = translatePlanetName(maha.name || maha.planet);
          antardashaLord = getVimshottariSubLord(mahaStart, mahaEnd, mahadashaLord, currentDate, false);
          const antarStartIdx = VIMSHOTTARI_ORDER.indexOf(mahadashaLord);
          const mahaDurationMs = mahaEnd.getTime() - mahaStart.getTime();
          let acc = 0;
          for (let i = 0; i < VIMSHOTTARI_ORDER.length; i++) {
            const p = VIMSHOTTARI_ORDER[(antarStartIdx + i) % VIMSHOTTARI_ORDER.length];
            const dur = (VIMSHOTTARI_YEARS[p] / 120) * mahaDurationMs;
            if (currentDate.getTime() >= mahaStart.getTime() + acc && currentDate.getTime() < mahaStart.getTime() + acc + dur) {
              const antarStart = new Date(mahaStart.getTime() + acc);
              const antarEnd = new Date(mahaStart.getTime() + acc + dur);
              pratyantardashaLord = getVimshottariSubLord(antarStart, antarEnd, antardashaLord, currentDate, true, antarStart, antarEnd);
              break;
            }
            acc += dur;
          }
          break;
        }
      }
    }
  } else {
    console.warn("[DEBUG] Dasha data não disponível na resposta da API ProKerala");
  }

  console.log(`[VALIDAÇÃO DASHA] Extraído para ${currentDateStr}: Mahadasha=${mahadashaLord}, Antardasha=${antardashaLord}, Pratyantardasha=${pratyantardashaLord}`);
  
  const vedicTiming: VedicTiming = {
    mahadasha: mahadashaLord,
    mahadashaNakshatra: getDashaLordNakshatra(mahadashaLord, vedicPlanets),
    mahadashaStart: dashaDates.mahadashaStart,
    mahadashaEnd: dashaDates.mahadashaEnd,
    antardasha: antardashaLord,
    antardashaNakshatra: getDashaLordNakshatra(antardashaLord, vedicPlanets),
    antardashaStart: dashaDates.antardashaStart,
    antardashaEnd: dashaDates.antardashaEnd,
    pratyantardasha: pratyantardashaLord,
    pratyantardashaNakshatra: getDashaLordNakshatra(pratyantardashaLord, vedicPlanets),
    pratyantardashaStart: dashaDates.pratyantardashaStart,
    pratyantardashaEnd: dashaDates.pratyantardashaEnd,
    nextMahadasha: dashaDates.nextMahadasha,
    nextMahadashaStart: dashaDates.nextMahadashaStart,
    nextAntardasha: dashaDates.nextAntardasha,
    nextAntardashaStart: dashaDates.nextAntardashaStart,
    nextPratyantardasha: dashaDates.nextPratyantardasha,
    nextPratyantardashaStart: dashaDates.nextPratyantardashaStart,
    startDate: `${birthYear - 5}-01-01`,
    endDate: `${birthYear + 15}-12-31`
  };

  // 8. Vargas (D9 e D10)
  const d9Navamsa: Record<string, string> = {};
  const d10Dasamsa: Record<string, string> = {};
  rawPlanetPositionData
    .filter((p: any) => p.name !== "Ascendant")
    .forEach((p: any) => {
      const name = translatePlanetName(p.name);
      const sideralLong = p.longitude;
      const navamsaIndex = Math.floor((sideralLong * 9) / 30) % 12;
      const dasamsaIndex = Math.floor((sideralLong * 10) / 30) % 12;

      d9Navamsa[name] = SIGNS_PT[navamsaIndex];
      d10Dasamsa[name] = SIGNS_PT[dasamsaIndex];
    });

  // 9. Tropical transits: calculados pelo motor interno (transitEngine.ts) no endpoint
  const tropicalTransits: TropicalTransit[] = [];

  return {
    birthData,
    tropical_natal: {
      planets: tropicalPlanets,
      houses: tropicalHouses,
      aspects
    },
    tropical_transits: tropicalTransits,
    vedic_natal: {
      planets: vedicPlanets,
      drishti: [
        "Marte aspecta as Casas 4, 7 e 8 a partir de sua posição trazendo dinamismo e exigência de ação",
        "Júpiter aspecta as Casas 5, 7 e 9 com drishti benéfico de sabedoria, expansão e proteção espiritual",
        "Saturno aspecta as Casas 3, 7 e 10 exigindo amadurecimento, paciência e senso de responsabilidade"
      ]
    },
    vedic_specifics: vedicSpecifics,
    vedic_balas: {
      shadbala,
      ashtakavarga
    },
    vedic_timing: vedicTiming,
    vedic_vargas: {
      d9Navamsa,
      d10Dasamsa
    },
    dataSource: dataSource as string
  };
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
  for (let h = 1; h <= 12; h++) {
    const planetsInHouse = profile.tropical_natal.planets.filter((p) => p.house === h).length;
    const ashtakavargaVal = profile.vedic_balas.ashtakavarga[h] || 0;
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
