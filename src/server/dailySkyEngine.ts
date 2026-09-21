import { getTimezoneOffsetHours } from "./astrologyProviders";
import { getAllPlanetPositions, SIGN_NAMES } from "./transitEngine";

const TIMEZONE = "America/Sao_Paulo";
const NAKSHATRA_SIZE = 360 / 27;
const ASPECTS = [
  { name: "Conjunção", angle: 0 },
  { name: "Sextil", angle: 60 },
  { name: "Quadratura", angle: 90 },
  { name: "Trígono", angle: 120 },
  { name: "Oposição", angle: 180 },
];
const PLANETS = ["Sol", "Lua", "Mercúrio", "Vênus", "Marte", "Júpiter", "Saturno", "Urano", "Netuno", "Plutão"];
const NAKSHATRAS = [
  ["Ashwini", "cabeça de cavalo", "Ashwini Kumaras"], ["Bharani", "yoni", "Yama"], ["Krittika", "lâmina ou chama", "Agni"],
  ["Rohini", "carro ou carruagem", "Prajapati"], ["Mrigashira", "cabeça de cervo", "Soma"], ["Ardra", "lágrima", "Rudra"],
  ["Punarvasu", "arco e aljava", "Aditi"], ["Pushya", "úbere ou lótus", "Brihaspati"], ["Ashlesha", "serpente", "Nagas"],
  ["Magha", "trono", "Pitris"], ["Purva Phalguni", "rede ou leito", "Bhaga"], ["Uttara Phalguni", "leito", "Aryaman"],
  ["Hasta", "mão", "Savitar"], ["Chitra", "pérola", "Vishvakarma"], ["Swati", "broto ao vento", "Vayu"],
  ["Vishakha", "arco triunfal", "Indra-Agni"], ["Anuradha", "lótus", "Mitra"], ["Jyeshtha", "brinco circular", "Indra"],
  ["Mula", "raízes", "Nirriti"], ["Purva Ashadha", "leque", "Apas"], ["Uttara Ashadha", "presa de elefante", "Vishvedevas"],
  ["Shravana", "orelha", "Vishnu"], ["Dhanishta", "tambor", "Vasus"], ["Shatabhisha", "círculo vazio", "Varuna"],
  ["Purva Bhadrapada", "espada ou leito", "Aja Ekapada"], ["Uttara Bhadrapada", "serpente das profundezas", "Ahir Budhnya"], ["Revati", "peixe", "Pushan"],
] as const;
const TITHI_NAMES = ["Pratipada", "Dvitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dvadashi", "Trayodashi", "Chaturdashi", "Purnima"];
const TITHI_PURPOSES = [
  "iniciar com presença", "construir vínculos e polaridades", "organizar e dar forma", "remover obstáculos com discernimento", "aprender e movimentar recursos",
  "disciplinar a energia", "afirmar direção e vitalidade", "encarar tensões sem perder o centro", "atravessar intensidade com coragem", "concluir ações com clareza",
  "simplificar e refinar", "nutrir e restaurar", "integrar desejos e limites", "soltar excessos e preparar transições", "reconhecer culminações e iluminar o essencial",
];
const MOVABLE_KARANAS = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"];
const KARANA_FOCUS: Record<string, string> = {
  Kimstughna: "limpar o terreno antes de iniciar", Bava: "dar forma ao primeiro passo", Balava: "fortalecer bases e aprender", Kaulava: "cooperar e ajustar relações", Taitila: "organizar recursos com constância", Gara: "construir e consolidar", Vanija: "negociar e equilibrar trocas", Vishti: "agir com cautela diante de atritos", Shakuni: "observar estratégias antes de agir", Chatushpada: "cuidar do corpo e do essencial", Naga: "encerrar, depurar e soltar",
};
const NITYA_YOGAS = [
  ["Vishkambha", "desafiadora", "reconhecer obstáculos antes de avançar"], ["Priti", "favorável", "cultivar acordos e proximidade"], ["Ayushman", "favorável", "sustentar vitalidade e continuidade"], ["Saubhagya", "favorável", "acolher oportunidades com gratidão"], ["Shobhana", "favorável", "refinar beleza e expressão"], ["Atiganda", "desafiadora", "reduzir pressa e reatividade"], ["Sukarma", "favorável", "agir com integridade e serviço"], ["Dhriti", "favorável", "permanecer firme sem endurecer"], ["Shoola", "desafiadora", "não alimentar conflitos desnecessários"], ["Ganda", "mista", "desatar nós com paciência"], ["Vriddhi", "favorável", "nutrir o que merece crescer"], ["Dhruva", "favorável", "estabelecer bases duradouras"], ["Vyaghata", "desafiadora", "pausar diante de choques e impedimentos"], ["Harshana", "favorável", "abrir espaço para alegria e leveza"], ["Vajra", "mista", "usar firmeza sem agressividade"], ["Siddhi", "favorável", "concluir e materializar"], ["Vyatipata", "desafiadora", "evitar decisões tomadas sob turbulência"], ["Variyan", "favorável", "priorizar excelência sem excesso"], ["Parigha", "desafiadora", "respeitar limites e atrasos"], ["Shiva", "favorável", "pacificar e reorganizar"], ["Siddha", "favorável", "aplicar capacidades já amadurecidas"], ["Sadhya", "favorável", "avançar por etapas possíveis"], ["Shubha", "favorável", "favorecer cooperação e clareza"], ["Shukla", "favorável", "purificar intenção e linguagem"], ["Brahma", "favorável", "criar com consciência"], ["Indra", "favorável", "assumir responsabilidade e direção"], ["Vaidhriti", "desafiadora", "não forçar uniões ou resultados"],
] as const;
const VARAS = [
  ["Ravivāra", "Domingo", "Sol"], ["Somavāra", "Segunda-feira", "Lua"], ["Maṅgalavāra", "Terça-feira", "Marte"], ["Budhavāra", "Quarta-feira", "Mercúrio"], ["Guruvāra", "Quinta-feira", "Júpiter"], ["Śukravāra", "Sexta-feira", "Vênus"], ["Śanivāra", "Sábado", "Saturno"],
] as const;

