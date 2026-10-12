// Mapeia nomes de planetas, signos, aspectos e rótulos determinísticos
// (que chegam do backend em português) para chaves canônicas usadas
// pelos dicionários de tradução.

const strip = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function planetKey(name: string | undefined | null): string | null {
  if (!name) return null;
  const n = strip(name).replace(/\s+/g, " ");
  const map: Record<string, string> = {
    sol: "sun",
    sun: "sun",
    lua: "moon",
    moon: "moon",
    luna: "moon",
    mercurio: "mercury",
    mercury: "mercury",
    venus: "venus",
    marte: "mars",
    mars: "mars",
    jupiter: "jupiter",
    saturno: "saturn",
    saturn: "saturn",
    urano: "uranus",
    uranus: "uranus",
    netuno: "neptune",
    neptune: "neptune",
    neptuno: "neptune",
    plutao: "pluto",
    pluto: "pluto",
    pluton: "pluto",
    "nodo norte": "northNode",
    "north node": "northNode",
    "nodo sul": "southNode",
    "south node": "southNode",
    rahu: "rahu",
    ketu: "ketu",
  };
  return map[n] ?? null;
}

export function signKey(name: string | undefined | null): string | null {
  if (!name) return null;
  const n = strip(name).replace(/\s+/g, " ");
  const map: Record<string, string> = {
    aries: "aries",
    touro: "taurus",
    taurus: "taurus",
    tauro: "taurus",
    gemeos: "gemini",
    gemini: "gemini",
    geminis: "gemini",
    cancer: "cancer",
    leao: "leo",
    leo: "leo",
    virgem: "virgo",
    virgo: "virgo",
    libra: "libra",
    escorpiao: "scorpio",
    scorpio: "scorpio",
    escorpio: "scorpio",
    escorpion: "scorpio",
    sagitario: "sagittarius",
    sagittarius: "sagittarius",
    capricornio: "capricorn",
    capricorn: "capricorn",
    aquario: "aquarius",
    aquarius: "aquarius",
    acuario: "aquarius",
    peixes: "pisces",
    pisces: "pisces",
    piscis: "pisces",
  };
  return map[n] ?? null;
}

export function aspectKey(name: string | undefined | null): string | null {
  if (!name) return null;
  const n = strip(name).replace(/\s+/g, " ");
  const map: Record<string, string> = {
    conjuncao: "conjunction",
    conjunction: "conjunction",
    conjuncion: "conjunction",
    quadratura: "square",
    square: "square",
    cuadratura: "square",
    oposicao: "opposition",
    opposition: "opposition",
    oposicion: "opposition",
    trigono: "trine",
    trine: "trine",
    sextil: "sextile",
    sextile: "sextile",
  };
  return map[n] ?? null;
}

/** "Quadratura com Marte Natal" → { aspect: "square", natalPlanet: "mars" } */
export function parseAspectToNatal(aspectToNatal: string | undefined | null): {
  aspect: string | null;
  natalPlanet: string | null;
} {
  if (!aspectToNatal) return { aspect: null, natalPlanet: null };
  const m = aspectToNatal.match(/^(.+?)\s+com\s+(.+?)\s+Natal$/i) ||
            aspectToNatal.match(/^(.+?)\s+(?:with|con)\s+(?:natal\s+)?(.+?)$/i);
  if (!m) return { aspect: null, natalPlanet: null };
  return { aspect: aspectKey(m[1]), natalPlanet: planetKey(m[2]) };
}

export type NatureKey = "favorable" | "restrictive" | "neutral";

export function natureKey(label: string | undefined | null): NatureKey {
  const n = strip(label || "");
  if (n.includes("favor")) return "favorable";
  if (n.includes("restrit") || n.includes("restrict")) return "restrictive";
  return "neutral";
}

/** "Domicílio em Leão" → { key: "domicile", sign: "leo" } */
export function dignityInfo(label: string | undefined | null): {
  key: string;
  sign: string | null;
} {
  const n = strip(label || "");
  const parts = n.split(/\s+em\s+|\s+in\s+|\s+en\s+/);
  const head = parts[0] || "";
  const sign = parts.length > 1 ? signKey(parts[1]) : null;
  let key = "peregrine";
  if (head.startsWith("domic")) key = "domicile";
  else if (head.startsWith("exalt")) key = "exaltation";
  else if (head.startsWith("queda") || head.startsWith("detriment") || head.startsWith("caida"))
    key = "detriment";
  else if (head.startsWith("exilio") || head.startsWith("exile") || head.startsWith("fall"))
    key = "fall";
  return { key, sign };
}

