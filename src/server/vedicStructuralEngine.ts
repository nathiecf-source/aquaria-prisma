/**
 * Motor determinístico de análise estrutural védica (Rasi/D-1 + Navamsha/D-9).
 * Deriva, a partir do CompleteAstrologicalProfile (dados JHora), a matriz de
 * fatores clássicos usada pelo relatório estrutural do admin:
 * combustão (Asta), Graha Yuddha, Argala/Virodhargala, Vargottama, Gandanta,
 * Avasthas de idade e consciência, BAV/SAV, Digbala, MKS, Kartari,
 * Neechabhanga e natureza funcional por lagna.
 *
 * Também expõe buildVedicTimingBlock: janela de dashas MD/AD com contexto
 * (relação angular, Tara Bala, vargas) e trânsitos críticos de Saturno
 * (Sade Sati/Ashtama/Kantaka/Lagna Shani) e dos nodos (inversão, retorno,
 * luminares e eixos) detectados sobre a janela do relatório.
 *
 * Nomes de grahas seguem o formato já persistido no perfil:
 * Sol, Lua, Marte, Mercúrio, Júpiter, Vênus, Saturno, Nodo Norte (Rahu), Nodo Sul (Ketu).
 */

import {
  getTropicalTransitDegrees,
  getMeanLunarNode,
  computeLahiriAyanamsha,
  tropicalToSideral,
} from "./transitEngine";

const SIGN_NAMES = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes",
];

/** Regência tradicional védica (difere de signRulers, que usa regentes modernos). */
export const VEDIC_SIGN_RULERS: Record<string, string> = {
  "Áries": "Marte", "Touro": "Vênus", "Gêmeos": "Mercúrio", "Câncer": "Lua",
  "Leão": "Sol", "Virgem": "Mercúrio", "Libra": "Vênus", "Escorpião": "Marte",
  "Sagitário": "Júpiter", "Capricórnio": "Saturno", "Aquário": "Saturno", "Peixes": "Júpiter",
};

const EXALTATION_SIGN: Record<string, string> = {
  "Sol": "Áries", "Lua": "Touro", "Marte": "Capricórnio", "Mercúrio": "Virgem",
  "Júpiter": "Câncer", "Vênus": "Peixes", "Saturno": "Libra",
  "Nodo Norte": "Touro", "Nodo Sul": "Escorpião",
};

/** Limiar de combustão (Maudhyam) por distância ao Sol — spec do relatório. */
const COMBUSTION_THRESHOLD: Record<string, number> = {
  "Mercúrio": 13, "Vênus": 10, "Marte": 17, "Júpiter": 11, "Saturno": 15,
};

/** Planetas elegíveis a Graha Yuddha (exclui Sol, Lua, Rahu e Ketu). */
const YUDDHA_ELIGIBLE = new Set(["Marte", "Mercúrio", "Júpiter", "Vênus", "Saturno"]);

/** Marana Karaka Sthana: casa de "paralisia funcional" por graha. */
const MKS_HOUSE: Record<string, number> = {
  "Sol": 12, "Lua": 8, "Marte": 7, "Mercúrio": 7,
  "Júpiter": 3, "Vênus": 6, "Saturno": 1, "Nodo Norte": 9,
};

/** Digbala (força direcional): casas onde cada graha ganha direção. */
const DIGBALA_HOUSES: Record<string, number[]> = {
  "Mercúrio": [1], "Júpiter": [1],
  "Lua": [4], "Vênus": [4],
  "Saturno": [7],
  "Sol": [10], "Marte": [10],
};

/** Ordem das linhas do binna_ashtaka_varga do JHora (espelha BAV_PLANET_ORDER do transitEngine). */
const BAV_PLANET_ORDER = ["Sol", "Lua", "Marte", "Mercúrio", "Júpiter", "Vênus", "Saturno", "Ascendente"];

const BENEFICS = new Set(["Júpiter", "Vênus", "Mercúrio", "Lua"]);
const MALEFICS = new Set(["Sol", "Marte", "Saturno", "Nodo Norte", "Nodo Sul"]);

const HOUSE_THEMES = [
  "Identidade, vitalidade e corpo",
  "Recursos, família e valores",
  "Iniciativa, coragem e comunicação",
  "Lar, mãe, conforto e imóveis",
  "Criatividade, filhos e inteligência",
  "Saúde, serviço e conflitos",
  "Relacionamentos e parcerias",
  "Transformação, oculto e longevidade",
  "Dharma, fortuna e mestres",
  "Carreira, status e ação pública",
  "Ganhos, redes e desejos",
  "Liberação, perdas e isolamento",
];

/** Karakas naturais (Naisargika) de cada bhava. */
const HOUSE_KARAKAS: Record<number, string[]> = {
  1: ["Sol"], 2: ["Júpiter"], 3: ["Marte"], 4: ["Lua", "Marte"],
  5: ["Júpiter"], 6: ["Marte", "Saturno"], 7: ["Vênus"], 8: ["Saturno"],
  9: ["Júpiter", "Sol"], 10: ["Sol", "Júpiter", "Mercúrio", "Saturno"],
  11: ["Júpiter"], 12: ["Saturno", "Nodo Sul"],
};

const ODD_SIGN_INDEXES = new Set([0, 2, 4, 6, 8, 10]); // Áries, Gêmeos, Leão, Libra, Sagitário, Aquário