const PADA_ELEMENTS = ["Fogo", "Terra", "Ar", "Água"] as const;

export interface DailySkyAspect {
  id: string;
  role: "tension" | "conjunction" | "support";
  body1: string;
  aspect: string;
  body2: string;
  orb: number;
  exactTime?: string;
  includesSlowPlanet: boolean;
}

export interface DailySkyPayload {
  date: string;
  timezone: string;
  referenceTime: string;
  tropical: {
    moon: { phase: string; sign: string; degree: number };
    ingresses: Array<{ planet: string; sign: string; time: string }>;
    exactMoonAspects: DailySkyAspect[];
    majorAspects: DailySkyAspect[];
    movementChanges: Array<{ planet: string; movement: string }>;
  };
  vedic: {
    nakshatra: { name: string; symbol: string; deity: string; pada: number; padaElement: string; activeUntil: string; next: string };
    vara: { name: string; weekday: string; ruler: string };
    tithi: { name: string; number: number; paksha: string; purpose: string };
    yoga: { name: string; nature: string; purpose: string };
    karana: { name: string; focus: string };
  };
}

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

function signedDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

function distance(a: number, b: number): number {
  return Math.abs(signedDelta(a, b));
}

function aspectOrb(a: number, b: number, angle: number): number {
  return Math.abs(distance(a, b) - angle);
}

function aspectRole(aspect: string): "tension" | "conjunction" | "support" {
  if (aspect === "Quadratura" || aspect === "Oposição") return "tension";
  if (aspect === "Conjunção") return "conjunction";
  return "support";
}

