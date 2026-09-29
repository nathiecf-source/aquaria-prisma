// Cálculo leve da Natureza do Evento para trânsitos.
// Usa dignidades essenciais no ZODÍACO SIDERAL + tipo de casa sideral + dispositor.
// Nenhum cálculo pesado.

import { PLANET_FICHAMENTO } from "./planetFichamento";
import { SIGN_NAMES, getVedicHouse } from "./transitEngine";
import { signRulers } from "./astrology";

interface HouseClassification {
  houses: number[];
  key: string;
  description: string;
  label: string;
}

const HOUSE_CLASSIFICATIONS: HouseClassification[] = [
  { houses: [1, 4, 7, 10], key: "Kendra", description: "ângulo de manifestação", label: "Sustentação" },
  { houses: [5, 9], key: "Trikona", description: "casa de propósito e fruição", label: "Fluxo" },
  { houses: [6, 8, 12], key: "Dusthana", description: "casa de cura e transformação", label: "Desafios" },
  { houses: [3, 11], key: "Upachaya", description: "casa de crescimento gradual", label: "Crescimento" },
  { houses: [2, 7], key: "Maraka", description: "casa de entregas e trocas", label: "Trocas" },
];

const NATURAL_BENEFICS = new Set(["Júpiter", "Vênus"]);
const NATURAL_MALEFICS = new Set(["Saturno", "Marte", "Plutão"]);

export interface TransitNature {
  label: string;
  sentence: string;
  houseType: string;
  houseClass: string;
  dispositor: string;
  dignity: string;
  dignityShort: string;
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

function getHouseClassification(house: number): HouseClassification {
  return HOUSE_CLASSIFICATIONS.find(c => c.houses.includes(house)) ?? {
    houses: [house],
    key: "Neutra",
    description: "casa sucedente/cadente",
    label: "Neutro",
  };
}

function getHouseType(house: number): string {
  const c = getHouseClassification(house);
  return `${c.key} (${c.description})`;
}

function getHouseClassLabel(house: number): string {
  return getHouseClassification(house).label;
}

function getHouseModifier(house: number): number {
  const c = getHouseClassification(house).key;
  if (c === "Kendra") return 0.5;
  if (c === "Trikona") return 0.4;
  if (c === "Upachaya") return 0.2;
  if (c === "Dusthana") return -0.4;
  if (c === "Maraka") return -0.1;
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
  const houseClass = getHouseClassLabel(sideralHouse);
  const dispositor = signRulers[sign] ?? "?";
  const dignityShort = dignity.label.split(" em ")[0];

  let score = 0;
  score += dignity.score;
  score += getHouseModifier(sideralHouse);
  score += getNaturalDisposition(planet);

  const base = {
    houseType,
    houseClass,
    dispositor,
    dignity: dignity.label,
    dignityShort,
  };

  if (score >= 0.8) {
    return {
      ...base,
      label: "Terreno Favorável",
      sentence: "As circunstâncias externas oferecem apoio e fluidez para este movimento. Há espaço para expandir, acertar e deixar o processo se desdobrar com menos resistência.",
    };
  }
  if (score <= -0.8) {
    return {
      ...base,
      label: "Terreno Restritivo",
      sentence: "As circunstâncias externas exigem que você assuma o comando. Não haverá facilidades automáticas; cada passo deste ciclo pede maturidade, paciência e responsabilidade própria.",
    };
  }
  return {
    ...base,
    label: "Terreno Neutro",
    sentence: "O ambiente externo não puxa nem empurra: o resultado deste ciclo depende principalmente da sua escolha consciente e da consistência com que conduzir o processo.",
  };
}
