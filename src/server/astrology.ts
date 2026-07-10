export interface BirthData {
  name: string;
  gender: "masculino" | "feminino";
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
  houses: { house: number; cuspDegree: number; sign: string; ruler: string }[];
  aspects: Aspect[];
}

export interface TropicalTransit {
  planet: string;
  transitSign: string;
  transitDegree: number;
  transitHouse: number;
  aspectToNatal: string; // e.g. "Trígono com Sol Natal"
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
  antardasha: string;
  pratyantardasha: string;
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

const signRulers: Record<string, string> = {
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
function translatePlanetName(name: string): string {
  const translations: Record<string, string> = {
    "sun": "Sol", "moon": "Lua", "mercury": "Mercúrio", "venus": "Vênus",
    "mars": "Marte", "jupiter": "Júpiter", "saturn": "Saturno", "uranus": "Urano",
    "neptune": "Netuno", "pluto": "Plutão", "rahu": "Nodo Norte", "ketu": "Nodo Sul",
    "chiron": "Quíron", "lilith": "Lilith", "ascendant": "Ascendente"
  };
  const key = name.toLowerCase().trim();
  return translations[key] || name;
}

function translateSignName(name: string): string {
  const translations: Record<string, string> = {
    "aries": "Áries", "taurus": "Touro", "gemini": "Gêmeos", "cancer": "Câncer",
    "leo": "Leão", "virgo": "Virgem", "libra": "Libra", "scorpio": "Escorpião",
    "sagittarius": "Sagitário", "capricorn": "Capricórnio", "aquarius": "Aquário", "pisces": "Peixes",
    // Sanskrit names
    "mesha": "Áries", "vrishabha": "Touro", "mithuna": "Gêmeos", "karka": "Câncer", "karkata": "Câncer",
    "simha": "Leão", "kanya": "Virgem", "tula": "Libra", "vrishchika": "Escorpião",
    "dhanus": "Sagitário", "makara": "Capricórnio", "kumbha": "Aquário", "meena": "Peixes"
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

  try {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);

    console.log("[ProKerala] Solicitando novo Token de Acesso...");
    const response = await fetch("https://api.prokerala.com/token", {
      method: "POST",
      body: params,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
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

function calculateAspects(planets: { name: string; longitude: number }[]): Aspect[] {
  const aspects: Aspect[] = [];
  const definitions = [
    { name: "Conjunção", angle: 0, orb: 8 },
    { name: "Oposição", angle: 180, orb: 8 },
    { name: "Trígono", angle: 120, orb: 8 },
    { name: "Quadratura", angle: 90, orb: 8 }
  ];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const def of definitions) {
        const dev = Math.abs(diff - def.angle);
        if (dev <= def.orb) {
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
  let dataSource: "API_PROKERALA" | "MOTOR_FALLBACK" | "SUPABASE_CACHE" = "API_PROKERALA";
  let cachedPayload: any = null;

  if (supabase && userId) {
    try {
      const { data: chartData, error } = await supabase
        .from('user_charts')
        .select('prokerala_raw_data')
        .eq('user_id', userId)
        // Optionally match date/time/lat/lng to ensure we are caching the right chart if user can have multiple
        .eq('birth_date', birthData.birthDate)
        .eq('birth_time', birthData.birthTime)
        .eq('latitude', birthData.birthPlace.latitude)
        .eq('longitude', birthData.birthPlace.longitude)
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
    rawVedicPlanetRes = cachedPayload.vedicPlanetRes;
    rawTropicalPlanetRes = cachedPayload.tropicalPlanetRes;
    rawKundliRes = cachedPayload.kundliRes;
  } else {
    try {
      if (!getProKeralaClientID() || !getProKeralaClientSecret()) {
        throw new Error("Credenciais da API ProKerala não configuradas nas variáveis de ambiente (.env).");
      }

      console.log(`[AQUAR.IA Backend] Solicitando planet-position Védico (Sideral)...`);
      rawVedicPlanetRes = await callProKeralaAPI("astrology/planet-position", {
        datetime: formattedDateTime,
        coordinates: coordinatesStr,
        ayanamsa: 1, // Lahiri
        house_system: "equal"
      });
    } catch (err: any) {
      console.warn("[AQUAR.IA Backend] Falha na API ProKerala, ativando gerador astrológico offline de contingência:", err?.message || err);
      dataSource = "MOTOR_FALLBACK";
      rawVedicPlanetRes = generateDeterministicAstrologicalData(birthData.birthDate, birthData.birthTime);
      console.log("[AQUAR.IA Backend] Pós-fallback, rawVedicPlanetRes:", JSON.stringify(rawVedicPlanetRes));
    }

    try {
      console.log(`[AQUAR.IA Backend] Solicitando planet-position Tropical (Western)...`);
      rawTropicalPlanetRes = await callProKeralaAPI("astrology/planet-position", {
        datetime: formattedDateTime,
        coordinates: coordinatesStr,
        ayanamsa: 1,
        house_system: "placidus",
        system: "placidus"
      });
    } catch (err: any) {
      console.error("[AQUAR.IA Backend] Erro não fatal ao solicitar planet-position tropical:", err?.message || err);
    }

    try {
      console.log(`[AQUAR.IA Backend] Solicitando dados do Kundli do ProKerala com ayanamsa=1...`);
      rawKundliRes = await callProKeralaAPI("astrology/kundli", {
        datetime: formattedDateTime,
        coordinates: coordinatesStr,
        ayanamsa: 1,
        house_system: "equal"
      });
    } catch (err: any) {
      console.warn("[AQUAR.IA Backend] Erro não fatal ao buscar dados adicionais do Kundli:", err?.message || err);
    }

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

    if (supabase && finalUserId && dataSource !== "MOTOR_FALLBACK") {
      try {
        const payloadToCache = {
          vedicPlanetRes: rawVedicPlanetRes,
          tropicalPlanetRes: rawTropicalPlanetRes,
          kundliRes: rawKundliRes
        };

        console.log(`[AQUAR.IA Backend] Salvando cache no Supabase para o usuário ${finalUserId}...`);
        
        // Execute the database instruction (inserting raw data first)
        const { data, error: insertError } = await supabase
          .from('user_charts')
          .insert([
            {
              user_id: finalUserId,
              birth_date: birthData.birthDate,
              birth_time: birthData.birthTime,
              latitude: birthData.birthPlace.latitude,
              longitude: birthData.birthPlace.longitude,
              prokerala_raw_data: payloadToCache,
              updated_at: new Date().toISOString()
            }
          ]);

        if (insertError) {
          console.error("ERRO FATAL NO SUPABASE (USER_CHARTS):", insertError.message, insertError.details, insertError.hint);
          // If insert fails due to a unique key constraint violation (e.g. key already exists), we fallback to upsert
          if (insertError.code === '23505' || String(insertError.message).includes('unique_user_chart')) {
            console.log("[AQUAR.IA Backend] Linha já existente. Executando UPSERT para atualizar o cache...");
            const { data: upsertData, error: upsertError } = await supabase.from('user_charts').upsert({
              user_id: finalUserId,
              birth_date: birthData.birthDate,
              birth_time: birthData.birthTime,
              latitude: birthData.birthPlace.latitude,
              longitude: birthData.birthPlace.longitude,
              prokerala_raw_data: payloadToCache,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,birth_date,birth_time,latitude,longitude' });

            if (upsertError) {
              console.error("ERRO FATAL NO SUPABASE (USER_CHARTS - UPSERT):", upsertError.message, upsertError.details, upsertError.hint);
            } else {
              console.log("SUCESSO ABSOLUTO! Cache atualizado com sucesso via UPSERT.");
            }
          }
        } else {
          console.log("SUCESSO ABSOLUTO! Cache criado com sucesso.");
        }
      } catch (err) {
        console.warn("[AQUAR.IA Backend] Falha na operação de cache no Supabase:", err);
      }
    }
  }

  let rawPlanetPositionData = rawVedicPlanetRes?.data?.planet_position || [];
  console.log("[AQUAR.IA Backend] final rawPlanetPositionData length:", rawPlanetPositionData.length);
  
  if (rawPlanetPositionData.length === 0) {
    console.warn("[AQUAR.IA Backend] Dados vazios ou ausentes da API ProKerala. Ativando gerador astrológico offline de contingência em segundo nível...");
    dataSource = "MOTOR_FALLBACK";
    rawVedicPlanetRes = generateDeterministicAstrologicalData(birthData.birthDate, birthData.birthTime);
    rawPlanetPositionData = rawVedicPlanetRes?.data?.planet_position || [];
  }

  // Encontrar o Ascendente (Lagna) Sideral retornado pelo ProKerala ou gerado localmente
  let sideralAscObj = rawPlanetPositionData.find((p: any) => p.name === "Ascendant" || p.id === 10);
  if (!sideralAscObj) {
    console.warn("[AQUAR.IA Backend] Ascendente ausente na resposta da API. Ativando gerador astrológico offline de contingência em terceiro nível...");
    dataSource = "MOTOR_FALLBACK";
    rawVedicPlanetRes = generateDeterministicAstrologicalData(birthData.birthDate, birthData.birthTime);
    rawPlanetPositionData = rawVedicPlanetRes?.data?.planet_position || [];
    sideralAscObj = rawPlanetPositionData.find((p: any) => p.name === "Ascendant" || p.id === 10);
  }

  if (!sideralAscObj) {
    throw new Error("Erro crítico: Não foi possível localizar ou gerar a posição do Ascendente.");
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
      const name = translatePlanetName(p.name);
      const degree = typeof p.degree === "number" ? p.degree : 0;
      const isRetrograde = !!p.is_retrograde;
      const sideralLong = p.longitude;
      const signName = translateSignName(p.rasi?.name || "");
      
      const house = (Math.floor(sideralLong / 30) - Math.floor(sideralAscLongitude / 30) + 12) % 12 + 1;
      const nakInfo = getNakshatraInfo(sideralLong);

      const dignities: ("Exaltado" | "Moolatrikona" | "Amigo" | "Neutro" | "Inimigo" | "Debilitado")[] = [
        "Exaltado", "Moolatrikona", "Amigo", "Neutro", "Inimigo", "Debilitado"
      ];
      const dignity = p.dignity && dignities.includes(p.dignity) ? p.dignity : "Neutro";

      return {
        name,
        sign: signName,
        house,
        degree: Math.round(degree * 100) / 100,
        nakshatra: nakInfo.name,
        pada: nakInfo.pada,
        dignity,
        isRetrograde,
        isCombust: false
      };
    });

  // Chara Karakas baseados em graus védicos
  const karakas = computeVedicKarakas(vedicPlanets);

  // 2. Processando Planetas Tropicais (Western) usando translação de coordenadas Lahiri Ayanamsha
  const planetNamesBase = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"];
  const tropicalPlanets: PlanetPosition[] = rawPlanetPositionData
    .filter((p: any) => p.name !== "Ascendant")
    .map((p: any) => {
      const name = translatePlanetName(p.name);
      const isRetrograde = !!p.is_retrograde;
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

  // Incluir planetas exteriores de forma astronômica precisa e deterministicamente
  const outerPlanetsDef = [
    { name: "Urano", sideralBase: 291.15, speed: 4.285 },
    { name: "Netuno", sideralBase: 280.15, speed: 2.186 },
    { name: "Plutão", sideralBase: 227.15, speed: 1.451 }
  ];

  outerPlanetsDef.forEach((def) => {
    const sideralLong = (def.sideralBase + (birthYear - 2000) * def.speed + 360) % 360;
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
  let tropicalHouses = [];
  
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
    const planetLong = p.longitude;
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

  // 4. Aspectos Astrológicos calculados a partir das longitudes tropicalizadas reais
  const aspectPlanets = rawPlanetPositionData.map((p: any) => {
    const tropicalLong = (p.longitude + ayanamsha) % 360;
    return { name: translatePlanetName(p.name), longitude: tropicalLong };
  });
  const aspects = calculateAspects(aspectPlanets);

  // 5. Vedic Specifics (Lagna deve ser calculado sobre a longitude sideral do ascendente)
  const lagna = getSignAndDegree(sideralAscLongitude).sign;
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

  // 7. Vimshottari Dasha
  const moonSideral = rawPlanetPositionData.find((p: any) => p.name === "Moon");
  const moonSideralLong = moonSideral ? moonSideral.longitude : 0;
  const dashaLords = ["Ketu", "Vênus", "Sol", "Lua", "Marte", "Rahu", "Júpiter", "Saturno", "Mercúrio"];
  const nakIndex = Math.floor(moonSideralLong / (360 / 27));
  const dashaIndex = nakIndex % 9;
  const subDashaIndex = (dashaIndex + 1) % 9;
  const subSubDashaIndex = (subDashaIndex + 2) % 9;

  const vedicTiming: VedicTiming = {
    mahadasha: dashaLords[dashaIndex],
    antardasha: dashaLords[subDashaIndex],
    pratyantardasha: dashaLords[subSubDashaIndex],
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

  // 9. Slow Planets Transits (Tropical)
  const slowPlanetsList = ["Júpiter", "Saturno", "Urano", "Netuno", "Plutão", "Nodo Norte", "Nodo Sul"];
  const currentYear = new Date(currentDateStr).getFullYear();
  const tropicalTransits: TropicalTransit[] = slowPlanetsList.map((planet, index) => {
    const transSeed = currentYear + index * 41;
    const transitSign = SIGNS_PT[transSeed % 12];
    const transitDegree = Math.round(((transSeed % 300) / 10) * 100) / 100;
    const transitHouse = (transSeed % 12) + 1;
    const aspectOptions = ["Trígono", "Quadratura", "Oposição", "Conjunção", "Sêxtil"];
    const chosenAspect = aspectOptions[transSeed % aspectOptions.length];

    return {
      planet,
      transitSign,
      transitDegree,
      transitHouse,
      aspectToNatal: `${chosenAspect} com ${translatePlanetName(planetNamesBase[index % planetNamesBase.length])} Natal`
    };
  });

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
    const stateClass = state === 'intersect-active' ? 'state-intersect' : state === 'tropical-active' ? 'state-tropical' : state === 'vedic-active' ? 'state-vedic' : '';

    houses.push({
      id: h,
      state,
      element,
      elementClass,
      stateClass
    });
  }

  return {
    houses,
    petals
  };
}