function aspectId(body1: string, aspect: string, body2: string, time?: string): string {
  return `${body1}-${aspect}-${body2}${time ? `-${time}` : ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function zonedDateTime(date: string, time: string, timezone = TIMEZONE): Date {
  const offset = getTimezoneOffsetHours(timezone, date, time);
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - offset, minute));
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function formatDateTime(date: Date, sourceDate: string): string {
  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const time = formatTime(date);
  return localDate === sourceDate ? time : `${localDate.split("-").reverse().join("/")} ${time}`;
}

function lahiri(year: number): number {
  return 23.853056 + (year - 2000) * 0.0139697;
}

function moonPhase(elongation: number): string {
  const names = ["Lua Nova", "Lua Crescente inicial", "Quarto Crescente", "Lua Gibosa Crescente", "Lua Cheia", "Lua Gibosa Minguante", "Quarto Minguante", "Lua Minguante final"];
  return names[Math.floor(normalize(elongation + 22.5) / 45) % 8];
}

export function tithiFor(elongation: number): { name: string; number: number; paksha: string; purpose: string } {
  const index = Math.floor(normalize(elongation) / 12);
  const halfIndex = index % 15;
  const paksha = index < 15 ? "Shukla Paksha" : "Krishna Paksha";
  const name = halfIndex === 14 && index >= 15 ? "Amavasya" : TITHI_NAMES[halfIndex];
  return { name: `${name} (${paksha})`, number: halfIndex + 1, paksha, purpose: TITHI_PURPOSES[halfIndex] };
}

export function karanaFor(elongation: number): string {
  const position = Math.floor(normalize(elongation) / 6) + 1;
  if (position === 1) return "Kimstughna";
  if (position === 58) return "Shakuni";
  if (position === 59) return "Chatushpada";
  if (position === 60) return "Naga";
  return MOVABLE_KARANAS[(position - 2) % 7];
}

export function padaFor(siderealMoon: number): number {
  return (Math.floor((normalize(siderealMoon) + 1e-9) / (360 / 108)) % 4) + 1;
}

export function nityaYogaFor(siderealSun: number, siderealMoon: number): { name: string; nature: string; purpose: string } {
  const index = Math.floor(normalize(siderealSun + siderealMoon) / NAKSHATRA_SIZE);
  const [name, nature, purpose] = NITYA_YOGAS[index];
  return { name, nature, purpose };
}

export function varaFor(date: Date): { name: string; weekday: string; ruler: string } {
  const localWeekday = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, weekday: "short" }).format(date);
  const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(localWeekday);
  const [name, weekday, ruler] = VARAS[Math.max(0, index)];
  return { name, weekday, ruler };
}

async function findNakshatraEnd(start: Date, currentIndex: number): Promise<Date> {
  let low = start;
  let high = new Date(start.getTime() + 36 * 60 * 60 * 1000);
  for (let cursor = new Date(start.getTime() + 30 * 60 * 1000); cursor <= high; cursor = new Date(cursor.getTime() + 30 * 60 * 1000)) {
    const positions = await getAllPlanetPositions(cursor);
    const siderealMoon = normalize(positions.Lua - lahiri(cursor.getUTCFullYear()));
    if (Math.floor(siderealMoon / NAKSHATRA_SIZE) !== currentIndex) {
      high = cursor;
      low = new Date(cursor.getTime() - 30 * 60 * 1000);
      break;
    }
  }
  for (let i = 0; i < 18; i++) {
    const middle = new Date((low.getTime() + high.getTime()) / 2);
    const positions = await getAllPlanetPositions(middle);
    const index = Math.floor(normalize(positions.Lua - lahiri(middle.getUTCFullYear())) / NAKSHATRA_SIZE);
    if (index === currentIndex) low = middle; else high = middle;
  }
  return high;
}

async function getIngresses(start: Date, end: Date): Promise<Array<{ planet: string; sign: string; time: string }>> {
  const ingressPlanets = PLANETS.filter((planet) => planet !== "Lua");
  const startPositions = await getAllPlanetPositions(start);
  const endPositions = await getAllPlanetPositions(new Date(end.getTime() - 1));
  const results: Array<{ planet: string; sign: string; time: string }> = [];
  for (const planet of ingressPlanets) {
    const fromSign = Math.floor(normalize(startPositions[planet]) / 30);
    const toSign = Math.floor(normalize(endPositions[planet]) / 30);
    if (fromSign === toSign) continue;
    let low = start;
    let high = end;
    for (let i = 0; i < 20; i++) {
      const middle = new Date((low.getTime() + high.getTime()) / 2);
      const positions = await getAllPlanetPositions(middle);
      if (Math.floor(normalize(positions[planet]) / 30) === fromSign) low = middle; else high = middle;
    }
    results.push({ planet, sign: SIGN_NAMES[toSign], time: formatTime(high) });
  }
  return results;
}

async function getExactMoonAspects(start: Date, end: Date): Promise<DailySkyAspect[]> {
  const samples: Array<{ date: Date; positions: Record<string, number> }> = [];
  for (let time = start.getTime(); time <= end.getTime(); time += 30 * 60 * 1000) {
    const date = new Date(time);
    samples.push({ date, positions: await getAllPlanetPositions(date) });
  }
  const results: DailySkyAspect[] = [];
  for (const planet of PLANETS.filter((name) => name !== "Lua")) {
    for (const aspect of ASPECTS) {
      let bestIndex = 0;
      let bestOrb = Number.POSITIVE_INFINITY;
      samples.forEach((sample, index) => {
        const orb = aspectOrb(sample.positions.Lua, sample.positions[planet], aspect.angle);
        if (orb < bestOrb) { bestOrb = orb; bestIndex = index; }
      });
      if (bestOrb <= 0.35 && bestIndex > 0 && bestIndex < samples.length - 1) {
        const exactTime = formatTime(samples[bestIndex].date);
        results.push({ id: aspectId("Lua", aspect.name, planet, exactTime), role: aspectRole(aspect.name), body1: "Lua", aspect: aspect.name, body2: planet, orb: Math.round(bestOrb * 100) / 100, exactTime, includesSlowPlanet: ["Saturno", "Urano", "Netuno", "Plutão"].includes(planet) });
      }
    }
  }
  const priority = { tension: 0, conjunction: 1, support: 2 };
  return results.sort((a, b) => priority[a.role] - priority[b.role] || (a.exactTime || "").localeCompare(b.exactTime || ""));
}

function getMajorAspects(positions: Record<string, number>): DailySkyAspect[] {
  const bodies = PLANETS.filter((name) => name !== "Lua");
  const results: DailySkyAspect[] = [];
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      for (const aspect of ASPECTS.filter((item) => item.name !== "Sextil")) {
        const orb = aspectOrb(positions[bodies[i]], positions[bodies[j]], aspect.angle);
        if (orb <= 2) results.push({ id: aspectId(bodies[i], aspect.name, bodies[j]), role: aspectRole(aspect.name), body1: bodies[i], aspect: aspect.name, body2: bodies[j], orb: Math.round(orb * 100) / 100, includesSlowPlanet: [bodies[i], bodies[j]].some((name) => ["Saturno", "Urano", "Netuno", "Plutão"].includes(name)) });
      }
    }
  }
  return results;
}

async function getMovementChanges(reference: Date): Promise<Array<{ planet: string; movement: string }>> {
  const before = await getAllPlanetPositions(new Date(reference.getTime() - 24 * 60 * 60 * 1000));
  const current = await getAllPlanetPositions(reference);
  const after = await getAllPlanetPositions(new Date(reference.getTime() + 24 * 60 * 60 * 1000));
  return PLANETS.filter((name) => !["Sol", "Lua"].includes(name)).flatMap((planet) => {
    const incoming = signedDelta(before[planet], current[planet]);
    const outgoing = signedDelta(current[planet], after[planet]);
    if (incoming === 0 || outgoing === 0 || Math.sign(incoming) === Math.sign(outgoing)) return [];
    return [{ planet, movement: outgoing < 0 ? "estaciona retrógrado" : "estaciona direto" }];
  });
}

export async function calculateDailySky(date: string): Promise<DailySkyPayload> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T12:00:00Z`).getTime())) throw new Error("Data inválida.");
  const reference = zonedDateTime(date, "08:00");
  const start = zonedDateTime(date, "00:00");
  const end = zonedDateTime(addDays(date, 1), "00:00");
  const positions = await getAllPlanetPositions(reference);
  const elongation = normalize(positions.Lua - positions.Sol);
  const ayanamsha = lahiri(Number(date.slice(0, 4)));
  const siderealMoon = normalize(positions.Lua - ayanamsha);
  const siderealSun = normalize(positions.Sol - ayanamsha);
  const nakshatraIndex = Math.floor(siderealMoon / NAKSHATRA_SIZE);
  const nakshatraEnd = await findNakshatraEnd(reference, nakshatraIndex);
  const [nakshatraName, symbol] = NAKSHATRAS[nakshatraIndex];
  const karanaName = karanaFor(elongation);
  const [ingresses, exactMoonAspects, movementChanges] = await Promise.all([
    getIngresses(start, end), getExactMoonAspects(start, end), getMovementChanges(reference),
  ]);
  return {
    date,
    timezone: TIMEZONE,
    referenceTime: "08:00",
    tropical: {
      moon: { phase: moonPhase(elongation), sign: SIGN_NAMES[Math.floor(normalize(positions.Lua) / 30)], degree: Math.round((normalize(positions.Lua) % 30) * 100) / 100 },
      ingresses,
      exactMoonAspects,
      majorAspects: getMajorAspects(positions),
      movementChanges,
    },
    vedic: {
      nakshatra: { name: nakshatraName, symbol, deity: NAKSHATRAS[nakshatraIndex][2], pada: padaFor(siderealMoon), padaElement: PADA_ELEMENTS[(padaFor(siderealMoon) - 1) % 4], activeUntil: formatDateTime(nakshatraEnd, date), next: NAKSHATRAS[(nakshatraIndex + 1) % 27][0] },
      vara: varaFor(reference),
      tithi: tithiFor(elongation),
      yoga: nityaYogaFor(siderealSun, siderealMoon),
      karana: { name: karanaName, focus: KARANA_FOCUS[karanaName] },
    },
  };
}
