// Cálculo leve da Natureza do Evento para trânsitos.
// Usa dignidades essenciais no ZODÍACO SIDERAL + tipo de casa sideral + dispositor.
// Nenhum cálculo pesado.

import { PLANET_FICHAMENTO } from "./planetFichamento";
import { SIGN_NAMES, getVedicHouse } from "./transitEngine";
import { signRulers } from "./astrology";

const KENDRA_HOUSES = new Set([1, 4, 7, 10]);
const TRIKONA_HOUSES = new Set([5, 9]);
const DUSTHANA_HOUSES = new Set([6, 8, 12]);
const UPACHAYA_HOUSES = new Set([3, 11]);

const NATURAL_BENEFICS = new Set(["Júpiter", "Vênus"]);
const NATURAL_MALEFICS = new Set(["Saturno", "Marte", "Plutão"]);

export interface TransitNature {
  label: string;
  sentence: string;
  houseType: string;
  dispositor: string;
  dignity: string;
}

function normalizePlanetKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

function getDignityInfo(planet: string, sign: string): { score: number; label: string } {
  const key = normalizePlanetKey(planet);
  const entry = PLANET_FICHAMENTO[key];
  if (!entry?.dignities) return { score: 0, label: "Peregrino/Neutro" };
  const d = entry.dignities;
  if (d.domicile?.includes(sign)) return { score: 1.0, label: `Domicílio em ${sign}` };
  if (d.exaltation?.includes(sign)) return { score: 0.8, label: `Exaltação em ${sign}` };
  if (d.detriment?.includes(sign)) return { score: -0.8, label: `Queda/Detrimento em ${sign}` };
  if (d.fall?.includes(sign)) return { score: -1.0, label: `Exílio/Queda em ${sign}` };
  return { score: 0, label: "Peregrino/Neutro" };
}

function getHouseType(house: number): string {
  if (KENDRA_HOUSES.has(house)) return "Kendra (ângulo de manifestação)";
  if (TRIKONA_HOUSES.has(house)) return "Trikona (casa de propósito/fruição)";
  if (DUSTHANA_HOUSES.has(house)) return "Dusthana (casa de cura e transformação)";
  if (UPACHAYA_HOUSES.has(house)) return "Upachaya (casa de crescimento gradual)";
  if (house === 2 || house === 7) return "Maraka (casa de entregas e trocas)";
  return "Casa neutra/sucedente";
}

function getHouseModifier(house: number): number {
  if (KENDRA_HOUSES.has(house)) return 0.5;
  if (TRIKONA_HOUSES.has(house)) return 0.4;
  if (UPACHAYA_HOUSES.has(house)) return 0.2;
  if (DUSTHANA_HOUSES.has(house)) return -0.4;
  if (house === 2 || house === 7) return -0.1;
  return 0;
}

function getNaturalDisposition(planet: string): number {
  if (NATURAL_BENEFICS.has(planet)) return 0.3;
  if (NATURAL_MALEFICS.has(planet)) return -0.3;
  return 0;
}

/**
 * Retorna uma avaliação leve do "terreno" do trânsito no mapa sideral.
 * planet: nome do planeta em trânsito.
 * sideralLongitude: longitude no zodíaco sideral.
 * sideralHouse: casa sideral Whole Sign.
 */
export function getTransitNature(
  planet: string,
  sideralLongitude: number,
  sideralHouse: number
): TransitNature {
  const sign = SIGN_NAMES[Math.floor(((sideralLongitude % 360) + 360) % 360 / 30)];
  const dignity = getDignityInfo(planet, sign);
  const houseType = getHouseType(sideralHouse);
  const dispositor = signRulers[sign] ?? "?";

  let score = 0;
  score += dignity.score;
  score += getHouseModifier(sideralHouse);
  score += getNaturalDisposition(planet);

  if (score >= 0.8) {
    return {
      label: "Terreno Favorável",
      sentence: "As circunstâncias externas oferecem apoio e fluidez para este movimento. Há espaço para expandir, acertar e deixar o processo se desdobrar com menos resistência.",
      houseType,
      dispositor,
      dignity: dignity.label,
    };
  }
  if (score <= -0.8) {
    return {
      label: "Terreno Restritivo",
      sentence: "As circunstâncias externas exigem que você assuma o comando. Não haverá facilidades automáticas; cada passo deste ciclo pede maturidade, paciência e responsabilidade própria.",
      houseType,
      dispositor,
      dignity: dignity.label,
    };
  }
  return {
    label: "Terreno Neutro",
    sentence: "O ambiente externo não puxa nem empurra: o resultado deste ciclo depende principalmente da sua escolha consciente e da consistência com que conduzir o processo.",
    houseType,
    dispositor,
    dignity: dignity.label,
  };
}
