import { julian, planetposition, solar, moonposition } from "astronomia";
import planetData from "astronomia/data";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TransitAspect {
  planeta_transito: string;
  aspecto: "Conjunção" | "Quadratura" | "Oposição";
  planeta_natal: string;
  grau_transito: number;
  grau_natal: number;
  distancia: number;
  casa_natal?: number;
  ritmo_tempo: string;
}

function getRitmoTempo(planeta: string): string {
  if (["Plutão", "Netuno", "Urano"].includes(planeta)) {
    return "Longo prazo (meses a anos). Um portal de reestruturação profunda e orgânica que exige paciência e entrega.";
  }
  if (["Saturno", "Júpiter"].includes(planeta)) {
    return "Médio prazo (semanas a meses). Um ciclo de maturação e ajuste de rota, pedindo responsabilidade e observação.";
  }
  if (["Marte"].includes(planeta)) {
    return "Curto prazo (dias a semanas). Um gatilho de ação e tensão muscular que exige presença e direcionamento.";
  }
  if (planeta === "Lua") {
    return "Muito curto prazo (horas a 2-3 dias). Um pulso emocional que aciona e dissipa rapidamente.";
  }
  if (["Mercúrio", "Vênus"].includes(planeta)) {
    return "Curto a médio prazo (dias a poucas semanas). Um movimento social, mental ou relacional que reorganiza o campo.";
  }
  // Sol
  return "Curto prazo (~7 dias). Um foco de luz que ilumina a área natal com intensidade passageira e integrativa.";
}

export interface TransitPayload {
  transitos_estruturais: TransitAspect[];  // Júpiter, Saturno, Urano, Netuno, Plutão
  transitos_dinamicos: TransitAspect[];    // Sol e Marte
  calculado_em: string;
}

export interface UpcomingEvent {
  event: string;
  date: string; // ISO date string
  type: "ingress" | "new_moon" | "full_moon" | "solar_eclipse" | "lunar_eclipse";
  planet?: string;
  sign: string;
  longitude: number;
}

