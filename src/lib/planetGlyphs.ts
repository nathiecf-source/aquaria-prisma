// Definição compartilhada (frontend + backend) da Régua de Glifos Astrológicos do mapa tropical.
// "canonicalName" deve corresponder exatamente ao "name" usado em profile.tropical_natal.planets
// (ver translatePlanetName em src/server/astrology.ts). ASC e MC não são entradas de "planets";
// eles são resolvidos a partir das cúspides das Casas 1 e 10 (profile.tropical_natal.houses).

export interface PlanetGlyphConfig {
  id: string;
  canonicalName: string;
  label: string;
  glyph: string;
  isFree: boolean;
  isAngle?: boolean; // true para ASC/MC — sem lista de aspectos
}

export const PLANET_GLYPHS: PlanetGlyphConfig[] = [
  { id: "sol", canonicalName: "Sol", label: "Sol", glyph: "☉", isFree: true },
  { id: "lua", canonicalName: "Lua", label: "Lua", glyph: "☽", isFree: true },
  { id: "mercurio", canonicalName: "Mercúrio", label: "Mercúrio", glyph: "☿", isFree: true },
  { id: "venus", canonicalName: "Vênus", label: "Vênus", glyph: "♀", isFree: false },
  { id: "marte", canonicalName: "Marte", label: "Marte", glyph: "♂", isFree: false },
  { id: "jupiter", canonicalName: "Júpiter", label: "Júpiter", glyph: "♃", isFree: false },
  { id: "saturno", canonicalName: "Saturno", label: "Saturno", glyph: "♄", isFree: false },
  { id: "urano", canonicalName: "Urano", label: "Urano", glyph: "♅", isFree: false },
  { id: "netuno", canonicalName: "Netuno", label: "Netuno", glyph: "♆", isFree: false },
  { id: "plutao", canonicalName: "Plutão", label: "Plutão", glyph: "♇", isFree: false },
  { id: "nodo-norte", canonicalName: "Nodo Norte", label: "Nodo Norte", glyph: "☊", isFree: false },
  { id: "nodo-sul", canonicalName: "Nodo Sul", label: "Nodo Sul", glyph: "☋", isFree: false },
  { id: "quiron", canonicalName: "Quíron", label: "Quíron", glyph: "⚷", isFree: false },
  { id: "lilith", canonicalName: "Lilith", label: "Lilith", glyph: "⚸", isFree: false },
  { id: "roda-da-fortuna", canonicalName: "Roda da Fortuna", label: "Roda da Fortuna", glyph: "⊗", isFree: false },
  { id: "asc", canonicalName: "Ascendente", label: "ASC", glyph: "ASC", isFree: true, isAngle: true },
  { id: "mc", canonicalName: "Meio do Céu", label: "MC", glyph: "MC", isFree: false, isAngle: true },
];

export const ASPECT_GLYPHS: Record<string, string> = {
  "Conjunção": "☌",
  "Oposição": "☍",
  "Trígono": "📐",
  "Quadratura": "▢",
};

export function getPlanetGlyphConfig(id: string): PlanetGlyphConfig | undefined {
  return PLANET_GLYPHS.find(p => p.id === id);
}
