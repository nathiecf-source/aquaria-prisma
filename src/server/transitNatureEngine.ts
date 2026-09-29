// Cálculo leve da Natureza do Evento para trânsitos.
// Usa dignidades essenciais + tipo de casa tropical. Nenhum cálculo pesado.

import { PLANET_FICHAMENTO } from "./planetFichamento";
import { SIGN_NAMES } from "./transitEngine";

const ANGULAR_HOUSES = new Set([1, 4, 7, 10]);
const TRIKONA_HOUSES = new Set([5, 9]);
const DUSTHANA_HOUSES = new Set([6, 8, 12]);

const NATURAL_BENEFICS = new Set(["Júpiter", "Vênus"]);
const NATURAL_MALEFICS = new Set(["Saturno", "Marte", "Plutão"]);

function normalizePlanetKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

function getDignityScore(planet: string, sign: string): number {
  const key = normalizePlanetKey(planet);
  const entry = PLANET_FICHAMENTO[key];
  if (!entry?.dignities) return 0;
  const d = entry.dignities;
  if (d.domicile?.includes(sign) || d.exaltation?.includes(sign)) return 1;
  if (d.detriment?.includes(sign) || d.fall?.includes(sign)) return -1;
  return 0;
}

function getHouseModifier(house: number): number {
  if (ANGULAR_HOUSES.has(house)) return 0.5;
  if (TRIKONA_HOUSES.has(house)) return 0.3;
  if (DUSTHANA_HOUSES.has(house)) return -0.5;
  return 0;
}

function getNaturalDisposition(planet: string): number {
  if (NATURAL_BENEFICS.has(planet)) return 0.3;
  if (NATURAL_MALEFICS.has(planet)) return -0.3;
  return 0;
}

export interface TransitNature {
  label: string;
  sentence: string;
}

/**
 * Retorna uma avaliação leve do "terreno" do trânsito.
 * Combina dignidade essencial no signo + tipo de casa + disposição natural do planeta.
 */
export function getTransitNature(
  planet: string,
  transitLongitude: number,
  wholeSignHouse: number
): TransitNature {
  const sign = SIGN_NAMES[Math.floor(((transitLongitude % 360) + 360) % 360 / 30)];

  let score = 0;
  score += getDignityScore(planet, sign);
  score += getHouseModifier(wholeSignHouse);
  score += getNaturalDisposition(planet);

  if (score >= 0.8) {
    return {
      label: "Terreno Favorável",
      sentence: "As circunstâncias externas oferecem apoio e fluidez para este movimento. Há espaço para expandir, acertar e deixar o processo se desdobrar com menos resistência.",
    };
  }
  if (score <= -0.8) {
    return {
      label: "Terreno Restritivo",
      sentence: "As circunstâncias externas exigem que você assuma o comando. Não haverá facilidades automáticas; cada passo deste ciclo pede maturidade, paciência e responsabilidade própria.",
    };
  }
  return {
    label: "Terreno Neutro",
    sentence: "O ambiente externo não puxa nem empurra: o resultado deste ciclo depende principalmente da sua escolha consciente e da consistência com que conduzir o processo.",
  };
}