export function dignityShortKey(short: string | undefined | null): string {
  const n = strip(short || "");
  if (n.startsWith("domic")) return "domicile";
  if (n.startsWith("exalt")) return "exaltation";
  if (n.startsWith("queda") || n.startsWith("detriment") || n.startsWith("caida")) return "detriment";
  if (n.startsWith("exilio") || n.startsWith("exile") || n.startsWith("fall")) return "fall";
  return "peregrine";
}

export function houseClassKey(label: string | undefined | null): string {
  const n = strip(label || "");
  const map: Record<string, string> = {
    sustentacao: "sustentacao",
    sustentacion: "sustentacao",
    sustenance: "sustentacao",
    fluxo: "fluxo",
    flujo: "fluxo",
    flow: "fluxo",
    desafios: "desafios",
    desafios2: "desafios",
    desafio: "desafios",
    desafios_: "desafios",
    desafío: "desafios",
    challenges: "desafios",
    crescimento: "crescimento",
    crecimiento: "crescimento",
    growth: "crescimento",
    trocas: "trocas",
    intercambios: "trocas",
    exchanges: "trocas",
    neutro: "neutro",
    neutral: "neutro",
    neutra: "neutro",
  };
  return map[n] ?? "neutro";
}

/** "Kendra (ângulo de manifestação)" → "kendra" */
export function houseTypeKey(houseType: string | undefined | null): string {
  const n = strip(houseType || "");
  const head = n.split("(")[0].trim();
  const map: Record<string, string> = {
    kendra: "kendra",
    trikona: "trikona",
    dusthana: "dusthana",
    upachaya: "upachaya",
    maraka: "maraka",
    neutra: "neutra",
    neutral: "neutra",
  };
  return map[head] ?? "neutra";
}

export const ASPECT_GLYPHS: Record<string, string> = {
  conjunction: "☌",
  square: "□",
  opposition: "☍",
  trine: "△",
  sextile: "⚹",
};

/** Chave canônica do ciclo reestruturante a partir do nome em PT vindo do backend. */
export function restructuringCycleKey(cycleName: string | undefined | null): string | null {
  const n = strip(cycleName || "");
  const map: [RegExp, string][] = [
    [/^retorno de saturno|^saturn return/, "saturnReturn"],
    [/^quadratura de saturno|^saturn square|^cuadratura de saturno/, "saturnSquare"],
    [/^oposicao de saturno|^saturn opposition|^oposicion de saturno/, "saturnOpposition"],
    [/^quadratura de urano|^uranus square|^cuadratura de urano/, "uranusSquare"],
    [/^oposicao de urano|^uranus opposition|^oposicion de urano/, "uranusOpposition"],
    [/^retorno de urano|^uranus return/, "uranusReturn"],
    [/^quadratura de netuno|^neptune square|^cuadratura de neptuno/, "neptuneSquare"],
    [/^quadratura de plutao|^pluto square|^cuadratura de pluton/, "plutoSquare"],
    [/^retorno nodal|^nodal return/, "nodalReturn"],
    [/^oposicao nodal|^nodal opposition|^oposicion nodal/, "nodalOpposition"],
    [/sade sati.*(ascendente|ascending|ascendant|rising)/, "sadeSatiRising"],
    [/sade sati.*(pico|peak)/, "sadeSatiPeak"],
    [/sade sati.*(descida|descent|descenso)/, "sadeSatiDescent"],
    [/ardha.?ashtama/, "ardhaAshtamaMoon"],
    [/ashtama.*lua|ashtama.*moon|ashtama.*luna/, "ashtamaMoon"],
    [/kantaka.*ascendente|kantaka.*ascendant/, "kantakaAscendant"],
    [/ashtama.*ascendente|ashtama.*ascendant/, "ashtamaAscendant"],
  ];
  for (const [re, key] of map) {
    if (re.test(n)) return key;
  }
  return null;
}

/** Chave canônica da seção de Dasha a partir do título normalizado. */
export function dashaSectionKey(normalizedTitle: string): string | null {
  const map: Record<string, string> = {
    introducao: "intro",
    introduction: "intro",
    introduccion: "intro",
    "sua fase atual": "phase",
    "your current phase": "phase",
    "tu fase actual": "phase",
    "o grande oceano": "ocean",
    "the great ocean": "ocean",
    "el gran oceano": "ocean",
    "a correnteza": "current",
    "the current": "current",
    "la corriente": "current",
    "a onda": "wave",
    "the wave": "wave",
    "la ola": "wave",
    "o desafio": "challenge",
    "the challenge": "challenge",
    "el desafio": "challenge",
    "a sintese": "synthesis",
    "the synthesis": "synthesis",
    "la sintesis": "synthesis",
  };
  return map[normalizedTitle] ?? null;
}