export interface PlanetStructural {
  name: string;              // nome persistido ("Nodo Norte")
  displayName: string;       // "Rahu" para Nodo Norte, "Ketu" para Nodo Sul
  sign: string;
  house: number;
  degree: number;
  nakshatra: string;
  pada: number;
  dignity: string;
  isRetrograde: boolean;
  vargottama: boolean | null;
  neechabhanga: boolean;
  gandanta: string | null;          // ex: "Peixes→Áries" quando ativo
  combustion: { active: boolean; distanceDeg: number | null; thresholdDeg: number | null };
  grahaYuddha: { opponent: string; winner: string; separationDeg: number } | null;
  ageAvastha: { label: string; capacity: string };
  consciousnessAvastha: "Jaagrita" | "Swapna" | "Sushupta" | null;
  bav: number | null;               // bindus (0-8) do BAV do próprio planeta no signo ocupado
  digbala: boolean;
  mks: boolean;
  houseType: string;                // Kendra / Trikona / Upachaya / Dusthana (+ marcações)
  functionalNature: string;         // Yogakaraka / Benéfico Funcional / Maléfico Funcional / Kendradhipati Dosha
  dispositor: { name: string; sign: string; house: number; dignity: string } | null;
  drishtiReceived: string[];        // nomes dos planetas que aspectam a casa do planeta
  argala: { houses: Record<string, string[]> };   // "2","4","11","5" → ocupantes
  virodhargala: { houses: Record<string, string[]> }; // "12","10","3","9" → ocupantes
  kartari: "Subha Kartari" | "Papa Kartari" | null;
  shadbalaRatio: number | null;
}

export interface HouseStructural {
  house: number;
  theme: string;
  sign: string;
  occupants: string[];              // displayName
  drishtiReceived: string[];
  sav: number | null;
  savClass: string | null;
  bhavesha: { name: string; house: number; sign: string; dignity: string } | null;
  karakas: { name: string; house: number; dignity: string; afflictions: string[] }[];
  argala: string[];                 // planetas fazendo argala sobre a casa
  kartari: "Subha Kartari" | "Papa Kartari" | null;
}

export interface VedicStructuralMatrix {
  lagna: string;
  lagnesha: { name: string; house: number; dignity: string } | null;
  planets: PlanetStructural[];
  houses: HouseStructural[];
  unavailable: string[];            // blocos que degradaram por falta de dado
}

const DISPLAY: Record<string, string> = { "Nodo Norte": "Rahu", "Nodo Sul": "Ketu" };
const displayName = (name: string) => DISPLAY[name] || name;

const norm360 = (v: number) => ((v % 360) + 360) % 360;
const angularDistance = (a: number, b: number) => {
  const d = Math.abs(norm360(a) - norm360(b));
  return d > 180 ? 360 - d : d;
};

function houseTypeLabel(house: number, mks: boolean): string {
  const types: string[] = [];
  if ([1, 4, 7, 10].includes(house)) types.push("Kendra");
  if ([1, 5, 9].includes(house)) types.push("Trikona");
  if ([3, 6, 10, 11].includes(house)) types.push("Upachaya");
  if ([6, 8, 12].includes(house)) types.push("Dusthana");
  if (mks) types.push("Marana Karaka Sthana (MKS)");
  return types.join(" + ") || "Neutra";
}

function computeAgeAvastha(degreeInSign: number, signIndex: number): { label: string; capacity: string } {
  // BPHS: signos ímpares → sequência ascendente; signos pares → invertida.
  const bands = [
    { label: "Saisava (infantil)", capacity: "~25% de capacidade" },
    { label: "Kumara (juvenil)", capacity: "~50% de capacidade" },
    { label: "Yuva (adulto)", capacity: "100% de capacidade" },
    { label: "Vriddha (maduro/velho)", capacity: "capacidade reduzida" },
    { label: "Mrita (inerte)", capacity: "capacidade física nula" },
  ];
  const idx = Math.min(4, Math.floor(Math.max(0, degreeInSign) / 6));
  return ODD_SIGN_INDEXES.has(signIndex) ? bands[idx] : bands[4 - idx];
}

function computeFunctionalNature(planetName: string, ruledHouses: number[]): string {
  const tags: string[] = [];
  const rulesKendra = ruledHouses.some((h) => [4, 7, 10].includes(h));
  const rulesTrikona = ruledHouses.some((h) => [5, 9].includes(h));
  const rulesTrishadaya = ruledHouses.some((h) => [3, 6, 11].includes(h));
  const rulesDusthana = ruledHouses.some((h) => [6, 8, 12].includes(h));
  const rulesLagna = ruledHouses.includes(1);

  if (rulesKendra && rulesTrikona) tags.push("Yogakaraka");
  if (rulesLagna) tags.push("Senhor do Ascendente (sempre favorável)");
  if (rulesTrikona && !rulesKendra) tags.push("Benéfico Funcional (senhor de Trikona)");
  if (rulesTrishadaya) tags.push("Maléfico Funcional (senhor de 3/6/11)");
  if (rulesDusthana && !rulesTrishadaya) tags.push("Senhor de Dusthana (6/8/12)");
  if (rulesKendra && !rulesTrikona && BENEFICS.has(planetName)) tags.push("Kendradhipati Dosha (benéfico regendo Kendra)");
  if (tags.length === 0) tags.push("Neutro funcional");
  return tags.join("; ");
}

function extractShadbalaRatio(entry: any): number | null {
  if (entry == null) return null;
  if (typeof entry === "number") return entry;
  if (typeof entry === "object") {
    if (typeof entry.ratio === "number") return entry.ratio;
    const total = typeof entry.total_rupas === "number" ? entry.total_rupas : entry.total_virupas;
    const min = typeof entry.minimum_required_rupas === "number" ? entry.minimum_required_rupas : entry.minimum_required_virupas;
    if (typeof total === "number" && typeof min === "number" && min > 0) return total / min;
  }
  return null;
}

/**
 * Constrói a matriz estrutural completa a partir do perfil astrológico.
 * Tolerante a dados faltantes: blocos indisponíveis saem como null e são
 * listados em `unavailable` para o prompt omitir a técnica.
 */
