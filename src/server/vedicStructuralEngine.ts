/**
 * Motor determinístico de análise estrutural védica (Rasi/D-1 + Navamsha/D-9).
 * Deriva, a partir do CompleteAstrologicalProfile (dados JHora), a matriz de
 * fatores clássicos usada pelo relatório estrutural do admin:
 * combustão (Asta), Graha Yuddha, Argala/Virodhargala, Vargottama, Gandanta,
 * Avasthas de idade e consciência, BAV/SAV, Digbala, MKS, Kartari,
 * Neechabhanga e natureza funcional por lagna.
 *
 * Nomes de grahas seguem o formato já persistido no perfil:
 * Sol, Lua, Marte, Mercúrio, Júpiter, Vênus, Saturno, Nodo Norte (Rahu), Nodo Sul (Ketu).
 */

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