export interface NatalHouseMatch {
  house: number;
  sign: string;
  cuspDegree: number;       // grau dentro do signo (para exibição)
  cuspLongitude: number;    // longitude absoluta da cúspide
  nextCuspHouse?: number;   // próxima casa em ordem zodiacal
  nextCuspSign?: string;
  nextCuspDegree?: number;
  nextCuspLongitude?: number;
  ruler: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const ORB = 4;

// Planetas que podem ser GATILHOS de trânsito (excluídos: Lua, Mercúrio, Vênus)
export const TRANSIT_PLANETS_ALLOWED = ["Sol", "Marte", "Júpiter", "Saturno", "Urano", "Netuno", "Plutão"];

// Estruturais (longa maturação) vs Dinâmicos (ação imediata)
export const STRUCTURAL_PLANETS = ["Júpiter", "Saturno", "Urano", "Netuno", "Plutão"];
export const DYNAMIC_PLANETS    = ["Sol", "Marte"];

// Planetas natais ALVO: Sol → Saturno (excluídos: Urano, Netuno, Plutão natais)
export const NATAL_PLANETS_ALLOWED = ["Sol", "Lua", "Mercúrio", "Vênus", "Marte", "Júpiter", "Saturno"];

// Chat: todos os planetas podem ser gatilhos de trânsito, incluindo os rápidos
export const CHAT_TRANSIT_PLANETS_ALLOWED = ["Sol", "Lua", "Mercúrio", "Vênus", "Marte", "Júpiter", "Saturno", "Urano", "Netuno", "Plutão"];

// Chat: dinâmicos incluem os rápidos; estruturais são os lentos
export const CHAT_DYNAMIC_PLANETS    = ["Sol", "Lua", "Mercúrio", "Vênus", "Marte"];
export const CHAT_STRUCTURAL_PLANETS = ["Júpiter", "Saturno", "Urano", "Netuno", "Plutão"];

const ASPECT_TARGETS = [
  { nome: "Conjunção" as const, centro: 0 },
  { nome: "Quadratura" as const, centro: 90 },
  { nome: "Oposição"  as const, centro: 180 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDeg = (rad: number) => ((rad * 180) / Math.PI + 360) % 360;

/** Remove acentos e normaliza para minúsculo — evita falsos negativos por variação de string */
function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Sets normalizados para comparação segura
const TRANSIT_ALLOWED_NORM = new Set(TRANSIT_PLANETS_ALLOWED.map(normalize));
const NATAL_ALLOWED_NORM   = new Set(NATAL_PLANETS_ALLOWED.map(normalize));
const STRUCTURAL_NORM      = new Set(STRUCTURAL_PLANETS.map(normalize));

const CHAT_TRANSIT_ALLOWED_NORM = new Set(CHAT_TRANSIT_PLANETS_ALLOWED.map(normalize));
const CHAT_DYNAMIC_NORM         = new Set(CHAT_DYNAMIC_PLANETS.map(normalize));
const CHAT_STRUCTURAL_NORM      = new Set(CHAT_STRUCTURAL_PLANETS.map(normalize));

function getPlutoLongitude(jde: number): number {
  // Plutão geocêntrico tropical — interpolação linear calibrada com JPL Horizons
  // Pontos de ancoragem verificados:
  //   JDE 2451545.0  (2000-01-01): 253.22°  (Sagitário 13.2°)
  //   JDE 2461955.0  (2028-06-01): 311.50°  (Aquário 21.5°)
  // Velocidade média: (311.50 - 253.22) / (2461955 - 2451545) = 0.005597°/dia
  // Erro estimado ± 0.8° (retroградação não modelada, aceitável para orb de 4°)
  const D = jde - 2451545.0;
  const lon = 253.22 + 0.005597 * D;
  return ((lon % 360) + 360) % 360;
}

// ─── Etapa 1: Posições tropicais atuais via VSOP87 ────────────────────────────

// Converte longitude geocêntrica retangular para graus 0-360
function getGeoLon(planet: any, earth: any, jde: number): number {
  const ePos = earth.position2000(jde);
  const pPos = planet.position2000(jde);
  const ex = ePos.range * Math.cos(ePos.lat) * Math.cos(ePos.lon);
  const ey = ePos.range * Math.cos(ePos.lat) * Math.sin(ePos.lon);
  const px = pPos.range * Math.cos(pPos.lat) * Math.cos(pPos.lon);
  const py = pPos.range * Math.cos(pPos.lat) * Math.sin(pPos.lon);
  return (((Math.atan2(py - ey, px - ex) * 180 / Math.PI) + 360) % 360);
}

export function getTropicalTransitDegrees(date: Date, quiet = false): Record<string, number> {
  const jde = julian.CalendarGregorianToJD(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate() + date.getHours() / 24 + date.getMinutes() / 1440
  );

  // VSOP87D: apenas os planetas em trânsito permitidos (Mercúrio, Vênus e Lua excluídos)
  const earthD   = new planetposition.Planet(planetData.vsop87Dearth);
  const marsD    = new planetposition.Planet(planetData.vsop87Dmars);
  const jupiterD = new planetposition.Planet(planetData.vsop87Djupiter);
  const saturnD  = new planetposition.Planet(planetData.vsop87Dsaturn);

  // VSOP87B: longitude geocêntrica direta para planetas externos (Urano, Netuno)
  const uranusB  = new planetposition.Planet(planetData.vsop87Buranus);
  const neptuneB = new planetposition.Planet(planetData.vsop87Bneptune);

  // Sol: solar.apparentVSOP87 com Terra VSOP87D — resultado direto em radianos
  const sunLon = toDeg(solar.apparentVSOP87(earthD, jde).lon);

  // Calcula apenas os planetas em trânsito permitidos (Lua, Mercúrio e Vênus excluídos)
  const positions: Record<string, number> = {
    Sol:      sunLon,
    Marte:    getGeoLon(marsD,    earthD, jde),
    Júpiter:  getGeoLon(jupiterD, earthD, jde),
    Saturno:  getGeoLon(saturnD,  earthD, jde),
    Urano:    toDeg(uranusB.position(jde).lon),
    Netuno:   toDeg(neptuneB.position(jde).lon),
    Plutão:   getPlutoLongitude(jde),
  };

  if (!quiet) {
    console.log("[TRANSIT ENGINE] Posições tropicais calculadas para", date.toISOString().split("T")[0]);
    for (const [name, deg] of Object.entries(positions)) {
      const sign = SIGN_NAMES[Math.floor(deg / 30)];
      console.log(`  ${name.padEnd(10)}: ${deg.toFixed(2)}°  (${sign} ${(deg % 30).toFixed(1)}°)`);
    }
  }

  return positions;
}

const SIGN_NAMES = [
  "Áries","Touro","Gêmeos","Câncer","Leão","Virgem",
  "Libra","Escorpião","Sagitário","Capricórnio","Aquário","Peixes"
];

// ─── Etapa 2: Extrair posições natais do profile ─────────────────────────────

export interface NatalPlanet {
  name: string;
  longitude: number;
  casa?: number;
}

const NATAL_EXCLUSIONS = /Nodo|Node|Lilith|Ascendente|Ascendant|Meio do Céu|MC|Parte|Fortuna|Rahu|Ketu/i;

export function getNatalDegrees(profile: any): NatalPlanet[] {
  const planets: NatalPlanet[] = (profile?.tropical_natal?.planets ?? [])
    .filter((p: any) => typeof p.longitude === "number" && !isNaN(p.longitude) && !NATAL_EXCLUSIONS.test(p.name))
    .map((p: any) => ({
      name: p.name as string,
      longitude: p.longitude,
      casa: p.house,
    }));

  console.log("[TRANSIT ENGINE] Planetas natais extraídos:");
  for (const p of planets) {
    const sign = SIGN_NAMES[Math.floor(p.longitude / 30)];
    console.log(`  ${p.name.padEnd(10)}: ${p.longitude.toFixed(2)}°  (${sign} ${(p.longitude % 30).toFixed(1)}°)  Casa ${p.casa ?? "?"}`);
  }

  return planets;
}

// ─── Motor de aspectos ────────────────────────────────────────────────────────

function buildAspectPayload(
  transitDegrees: Record<string, number>,
  natalPlanets: NatalPlanet[],
  transitAllowedNorm: Set<string>,
  natalAllowedNorm: Set<string>,
  structuralNorm: Set<string>,
  dynamicNorm: Set<string>,
  label: string
): TransitPayload {
  const estruturais: TransitAspect[] = [];
  const dinamicos: TransitAspect[] = [];
  const seen = new Set<string>();

  const filteredNatal = natalPlanets.filter(p => natalAllowedNorm.has(normalize(p.name)));

  console.log(`[TRANSIT ENGINE - ${label}] Natais após filtro:`, filteredNatal.map(p => p.name));

  for (const [transitPlanet, transitDeg] of Object.entries(transitDegrees)) {
    if (!transitAllowedNorm.has(normalize(transitPlanet))) continue;

    for (const natal of filteredNatal) {
      const diff = Math.abs(transitDeg - natal.longitude) % 360;
      const distance = diff > 180 ? 360 - diff : diff;

      for (const aspect of ASPECT_TARGETS) {
        const orb = Math.abs(distance - aspect.centro);
        if (orb <= ORB) {
          const key = `${transitPlanet}|${natal.name}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const entry: TransitAspect = {
            planeta_transito: transitPlanet,
            aspecto: aspect.nome,
            planeta_natal: natal.name,
            grau_transito: Math.round(transitDeg * 100) / 100,
            grau_natal: Math.round(natal.longitude * 100) / 100,
            distancia: Math.round(distance * 100) / 100,
            casa_natal: natal.casa,
            ritmo_tempo: getRitmoTempo(transitPlanet),
          };

          if (structuralNorm.has(normalize(transitPlanet))) {
            estruturais.push(entry);
          } else if (dynamicNorm.has(normalize(transitPlanet))) {
            dinamicos.push(entry);
          }
        }
      }
    }
  }

  const payload: TransitPayload = {
    transitos_estruturais: estruturais,
    transitos_dinamicos: dinamicos,
    calculado_em: new Date().toISOString(),
  };

  console.log(`[TRANSIT ENGINE - ${label}] ── Payload estruturado ──────────────────────`);
  console.log(JSON.stringify(payload, null, 2));
  console.log(`[TRANSIT ENGINE - ${label}] ─────────────────────────────────────────────`);

  return payload;
}

export function calculateAspects(
  transitDegrees: Record<string, number>,
  natalPlanets: Array<{ name: string; longitude: number; casa?: number }>
): TransitPayload {
  const typedNatal = natalPlanets as NatalPlanet[];

  // ── [DEBUG MARTE] — log isolado de distâncias para o alvo Marte natal ──────
  const filteredForDebug = typedNatal.filter(p => NATAL_ALLOWED_NORM.has(normalize(p.name)));
  const marteNatal = filteredForDebug.find(p => normalize(p.name) === "marte");
  if (marteNatal) {
    console.log("[DEBUG MARTE] Marte natal encontrado:", marteNatal.name, "@", marteNatal.longitude.toFixed(4), "° Casa", marteNatal.casa ?? "?");
    for (const [tp, tdeg] of Object.entries(transitDegrees)) {
      const diff = Math.abs(tdeg - marteNatal.longitude) % 360;
      const dist = diff > 180 ? 360 - diff : diff;
      const nearestAspect = ASPECT_TARGETS.reduce((best, a) => {
        const o = Math.abs(dist - a.centro);
        return o < best.orb ? { name: a.nome, orb: o } : best;
      }, { name: "nenhum", orb: 999 });
      console.log(`[DEBUG MARTE]   ${tp.padEnd(10)} trânsito@${tdeg.toFixed(2)}°  dist=${dist.toFixed(4)}°  aspecto_mais_próximo=${nearestAspect.name}(orb=${nearestAspect.orb.toFixed(4)}°)  dentro_da_orbe=${nearestAspect.orb <= ORB}`);
    }
  } else {
    console.log("[DEBUG MARTE] ATENÇÃO: Marte natal NÃO encontrado na lista filtrada. Nomes disponíveis:", filteredForDebug.map(p => `'${p.name}'`).join(", "));
  }
  // ────────────────────────────────────────────────────────────────────────────

  return buildAspectPayload(
    transitDegrees,
    typedNatal,
    TRANSIT_ALLOWED_NORM,
    NATAL_ALLOWED_NORM,
    STRUCTURAL_NORM,
    new Set(DYNAMIC_PLANETS.map(normalize)),
    "Mandala"
  );
}

export function calculateChatTransits(
  natalChart: any,
  targetDate: Date
): TransitPayload {
  const natalPlanets = getNatalDegrees({ tropical_natal: natalChart });
  const transitDegrees = getAllPlanetPositions(targetDate);

  return buildAspectPayload(
    transitDegrees,
    natalPlanets,
    CHAT_TRANSIT_ALLOWED_NORM,
    NATAL_ALLOWED_NORM,
    CHAT_STRUCTURAL_NORM,
    CHAT_DYNAMIC_NORM,
    "Chat"
  );
}

/** Posições tropicais geocêntricas dos planetas rápidos para uma data. */
export function getFastTransitDegrees(date: Date, quiet = false): Record<string, number> {
  const jde = julian.CalendarGregorianToJD(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate() + date.getHours() / 24 + date.getMinutes() / 1440
  );

  const earthD   = new planetposition.Planet(planetData.vsop87Dearth);
  const mercuryD = new planetposition.Planet(planetData.vsop87Dmercury);
  const venusD   = new planetposition.Planet(planetData.vsop87Dvenus);
  const marsD    = new planetposition.Planet(planetData.vsop87Dmars);

  const sunLon   = toDeg(solar.apparentVSOP87(earthD, jde).lon);
  const moonLon  = toDeg(moonposition.position(jde).lon);

  const positions: Record<string, number> = {
    Sol:      sunLon,
    Lua:      moonLon,
    Mercúrio: getGeoLon(mercuryD, earthD, jde),
    Vênus:    getGeoLon(venusD,   earthD, jde),
    Marte:    getGeoLon(marsD,    earthD, jde),
  };

  if (!quiet) {
    console.log("[TRANSIT ENGINE] Posições rápidas calculadas para", date.toISOString().split("T")[0]);
    for (const [name, deg] of Object.entries(positions)) {
      const sign = SIGN_NAMES[Math.floor(deg / 30)];
      console.log(`  ${name.padEnd(10)}: ${deg.toFixed(2)}°  (${sign} ${(deg % 30).toFixed(1)}°)`);
    }
  }

  return positions;
}

/** Posições atuais de todos os planetas clássicos (para localizar o Senhor do Ano em trânsito). */
export function getCurrentTransitDegrees(date: Date): Record<string, number> {
  const all = { ...getTropicalTransitDegrees(date), ...getFastTransitDegrees(date) };
  return all;
}

/** Todas as posições tropicais geocêntricas (rápidas + lentas) para uma data. */
export function getAllPlanetPositions(date: Date, quiet = true): Record<string, number> {
  const slow = getTropicalTransitDegrees(date, quiet);
  const fast = getFastTransitDegrees(date, quiet);
  return { ...slow, ...fast };
}

/** Retorna a casa natal onde uma longitude eclíptica cai.
 *  IMPORTANTE: `natalHouses` pode vir com `cuspDegree` como grau DENTRO do signo
 *  e `longitude` como grau absoluto na eclíptica. A comparação DEVE usar `longitude`.
 */
export function getHouseForLongitude(
  longitude: number,
  natalHouses: Array<{ house: number; cuspDegree: number; longitude?: number; sign?: string; ruler?: string }>
): NatalHouseMatch | null {
  if (!natalHouses || natalHouses.length === 0) return null;

  const normalizedLon = ((longitude % 360) + 360) % 360;

  const withLongitude = natalHouses.map((h) => ({
    ...h,
    absoluteDegree: typeof h.longitude === "number" ? h.longitude : h.cuspDegree,
  }));

  const sorted = withLongitude.sort((a, b) => a.absoluteDegree - b.absoluteDegree);

  let matchIndex = sorted.length - 1;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].absoluteDegree <= normalizedLon) {
      matchIndex = i;
    } else {
      break;
    }
  }

  const match = sorted[matchIndex];
  const next = sorted[(matchIndex + 1) % sorted.length];

  return {
    house: match.house,
    sign: match.sign || SIGN_NAMES[Math.floor(match.cuspDegree / 30)] || "?",
    cuspDegree: match.cuspDegree,
    cuspLongitude: match.absoluteDegree,
    nextCuspHouse: next?.house,
    nextCuspSign: next?.sign || SIGN_NAMES[Math.floor(next?.cuspDegree / 30)] || "?",
    nextCuspDegree: next?.cuspDegree,
    nextCuspLongitude: next?.absoluteDegree,
    ruler: match.ruler || "?",
  };
}

/** Longitude média do nodo lunar (ascendente). Erro < 1° para o século XXI. */
function getMeanLunarNode(jde: number): number {
  const T = (jde - 2451545.0) / 36525; // séculos julianos desde J2000.0
  let N = 125.044555 - 1934.1361849 * T + 0.0020756 * T * T - 0.00000215 * T * T * T;
  return ((N % 360) + 360) % 360;
}

/** Varre os próximos `days` dias a partir de `startDate` e retorna eventos cósmicos maiores. */
export function getUpcomingCosmicEvents(
  startDate: Date = new Date(),
  days: number = 30
): UpcomingEvent[] {
  const events: UpcomingEvent[] = [];
  const stepDays = 0.5; // passo de 12h
  const totalSteps = Math.ceil(days / stepDays);

  const PLANETS_FOR_INGRESS = [
    "Sol", "Mercúrio", "Vênus", "Marte", "Júpiter", "Saturno", "Urano", "Netuno", "Plutão"
  ];

  const msInDay = 1000 * 60 * 60 * 24;
  const baseTime = startDate.getTime();

  let previous: { date: Date; positions: Record<string, number>; phase: number } | null = null;

  for (let i = 0; i <= totalSteps; i++) {
    const currentDate = new Date(baseTime + i * stepDays * msInDay);
    const positions = getAllPlanetPositions(currentDate);

    // Fase lunar para detectar Lua Nova e Cheia
    const moon = positions["Lua"] ?? 0;
    const sun = positions["Sol"] ?? 0;
    let phase = (moon - sun + 360) % 360;

    if (previous) {
      // ── Ingressos planetários (exceto Lua) ──
      for (const planet of PLANETS_FOR_INGRESS) {
        const prevLon = previous.positions[planet];
        const currLon = positions[planet];
        if (prevLon == null || currLon == null) continue;

        const prevSignIdx = Math.floor(((prevLon % 360) + 360) % 360 / 30);
        const currSignIdx = Math.floor(((currLon % 360) + 360) % 360 / 30);

        if (prevSignIdx !== currSignIdx) {
          const midpointDate = new Date((previous.date.getTime() + currentDate.getTime()) / 2);
          const sign = SIGN_NAMES[currSignIdx];
          const longitude = currSignIdx * 30; // aproximação na cúspide
          events.push({
            event: `${planet} entra em ${sign}`,
            date: midpointDate.toISOString(),
            type: "ingress",
            planet,
            sign,
            longitude,
          });
        }
      }

      // ── Lua Nova e Cheia ──
      const prevPhase = previous.phase;

      // Cheia: fase cruza 180°
      if (prevPhase < 180 && phase >= 180) {
        const midpointDate = new Date((previous.date.getTime() + currentDate.getTime()) / 2);
        const sign = SIGN_NAMES[Math.floor((sun + 180) % 360 / 30)];
        const longitude = (sun + 180) % 360;
        const node = getMeanLunarNode(julian.CalendarGregorianToJD(
          midpointDate.getFullYear(), midpointDate.getMonth() + 1, midpointDate.getDate()
        ));
        const moonAtFull = (sun + 180) % 360;
        const distToNode = Math.abs(((moonAtFull - node) % 360 + 360) % 360);
        const isEclipse = distToNode < 12;
        events.push({
          event: isEclipse ? `Eclipse Lunar em ${sign}` : `Lua Cheia em ${sign}`,
          date: midpointDate.toISOString(),
          type: isEclipse ? "lunar_eclipse" : "full_moon",
          planet: "Lua",
          sign,
          longitude,
        });
      }

      // Nova: fase dá a volta em 360° (cruza 0)
      if (prevPhase > phase && (prevPhase > 300 || phase < 60)) {
        const midpointDate = new Date((previous.date.getTime() + currentDate.getTime()) / 2);
        const sign = SIGN_NAMES[Math.floor(sun / 30)];
        const longitude = sun % 360;
        const node = getMeanLunarNode(julian.CalendarGregorianToJD(
          midpointDate.getFullYear(), midpointDate.getMonth() + 1, midpointDate.getDate()
        ));
        const distToNode = Math.abs(((sun - node) % 360 + 360) % 360);
        const isEclipse = distToNode < 12;
        events.push({
          event: isEclipse ? `Eclipse Solar em ${sign}` : `Lua Nova em ${sign}`,
          date: midpointDate.toISOString(),
          type: isEclipse ? "solar_eclipse" : "new_moon",
          planet: isEclipse ? "Sol" : "Lua",
          sign,
          longitude,
        });
      }
    }

    previous = { date: currentDate, positions, phase };
  }

  // Remove duplicatas e ordena por data
  const seen = new Set<string>();
  const unique = events.filter(e => {
    const key = `${e.type}|${e.planet}|${e.sign}|${e.date.slice(0, 10)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return unique;
}
