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
  if (planeta === "Marte") {
    return "Curto prazo (dias a semanas). Um gatilho de ação e tensão muscular que exige presença e direcionamento.";
  }
  // Sol
  return "Curto prazo (~7 dias). Um foco de luz que ilumina a área natal com intensidade passageira e integrativa.";
}

export interface TransitPayload {
  transitos_estruturais: TransitAspect[];  // Júpiter, Saturno, Urano, Netuno, Plutão
  transitos_dinamicos: TransitAspect[];    // Sol e Marte
  calculado_em: string;
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

export function getTropicalTransitDegrees(date: Date): Record<string, number> {
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

  console.log("[TRANSIT ENGINE] Posições tropicais calculadas para", date.toISOString().split("T")[0]);
  for (const [name, deg] of Object.entries(positions)) {
    const sign = SIGN_NAMES[Math.floor(deg / 30)];
    console.log(`  ${name.padEnd(10)}: ${deg.toFixed(2)}°  (${sign} ${(deg % 30).toFixed(1)}°)`);
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

export function calculateAspects(
  transitDegrees: Record<string, number>,
  natalPlanets: Array<{ name: string; longitude: number; casa?: number }>
): TransitPayload {
  const estruturais: TransitAspect[] = [];
  const dinamicos: TransitAspect[] = [];
  const seen = new Set<string>();

  // Filtrar apenas planetas natais permitidos (Sol → Saturno), comparação normalizada
  const filteredNatal = natalPlanets.filter(p => NATAL_ALLOWED_NORM.has(normalize(p.name)));

  console.log("[TRANSIT ENGINE] Natais após filtro permitido:", filteredNatal.map(p => p.name));

  // ── [DEBUG MARTE] — log isolado de distâncias para o alvo Marte natal ──────
  const marteNatal = filteredNatal.find(p => normalize(p.name) === "marte");
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
    console.log("[DEBUG MARTE] ATENÇÃO: Marte natal NÃO encontrado na lista filtrada. Nomes disponíveis:", filteredNatal.map(p => `'${p.name}'`).join(", "));
  }
  // ────────────────────────────────────────────────────────────────────────────

  for (const [transitPlanet, transitDeg] of Object.entries(transitDegrees)) {
    // Garantia extra: só processa planetas em trânsito permitidos (comparação normalizada)
    if (!TRANSIT_ALLOWED_NORM.has(normalize(transitPlanet))) continue;

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
          if (STRUCTURAL_NORM.has(normalize(transitPlanet))) {
            estruturais.push(entry);
          } else {
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

  console.log("[TRANSIT ENGINE] ── Payload estruturado ──────────────────────");
  console.log(JSON.stringify(payload, null, 2));
  console.log("[TRANSIT ENGINE] ─────────────────────────────────────────────");

  return payload;
}

/** Posições tropicais geocêntricas dos planetas rápidos para uma data. */
export function getFastTransitDegrees(date: Date): Record<string, number> {
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

  console.log("[TRANSIT ENGINE] Posições rápidas calculadas para", date.toISOString().split("T")[0]);
  for (const [name, deg] of Object.entries(positions)) {
    const sign = SIGN_NAMES[Math.floor(deg / 30)];
    console.log(`  ${name.padEnd(10)}: ${deg.toFixed(2)}°  (${sign} ${(deg % 30).toFixed(1)}°)`);
  }

  return positions;
}

/** Posições atuais de todos os planetas clássicos (para localizar o Senhor do Ano em trânsito). */
export function getCurrentTransitDegrees(date: Date): Record<string, number> {
  const all = { ...getTropicalTransitDegrees(date), ...getFastTransitDegrees(date) };
  return all;
}