export function buildVedicStructuralMatrix(profile: any): VedicStructuralMatrix {
  const unavailable: string[] = [];
  const vedicPlanets: any[] = Array.isArray(profile?.vedic_natal?.planets)
    ? profile.vedic_natal.planets
    : [];

  const lagnaSign: string = profile?.vedic_specifics?.lagna || "";
  const lagnaIdx = SIGN_NAMES.indexOf(lagnaSign);

  // Índice signo → ocupantes (displayName)
  const occupantsBySign = new Map<number, string[]>();
  const occupantsByHouse = new Map<number, string[]>();
  for (const p of vedicPlanets) {
    const sIdx = SIGN_NAMES.indexOf(p.sign);
    if (sIdx >= 0) {
      const list = occupantsBySign.get(sIdx) || [];
      list.push(displayName(p.name));
      occupantsBySign.set(sIdx, list);
    }
    if (typeof p.house === "number" && p.house >= 1) {
      const list = occupantsByHouse.get(p.house) || [];
      list.push(displayName(p.name));
      occupantsByHouse.set(p.house, list);
    }
  }

  // Drishti recebido por casa: "X olha Casa N"
  const drishtiStrings: string[] = Array.isArray(profile?.vedic_natal?.drishti) ? profile.vedic_natal.drishti : [];
  const drishtiByHouse = new Map<number, string[]>();
  for (const d of drishtiStrings) {
    const m = String(d).match(/^(.*)\s+olha\s+Casa\s+(\d+)/i);
    if (!m) continue;
    const h = Number(m[2]);
    const list = drishtiByHouse.get(h) || [];
    list.push(displayName(m[1].trim()));
    drishtiByHouse.set(h, list);
  }

  // Regentes de cada casa (lordships) para natureza funcional
  const ruledHousesByPlanet = new Map<string, number[]>();
  if (lagnaIdx >= 0) {
    for (let h = 1; h <= 12; h++) {
      const signIdx = (lagnaIdx + h - 1) % 12;
      const lord = VEDIC_SIGN_RULERS[SIGN_NAMES[signIdx]];
      if (lord) {
        const list = ruledHousesByPlanet.get(lord) || [];
        list.push(h);
        ruledHousesByPlanet.set(lord, list);
      }
    }
  } else {
    unavailable.push("natureza funcional (lagna ausente)");
  }

  // D9 (Navamsha) para Vargottama — chaves são nomes traduzidos
  const d9: Record<string, string> = profile?.vedic_vargas?.d9Navamsa || {};
  if (Object.keys(d9).length === 0) unavailable.push("vargottama (D-9 ausente)");

  // Ashtakavarga
  const ashta = profile?.vedic_balas?.ashtakavarga;
  const binna = ashta?.binna_ashtaka_varga;
  const samudhaya = ashta?.samudhaya_ashtaka_varga;
  if (!Array.isArray(binna)) unavailable.push("BAV (binna_ashtaka_varga ausente)");
  if (!Array.isArray(samudhaya)) unavailable.push("SAV (samudhaya_ashtaka_varga ausente)");

  const shadbala = profile?.vedic_balas?.shadbala || {};
  const sun = vedicPlanets.find((p) => p.name === "Sol");
  const moon = vedicPlanets.find((p) => p.name === "Lua");
  const moonHouse = typeof moon?.house === "number" ? moon.house : null;

  const byName = new Map(vedicPlanets.map((p) => [p.name, p]));

  // Ocupantes a N casas a partir de uma casa de referência (contando a referência como 1)
  const occupantsFrom = (refHouse: number, offset: number): string[] =>
    occupantsByHouse.get(((refHouse + offset - 2) % 12) + 1) || [];

  // ─── Graha Yuddha: pares elegíveis no mesmo signo a <1° ────────────────
  const yuddhaByPlanet = new Map<string, { opponent: string; winner: string; separationDeg: number }>();
  const yuddhaCandidates = vedicPlanets.filter(
    (p) => YUDDHA_ELIGIBLE.has(p.name) && typeof p.longitude === "number" && Number.isFinite(p.longitude)
  );
  for (let i = 0; i < yuddhaCandidates.length; i++) {
    for (let j = i + 1; j < yuddhaCandidates.length; j++) {
      const a = yuddhaCandidates[i];
      const b = yuddhaCandidates[j];
      if (a.sign !== b.sign) continue;
      const sep = angularDistance(a.longitude, b.longitude);
      if (sep < 1) {
        // Menor grau (longitude dentro do signo) vence
        const winner = (a.longitude % 30) <= (b.longitude % 30) ? a : b;
        const loser = winner === a ? b : a;
        yuddhaByPlanet.set(a.name, { opponent: displayName(b.name), winner: displayName(winner.name), separationDeg: sep });
        yuddhaByPlanet.set(b.name, { opponent: displayName(a.name), winner: displayName(winner.name), separationDeg: sep });
        void loser;
      }
    }
  }

  // ─── Análise por planeta ───────────────────────────────────────────────
  const planets: PlanetStructural[] = vedicPlanets.map((p) => {
    const signIdx = SIGN_NAMES.indexOf(p.sign);
    const degInSign = typeof p.degree === "number" ? p.degree : typeof p.longitude === "number" ? p.longitude % 30 : 0;

    // Vargottama: mesmo signo em D-1 e D-9
    const d9Sign = d9[p.name];
    const vargottama = d9Sign ? d9Sign === p.sign : null;

    // Neechabhanga: debilitado cujo regente do signo de debilitação OU da
    // exaltação está em Kendra a partir do Lagna ou da Lua.
    let neechabhanga = false;
    if (p.dignity === "Debilitado" && signIdx >= 0) {
      const debilLord = byName.get(VEDIC_SIGN_RULERS[p.sign]);
      const exaltSign = EXALTATION_SIGN[p.name];
      const exaltLord = exaltSign ? byName.get(VEDIC_SIGN_RULERS[exaltSign]) : undefined;
      const inKendraFromLagna = (pl: any) => pl && [1, 4, 7, 10].includes(pl.house);
      const inKendraFromMoon = (pl: any) =>
        pl && moonHouse && [1, 4, 7, 10].includes(((pl.house - moonHouse + 12) % 12) + 1);
      neechabhanga = [debilLord, exaltLord].some((l) => l && (inKendraFromLagna(l) || inKendraFromMoon(l)));
    }

    // Gandanta: junções Água→Fogo (grau ~0 de signo de fogo ou ~29 de signo de água)
    let gandanta: string | null = null;
    if (typeof p.longitude === "number") {
      const d30 = norm360(p.longitude) % 30;
      const fireStarts: Record<number, string> = { 0: "Peixes→Áries", 4: "Câncer→Leão", 8: "Escorpião→Sagitário" };
      const waterEnds: Record<number, string> = { 3: "Câncer→Leão", 7: "Escorpião→Sagitário", 11: "Peixes→Áries" };
      if (fireStarts[signIdx] && d30 <= 1) gandanta = fireStarts[signIdx];
      else if (waterEnds[signIdx] && d30 >= 29) gandanta = waterEnds[signIdx];
    }

    // Combustão por distância angular ao Sol
    let combustion = { active: false, distanceDeg: null as number | null, thresholdDeg: null as number | null };
    const threshold = COMBUSTION_THRESHOLD[p.name];
    if (threshold !== undefined && typeof p.longitude === "number" && typeof sun?.longitude === "number") {
      const dist = angularDistance(p.longitude, sun.longitude);
      combustion = { active: dist <= threshold || !!p.isCombust, distanceDeg: dist, thresholdDeg: threshold };
    } else if (p.isCombust) {
      combustion = { active: true, distanceDeg: null, thresholdDeg: threshold ?? null };
    }

    // BAV: bindus do próprio BAV no signo ocupado
    const bavRow = BAV_PLANET_ORDER.indexOf(p.name);
    const bav =
      Array.isArray(binna) && bavRow >= 0 && Array.isArray(binna[bavRow]) && typeof binna[bavRow][signIdx] === "number"
        ? binna[bavRow][signIdx]
        : null;

    // Consciência
    const ownSign = signIdx >= 0 && VEDIC_SIGN_RULERS[p.sign] === p.name;
    let consciousnessAvastha: PlanetStructural["consciousnessAvastha"] = null;
    if (["Exaltado", "Moolatrikona"].includes(p.dignity) || ownSign) consciousnessAvastha = "Jaagrita";
    else if (["Inimigo", "Debilitado"].includes(p.dignity)) consciousnessAvastha = "Sushupta";
    else if (p.dignity) consciousnessAvastha = "Swapna";

    const mks = MKS_HOUSE[p.name] === p.house;
    const digbala = (DIGBALA_HOUSES[p.name] || []).includes(p.house);

    // Dispositor (regente do signo ocupado)
    const dispName = signIdx >= 0 ? VEDIC_SIGN_RULERS[p.sign] : undefined;
    const disp = dispName && dispName !== p.name ? byName.get(dispName) : undefined;
    const dispositor = disp
      ? { name: displayName(disp.name), sign: disp.sign, house: disp.house, dignity: disp.dignity }
      : dispName === p.name
        ? { name: displayName(p.name), sign: p.sign, house: p.house, dignity: p.dignity }
        : null;

    // Argala / Virodhargala a partir da casa do planeta
    const argalaHouses = {
      "2": occupantsFrom(p.house, 2),
      "4": occupantsFrom(p.house, 4),
      "11": occupantsFrom(p.house, 11),
      "5": occupantsFrom(p.house, 5), // secundária
    };
    const virodhargalaHouses = {
      "12": occupantsFrom(p.house, 12),
      "10": occupantsFrom(p.house, 10),
      "3": occupantsFrom(p.house, 3),
      "9": occupantsFrom(p.house, 9),
    };

    // Kartari: ocupantes das casas 2 e 12 a partir do planeta
    const flank = [...occupantsFrom(p.house, 2), ...occupantsFrom(p.house, 12)];
    const kartari = flank.length === 0
      ? null
      : flank.every((n) => {
          const canonical = n === "Rahu" ? "Nodo Norte" : n === "Ketu" ? "Nodo Sul" : n;
          return BENEFICS.has(canonical);
        })
        ? "Subha Kartari"
        : "Papa Kartari";

    return {
      name: p.name,
      displayName: displayName(p.name),
      sign: p.sign,
      house: p.house,
      degree: Math.round(degInSign * 100) / 100,
      nakshatra: p.nakshatra || "",
      pada: p.pada || 0,
      dignity: p.dignity || "Neutro",
      isRetrograde: !!p.isRetrograde,
      vargottama,
      neechabhanga,
      gandanta,
      combustion,
      grahaYuddha: yuddhaByPlanet.get(p.name) || null,
      ageAvastha: computeAgeAvastha(degInSign, signIdx >= 0 ? signIdx : 0),
      consciousnessAvastha,
      bav,
      digbala,
      mks,
      houseType: houseTypeLabel(p.house, mks),
      functionalNature: computeFunctionalNature(p.name, ruledHousesByPlanet.get(p.name) || []),
      dispositor,
      drishtiReceived: drishtiByHouse.get(p.house) || [],
      argala: { houses: argalaHouses },
      virodhargala: { houses: virodhargalaHouses },
      kartari,
      shadbalaRatio: extractShadbalaRatio(shadbala[p.name] ?? shadbala[displayName(p.name)]),
    };
  });

  // ─── Análise por casa ──────────────────────────────────────────────────
  const houses: HouseStructural[] = [];
  for (let h = 1; h <= 12; h++) {
    const signIdx = lagnaIdx >= 0 ? (lagnaIdx + h - 1) % 12 : -1;
    const sign = signIdx >= 0 ? SIGN_NAMES[signIdx] : "?";
    const lordName = signIdx >= 0 ? VEDIC_SIGN_RULERS[sign] : undefined;
    const lord = lordName ? byName.get(lordName) : undefined;

    const sav =
      Array.isArray(samudhaya) && typeof samudhaya[signIdx] === "number" ? samudhaya[signIdx] : null;
    const savClass =
      sav === null ? null : sav > 30 ? "Alta (>30 — facilidade)" : sav >= 25 ? "Média (25–30)" : "Baixa (<25 — esforço)";

    // Karakas naturais da casa
    const karakas = (HOUSE_KARAKAS[h] || [])
      .map((k) => {
        const pl = byName.get(k);
        if (!pl) return null;
        const afflictions: string[] = [];
        const st = planets.find((x) => x.name === pl.name);
        if (st) {
          if (st.combustion.active) afflictions.push("combusto");
          if (st.grahaYuddha && st.grahaYuddha.winner !== st.displayName) afflictions.push("derrotado em Graha Yuddha");
          if (st.dignity === "Debilitado") afflictions.push("debilitado");
          if (st.mks) afflictions.push("MKS");
          if (st.gandanta) afflictions.push("Gandanta");
        }
        return { name: displayName(pl.name), house: pl.house, dignity: pl.dignity, afflictions };
      })
      .filter(Boolean) as HouseStructural["karakas"];

    // Argala sobre a casa: ocupantes das casas 2, 4, 11 a partir dela
    const argala = [
      ...occupantsFrom(h, 2).map((n) => `${n} (2ª)`),
      ...occupantsFrom(h, 4).map((n) => `${n} (4ª)`),
      ...occupantsFrom(h, 11).map((n) => `${n} (11ª)`),
    ];

    const flank = [...occupantsFrom(h, 2), ...occupantsFrom(h, 12)];
    const kartari = flank.length === 0
      ? null
      : flank.every((n) => BENEFICS.has(n === "Rahu" ? "Nodo Norte" : n === "Ketu" ? "Nodo Sul" : n))
        ? "Subha Kartari"
        : "Papa Kartari";

    houses.push({
      house: h,
      theme: HOUSE_THEMES[h - 1],
      sign,
      occupants: occupantsByHouse.get(h) || [],
      drishtiReceived: drishtiByHouse.get(h) || [],
      sav,
      savClass,
      bhavesha: lord
        ? { name: displayName(lord.name), house: lord.house, sign: lord.sign, dignity: lord.dignity }
        : null,
      karakas,
      argala,
      kartari,
    });
  }

  const lagnaLordPlanet = lagnaIdx >= 0 ? byName.get(VEDIC_SIGN_RULERS[lagnaSign]) : undefined;

  return {
    lagna: lagnaSign,
    lagnesha: lagnaLordPlanet
      ? { name: displayName(lagnaLordPlanet.name), house: lagnaLordPlanet.house, dignity: lagnaLordPlanet.dignity }
      : null,
    planets,
    houses,
    unavailable,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOCO TEMPORAL — Dashas MD/AD (janela −1 ano → +2 anos) e Trânsitos Críticos
// ═══════════════════════════════════════════════════════════════════════════

const NAKSHATRAS_ORDER = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu",
  "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta",
  "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
  "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati",
];

/** Navatara: tara contada do Janma Nakshatra (ciclo 1..9). */
const NAVATARA: Record<number, string> = {
  1: "Janma (nascimento — neutro, identidade)",
  2: "Sampat (prosperidade, ganho)",
  3: "Vipat (perigo, obstáculo, perda)",
  4: "Kshema (bem-estar, segurança)",
  5: "Pratyari (oposição, inimizade)",
  6: "Sadhaka (realização, cumprimento)",
  7: "Naidhana (destruição, dissolução de ciclos)",
  8: "Maitra (amizade, apoio)",
  9: "Parama Maitra (apoio supremo, grande aliado)",
};

/** Resolve nomes de lord de dasha (abreviações Vimshottari ou nomes completos) para o nome canônico PT. */
const DASHA_LORD_ALIASES: Record<string, string> = {
  su: "Sol", sun: "Sol", sol: "Sol",
  mo: "Lua", moon: "Lua", lua: "Lua", ch: "Lua", chandra: "Lua",
  ma: "Marte", mars: "Marte", marte: "Marte", mangal: "Marte", kuja: "Marte",
  me: "Mercúrio", mercury: "Mercúrio", "mercúrio": "Mercúrio", budha: "Mercúrio",
  ju: "Júpiter", jupiter: "Júpiter", "júpiter": "Júpiter", guru: "Júpiter",
  ve: "Vênus", venus: "Vênus", "vênus": "Vênus", shukra: "Vênus",
  sa: "Saturno", saturn: "Saturno", saturno: "Saturno", shani: "Saturno",
  ra: "Nodo Norte", rahu: "Nodo Norte", "nodo norte": "Nodo Norte",
  ke: "Nodo Sul", ketu: "Nodo Sul", "nodo sul": "Nodo Sul",
};

export function resolveDashaLord(name: string): string {
  return DASHA_LORD_ALIASES[name.trim().toLowerCase()] || name;
}

function parseDashaDate(value: string): number {
  if (!value) return NaN;
  const s = String(value).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return Date.UTC(+iso[1], +iso[2] - 1, +iso[3]);
  const br = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (br) return Date.UTC(+br[3], +br[2] - 1, +br[1]);
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : NaN;
}

function isoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export type DashaStatus = "passado" | "atual" | "futuro";

export interface DashaAntar {
  lord: string;
  displayLord: string;
  start: string;
  end: string;
  status: DashaStatus;
  angularRelation: string;
  taraBala: string;
}

export interface DashaMaha {
  lord: string;
  displayLord: string;
  start: string;
  end: string;
  status: DashaStatus;
  antars: DashaAntar[];
}

export interface CriticalTransit {
  key: string;
  title: string;
  status: "ativo" | "proximo" | "encerrado";
  phase?: string;
  startDate?: string;
  endDate?: string;
  ref?: string;
  detail: string;
}

export interface VedicTimingBlock {
  generatedAt: string;
  window: { from: string; to: string };
  dashas: DashaMaha[];
  criticalTransits: CriticalTransit[];
  unavailable: string[];
}

const statusFor = (start: number, end: number, ref: number): DashaStatus =>
  start > ref ? "futuro" : end <= ref ? "passado" : "atual";

function angularRelationLabel(count: number): string {
  switch (count) {
    case 1: return "1/1 — conjunção (fusão de agendas)";
    case 7: return "1/7 — eixo de confronto e equilíbrio";
    case 5: return "5/9 — trígono dhármico (cooperação fluida)";
    case 9: return "9/5 — trígono dhármico (cooperação fluida)";
    case 6: case 8: return "6/8 — Shashtashtaka (atrito, reajuste forçado, possíveis crises)";
    case 2: case 12: return "2/12 — Dwirdwadasa (despesas, desgaste, reajustes)";
    default: return `${count} — relação neutra`;
  }
}

function nakshatraIndexOf(name: string): number {
  if (!name) return -1;
  const clean = name.trim().toLowerCase().replace(/[^a-z]/g, "");
  return NAKSHATRAS_ORDER.findIndex((n) => n.toLowerCase().replace(/[^a-z]/g, "") === clean);
}

/** Longitude sideral (0-360) de um corpo lento numa data. */
async function siderealLongitudeAt(body: "Saturno" | "Rahu" | "Ketu", ms: number): Promise<number> {
  const date = new Date(ms);
  const ayanamsha = computeLahiriAyanamsha(date.getUTCFullYear());
  let tropical: number;
  if (body === "Saturno") {
    const positions = await getTropicalTransitDegrees(date, true);
    tropical = positions["Saturno"];
  } else {
    // JDE aproximado por timestamp Unix — erro desprezível para o nodo médio.
    const jde = ms / 86400000 + 2440587.5;
    tropical = getMeanLunarNode(jde);
    if (body === "Ketu") tropical = (tropical + 180) % 360;
  }
  return tropicalToSideral(tropical, ayanamsha);
}

/**
 * Janelas [start,end] em que `body` ocupa `targetSignIdx` dentro de [fromMs, toMs].
 * Varredura de 10 dias + refinamento binário (~1 dia) nos limites.
 */
async function collectSignWindows(
  body: "Saturno" | "Rahu" | "Ketu",
  targetSignIdx: number,
  fromMs: number,
  toMs: number
): Promise<{ start: string; end: string }[]> {
  const stepMs = 10 * 86400000;
  const signAt = async (ms: number) => Math.floor((await siderealLongitudeAt(body, ms)) / 30) % 12;

  const refineEdge = async (inSignMs: number, outSignMs: number): Promise<number> => {
    let inP = inSignMs, outP = outSignMs;
    for (let i = 0; i < 12; i++) {
      const mid = (inP + outP) / 2;
      const s = await signAt(mid);
      if (s === targetSignIdx) inP = mid; else outP = mid;
    }
    return (inP + outP) / 2;
  };

  const windows: { start: string; end: string }[] = [];
  let runStart: number | null = null;
  let t = fromMs;
  while (t <= toMs) {
    const inSign = (await signAt(t)) === targetSignIdx;
    if (inSign && runStart === null) runStart = t;
    if (!inSign && runStart !== null) {
      const ingress = runStart - stepMs < fromMs
        ? await refineEdge(runStart, Math.max(0, runStart - stepMs))
        : await refineEdge(runStart - stepMs, runStart);
      const egress = await refineEdge(t - stepMs, t);
      windows.push({ start: isoDay(ingress), end: isoDay(egress) });
      runStart = null;
    }
    t += stepMs;
  }
  if (runStart !== null) {
    const ingress = runStart - stepMs < fromMs
      ? await refineEdge(runStart, Math.max(0, runStart - stepMs))
      : await refineEdge(runStart - stepMs, runStart);
    windows.push({ start: isoDay(ingress), end: isoDay(toMs) });
  }
  return windows;
}

function saturnPeriodOverlaps(
  periods: { startDate?: string; endDate?: string }[] | undefined,
  fromMs: number,
  toMs: number
): { startDate?: string; endDate?: string; phase1?: any; phase2?: any; phase3?: any }[] {
  if (!Array.isArray(periods)) return [];
  return periods.filter((p) => {
    const s = parseDashaDate(p.startDate || "");
    const e = parseDashaDate(p.endDate || "");
    return Number.isFinite(s) && Number.isFinite(e) && e >= fromMs && s <= toMs;
  });
}

function transitStatus(start: number, end: number, ref: number): CriticalTransit["status"] {
  return start > ref ? "proximo" : end <= ref ? "encerrado" : "ativo";
}

/**
 * Monta a janela temporal do relatório:
 * - dashas MD/AD agrupadas da sequência Vimshottari (−1 ano → +2 anos)
 * - trânsitos críticos de Saturno (JHora saturn_transits + efeméride local) e dos nodos
 */
export async function buildVedicTimingBlock(
  profile: any,
  matrix: VedicStructuralMatrix,
  generatedAt: Date = new Date()
): Promise<VedicTimingBlock> {
  const ref = generatedAt.getTime();
  const fromMs = ref - 366 * 86400000;
  const toMs = ref + 2 * 366 * 86400000;
  const unavailable: string[] = [];

  const vedicPlanets: any[] = Array.isArray(profile?.vedic_natal?.planets) ? profile.vedic_natal.planets : [];
  const byName = new Map(vedicPlanets.map((p) => [p.name, p]));
  const lagnaIdx = SIGN_NAMES.indexOf(matrix.lagna || profile?.vedic_specifics?.lagna || "");
  const janmaNak = profile?.vedic_specifics?.janmaNakshatra || byName.get("Lua")?.nakshatra || "";
  const janmaNakIdx = nakshatraIndexOf(janmaNak);

  // ─── Dashas: agrupa sequência pratyantar → AD → MD ──────────────────────
  const dashas: DashaMaha[] = [];
  const seq = Array.isArray(profile?.vedic_timing?.sequence) ? profile.vedic_timing.sequence : [];
  const entries = seq
    .map((e: any) => ({ names: Array.isArray(e?.names) ? e.names : [], start: parseDashaDate(e?.start || "") }))
    .filter((e: any) => e.names.length >= 2 && Number.isFinite(e.start))
    .sort((a: any, b: any) => a.start - b.start);

  if (!entries.length) {
    unavailable.push("dashas (sequência vimshottari ausente)");
  } else {
    interface AdBlock { maha: string; antar: string; start: number; end: number }
    const adBlocks: AdBlock[] = [];
    for (const e of entries) {
      const maha = resolveDashaLord(String(e.names[0]));
      const antar = resolveDashaLord(String(e.names[1]));
      const last = adBlocks[adBlocks.length - 1];
      if (last && last.maha === maha && last.antar === antar) continue;
      adBlocks.push({ maha, antar, start: e.start, end: e.start });
    }
    for (let i = 0; i < adBlocks.length; i++) {
      adBlocks[i].end = i + 1 < adBlocks.length ? adBlocks[i + 1].start : adBlocks[i].start + 92 * 86400000;
    }

    interface MdBlock { maha: string; start: number; end: number; ads: AdBlock[] }
    const mdBlocks: MdBlock[] = [];
    for (const ad of adBlocks) {
      const last = mdBlocks[mdBlocks.length - 1];
      if (last && last.maha === ad.maha) {
        last.ads.push(ad);
        last.end = ad.end;
      } else {
        mdBlocks.push({ maha: ad.maha, start: ad.start, end: ad.end, ads: [ad] });
      }
    }

    for (const md of mdBlocks) {
      if (md.end < fromMs || md.start > toMs) continue;
      const ads = md.ads.filter((ad) => ad.end >= fromMs && ad.start <= toMs);
      if (!ads.length) continue;
      dashas.push({
        lord: md.maha,
        displayLord: displayName(md.maha),
        start: isoDay(md.start),
        end: isoDay(md.end),
        status: statusFor(md.start, md.end, ref),
        antars: ads.map((ad) => ({
          lord: ad.antar,
          displayLord: displayName(ad.antar),
          start: isoDay(ad.start),
          end: isoDay(ad.end),
          status: statusFor(ad.start, ad.end, ref),
          angularRelation: angularRelation(md.maha, ad.antar, byName),
          taraBala: taraBalaOf(ad.antar, janmaNakIdx, byName),
        })),
      });
    }
    if (!dashas.length) unavailable.push("dashas (nenhum período sobrepõe a janela)");
  }

  // ─── Trânsitos críticos ─────────────────────────────────────────────────
  const criticalTransits: CriticalTransit[] = [];
  const saturnData = profile?.vedic_saturn_transits;

  // Sade Sati (JHora, signBased)
  for (const p of saturnPeriodOverlaps(saturnData?.sadeSati?.signBased, fromMs, toMs)) {
    const s = parseDashaDate(p.startDate || ""), e = parseDashaDate(p.endDate || "");
    let phase: string | undefined;
    for (const [n, ph] of [["1", p.phase1], ["2", p.phase2], ["3", p.phase3]] as const) {
      const ps = parseDashaDate(ph?.startDate || ""), pe = parseDashaDate(ph?.endDate || "");
      if (Number.isFinite(ps) && Number.isFinite(pe) && ref >= ps && ref <= pe) {
        phase = `Fase ${n} — Saturno na casa ${ph?.house || "?"} a partir da Lua natal`;
      }
    }
    criticalTransits.push({
      key: "sade-sati",
      title: "Sade Sati (7,5 anos de reestruturação)",
      status: transitStatus(s, e, ref),
      phase,
      startDate: p.startDate, endDate: p.endDate,
      ref: "Lua natal",
      detail: "Saturno transitando pela 12ª, 1ª e 2ª casas a partir do Chandra Lagna — término de ciclos, pressão sobre o ego e reorganização de valores.",
    });
  }

  // Ashtama Shani (8ª casa a partir da Lua)
  for (const p of saturnPeriodOverlaps(saturnData?.moonTransits?.eighthHouse?.signBased, fromMs, toMs)) {
    criticalTransits.push({
      key: "ashtama-shani",
      title: "Ashtama Shani (Saturno na 8ª da Lua natal)",
      status: transitStatus(parseDashaDate(p.startDate || ""), parseDashaDate(p.endDate || ""), ref),
      startDate: p.startDate, endDate: p.endDate,
      ref: "Lua natal",
      detail: "~2,5 anos de transformação profunda: interrupções, crises de saúde ou término de estruturas vulneráveis.",
    });
  }

  // Kantaka Shani: 4ª e 8ª da Lua (JHora) + 10ª da Lua (efeméride local)
  for (const p of saturnPeriodOverlaps(saturnData?.moonTransits?.fourthHouse?.signBased, fromMs, toMs)) {
    criticalTransits.push({
      key: "kantaka-shani-4",
      title: "Kantaka Shani — Saturno na 4ª da Lua",
      status: transitStatus(parseDashaDate(p.startDate || ""), parseDashaDate(p.endDate || ""), ref),
      startDate: p.startDate, endDate: p.endDate,
      ref: "Lua natal",
      detail: "Saturno como 'espinho' na base doméstica: paz doméstica, propriedades e estabilidade emocional sob teste.",
    });
  }

  const moon = byName.get("Lua");
  const moonSignIdx = moon ? SIGN_NAMES.indexOf(moon.sign) : -1;
  const sunSignIdx = byName.get("Sol") ? SIGN_NAMES.indexOf(byName.get("Sol").sign) : -1;
  const kantaka10Target = moonSignIdx >= 0 ? (moonSignIdx + 9) % 12 : -1;
  if (kantaka10Target >= 0) {
    try {
      for (const sp of await collectSignWindows("Saturno", kantaka10Target, fromMs, toMs)) {
        criticalTransits.push({
          key: "kantaka-shani-10",
          title: "Kantaka Shani — Saturno na 10ª da Lua",
          status: transitStatus(parseDashaDate(sp.start), parseDashaDate(sp.end), ref),
          startDate: sp.start, endDate: sp.end,
          ref: "Lua natal",
          detail: "Espinho saturnino na carreira: sobrecarga, instabilidade profissional ou cobrança de resultados.",
        });
      }
    } catch { /* efeméride indisponível — omite */ }
  }

  // Lagna Shani: Saturno no signo do Ascendente
  if (lagnaIdx >= 0) {
    try {
      for (const sp of await collectSignWindows("Saturno", lagnaIdx, fromMs, toMs)) {
        criticalTransits.push({
          key: "lagna-shani",
          title: "Lagna Shani — Saturno transitando o Ascendente",
          status: transitStatus(parseDashaDate(sp.start), parseDashaDate(sp.end), ref),
          startDate: sp.start, endDate: sp.end,
          ref: "Ascendente",
          detail: "Disciplina rigorosa com saúde e corpo; reformulação da imagem pessoal e das rotinas.",
        });
      }
    } catch { /* omite */ }
  }

  // ─── Nodos ─────────────────────────────────────────────────────────────
  const rahuNatalIdx = byName.get("Nodo Norte") ? SIGN_NAMES.indexOf(byName.get("Nodo Norte").sign) : -1;
  const ketuNatalIdx = byName.get("Nodo Sul") ? SIGN_NAMES.indexOf(byName.get("Nodo Sul").sign) : -1;

  const nodeSpans = async (body: "Rahu" | "Ketu", signIdx: number) => {
    try { return await collectSignWindows(body, signIdx, fromMs, toMs); }
    catch { return []; }
  };
  const addNodeSpans = async (
    key: string, title: string, body: "Rahu" | "Ketu", signIdx: number, refLabel: string, detail: string
  ) => {
    for (const sp of await nodeSpans(body, signIdx)) {
      criticalTransits.push({
        key, title,
        status: transitStatus(parseDashaDate(sp.start), parseDashaDate(sp.end), ref),
        startDate: sp.start, endDate: sp.end, ref: refLabel, detail,
      });
    }
  };

  await addNodeSpans("nodal-inversion", "Inversão Nodal (Rahu sobre o Ketu natal)", "Rahu", ketuNatalIdx,
    "Ketu natal",
    "Colisão kármica entre hábitos consolidados do passado e impulsos de expansão futura — viradas radicais de rumo.");
  await addNodeSpans("nodal-return", "Retorno Nodal (Rahu sobre o Rahu natal)", "Rahu", rahuNatalIdx,
    "Rahu natal",
    "Reativa a missão kármica primária: o eixo Rahu-Ketu volta ao ponto de partida e cobra a direção original.");
  await addNodeSpans("rahu-over-moon", "Rahu em trânsito sobre a Lua natal", "Rahu", moonSignIdx,
    "Lua natal", "Amplificação mental: obsessão, ansiedade ou fascínio emocional no período.");
  await addNodeSpans("ketu-over-moon", "Ketu em trânsito sobre a Lua natal", "Ketu", moonSignIdx,
    "Lua natal", "Desapego e isolamento psíquico: a mente pede silêncio e recolhimento.");
  await addNodeSpans("rahu-over-sun", "Rahu em trânsito sobre o Sol natal", "Rahu", sunSignIdx,
    "Sol natal", "Ambição ampliada com risco de inautenticidade: o ego é inflado e testado.");
  await addNodeSpans("rahu-over-lagna", "Rahu em trânsito sobre o Ascendente", "Rahu", lagnaIdx,
    "Ascendente", "Impulso de reinvenção da identidade: novos apetites, imagem e direção pessoal em mutação.");

  // Eixo nodal sobre casas críticas (1/7 e 2/8 a partir do lagna)
  if (lagnaIdx >= 0) {
    for (const [house, label, detail] of [
      [7, "1ª/7ª — identidade e parcerias", "Rahu-Ketu cortando o eixo eu/outro: redefinições em relacionamentos e parcerias."],
      [2, "2ª/8ª — recursos e longevidade", "Rahu-Ketu cortando o eixo valores/transformação: reconfiguração financeira, heranças e crises de intimidade."],
      [8, "2ª/8ª — recursos e longevidade", "Rahu-Ketu cortando o eixo valores/transformação: reconfiguração financeira, heranças e crises de intimidade."],
    ] as const) {
      const targetSign = (lagnaIdx + house - 1) % 12;
      for (const sp of await nodeSpans("Rahu", targetSign)) {
        criticalTransits.push({
          key: `nodal-axis-${house}`,
          title: `Eixo nodal ativando casas ${label}`,
          status: transitStatus(parseDashaDate(sp.start), parseDashaDate(sp.end), ref),
          startDate: sp.start, endDate: sp.end,
          ref: "Eixo Rahu/Ketu",
          detail,
        });
      }
    }
  }

  return {
    generatedAt: isoDay(ref),
    window: { from: isoDay(fromMs), to: isoDay(toMs) },
    dashas,
    criticalTransits,
    unavailable,
  };
}

function angularRelation(mahaLord: string, antarLord: string, byName: Map<string, any>): string {
  const a = byName.get(mahaLord), b = byName.get(antarLord);
  const ai = a ? SIGN_NAMES.indexOf(a.sign) : -1;
  const bi = b ? SIGN_NAMES.indexOf(b.sign) : -1;
  if (ai < 0 || bi < 0) return "relação indisponível";
  return angularRelationLabel(((bi - ai + 12) % 12) + 1);
}

function taraBalaOf(lord: string, janmaNakIdx: number, byName: Map<string, any>): string {
  const planet = byName.get(lord);
  const lordIdx = nakshatraIndexOf(planet?.nakshatra || "");
  if (janmaNakIdx < 0 || lordIdx < 0) return "Tara Bala indisponível";
  const count = ((lordIdx - janmaNakIdx + 27) % 27) + 1;
  const navatara = ((count - 1) % 9) + 1;
  return `${NAVATARA[navatara]} (tara ${count} a partir da estrela natal)`;
}
