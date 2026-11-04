import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildVedicStructuralMatrix } from "./vedicStructuralEngine";

function planet(over: Partial<any> = {}) {
  return {
    name: "Sol", sign: "Áries", house: 1, degree: 10, longitude: 10,
    nakshatra: "Ashwini", pada: 4, dignity: "Neutro",
    isRetrograde: false, isCombust: false,
    ...over,
  };
}

const basePlanets = () => [
  planet({ name: "Sol", longitude: 10, degree: 10 }),
  planet({ name: "Lua", sign: "Touro", house: 2, degree: 5, longitude: 35 }),
  planet({ name: "Marte", sign: "Gêmeos", house: 3, degree: 15, longitude: 75 }),
  planet({ name: "Mercúrio", sign: "Áries", house: 1, degree: 15, longitude: 15 }),
  planet({ name: "Júpiter", sign: "Câncer", house: 4, degree: 8, longitude: 98 }),
  planet({ name: "Vênus", sign: "Peixes", house: 12, degree: 20, longitude: 350 }),
  planet({ name: "Saturno", sign: "Libra", house: 7, degree: 25, longitude: 205 }),
  planet({ name: "Nodo Norte", sign: "Virgem", house: 6, degree: 12, longitude: 162 }),
  planet({ name: "Nodo Sul", sign: "Peixes", house: 12, degree: 12, longitude: 342 }),
];

function baseProfile(over: Partial<any> = {}) {
  return {
    vedic_natal: { planets: basePlanets(), drishti: [] },
    vedic_specifics: { lagna: "Áries" },
    vedic_balas: {
      shadbala: { Sol: { ratio: 1.4 } },
      ashtakavarga: {
        binna_ashtaka_varga: [
          [4, 5, 3, 6, 4, 3, 5, 4, 6, 5, 4, 3], // Sol
          [5, 4, 6, 3, 4, 5, 3, 4, 4, 5, 6, 4], // Lua
          [3, 4, 5, 4, 6, 3, 4, 5, 3, 4, 5, 4], // Marte
          [5, 3, 4, 5, 3, 4, 6, 3, 4, 5, 4, 5], // Mercúrio
          [6, 5, 4, 3, 5, 6, 4, 3, 5, 4, 3, 5], // Júpiter
          [4, 6, 3, 5, 4, 3, 5, 6, 3, 5, 4, 3], // Vênus
          [3, 3, 4, 5, 3, 4, 5, 4, 5, 3, 4, 5], // Saturno
        ],
        samudhaya_ashtaka_varga: [34, 28, 22, 31, 27, 25, 29, 30, 24, 33, 26, 35],
      },
    },
    vedic_vargas: {
      d9Navamsa: {
        "Sol": "Áries", "Lua": "Virgem", "Marte": "Gêmeos",
        "Mercúrio": "Libra", "Júpiter": "Câncer", "Vênus": "Peixes",
        "Saturno": "Touro", "Nodo Norte": "Virgem", "Nodo Sul": "Peixes",
      },
    },
    ...over,
  };
}

describe("buildVedicStructuralMatrix", () => {
  it("detecta Vargottama quando signo D-1 = signo D-9", () => {
    const m = buildVedicStructuralMatrix(baseProfile());
    const sol = m.planets.find((p) => p.name === "Sol")!;
    const lua = m.planets.find((p) => p.name === "Lua")!;
    assert.equal(sol.vargottama, true);   // Áries em ambos
    assert.equal(lua.vargottama, false);  // Touro vs Virgem
    assert.equal(m.planets.find((p) => p.name === "Vênus")!.vargottama, true); // Peixes/Peixes
  });

  it("detecta Graha Yuddha entre planetas elegíveis no mesmo signo a <1°", () => {
    const profile = baseProfile();
    profile.vedic_natal.planets = basePlanets().map((p) => {
      if (p.name === "Marte") return { ...p, sign: "Gêmeos", house: 3, longitude: 75.4, degree: 15.4 };
      if (p.name === "Mercúrio") return { ...p, sign: "Gêmeos", house: 3, longitude: 75.9, degree: 15.9 };
      return p;
    });
    const m = buildVedicStructuralMatrix(profile);
    const marte = m.planets.find((p) => p.name === "Marte")!;
    assert.ok(marte.grahaYuddha);
    assert.equal(marte.grahaYuddha!.opponent, "Mercúrio");
    assert.equal(marte.grahaYuddha!.winner, "Marte"); // menor grau vence
    const merc = m.planets.find((p) => p.name === "Mercúrio")!;
    assert.equal(merc.grahaYuddha!.winner, "Marte");
  });

  it("não marca Yuddha entre planetas a >1° ou envolvendo Sol/Lua/nodos", () => {
    const m = buildVedicStructuralMatrix(baseProfile());
    assert.equal(m.planets.find((p) => p.name === "Sol")!.grahaYuddha, null);
    assert.equal(m.planets.find((p) => p.name === "Mercúrio")!.grahaYuddha, null); // Sol e Mercúrio a 5° mas Sol não é elegível
  });

  it("detecta combustão por distância angular ao Sol com limiar por planeta", () => {
    const profile = baseProfile();
    // Mercúrio a 5° do Sol → dentro de 13° → combusto
    const m = buildVedicStructuralMatrix(profile);
    const merc = m.planets.find((p) => p.name === "Mercúrio")!;
    assert.equal(merc.combustion.active, true);
    assert.ok(Math.abs(merc.combustion.distanceDeg! - 5) < 0.001);
    // Marte a 65° → não combusto
    const marte = m.planets.find((p) => p.name === "Marte")!;
    assert.equal(marte.combustion.active, false);
  });

  it("detecta Gandanta nas junções Água→Fogo", () => {
    const profile = baseProfile();
    profile.vedic_natal.planets = basePlanets().map((p) =>
      p.name === "Lua" ? { ...p, sign: "Peixes", house: 12, longitude: 359.4, degree: 29.4 } : p
    );
    const m = buildVedicStructuralMatrix(profile);
    assert.equal(m.planets.find((p) => p.name === "Lua")!.gandanta, "Peixes→Áries");
    // Áries a 0.5° também é gandanta
    profile.vedic_natal.planets = basePlanets().map((p) =>
      p.name === "Sol" ? { ...p, longitude: 0.5, degree: 0.5 } : p
    );
    const m2 = buildVedicStructuralMatrix(profile);
    assert.equal(m2.planets.find((p) => p.name === "Sol")!.gandanta, "Peixes→Áries");
    // Longe da junção → null
    assert.equal(m2.planets.find((p) => p.name === "Marte")!.gandanta, null);
  });

  it("calcula Avasthas de idade respeitando ordem ímpar/par de signos", () => {
    const m = buildVedicStructuralMatrix(baseProfile());
    // Sol Áries (ímpar) a 10° → Kumara (6–12)
    assert.match(m.planets.find((p) => p.name === "Sol")!.ageAvastha.label, /Kumara/);
    // Saturno Libra (ímpar) a 25° → Mrita
    assert.match(m.planets.find((p) => p.name === "Saturno")!.ageAvastha.label, /Mrita/);
    // Lua Touro (par) a 5° → faixa 0–6 invertida → Mrita
    assert.match(m.planets.find((p) => p.name === "Lua")!.ageAvastha.label, /Mrita/);
  });

  it("extrai BAV/SAV corretamente", () => {
    const m = buildVedicStructuralMatrix(baseProfile());
    const sol = m.planets.find((p) => p.name === "Sol")!; // Áries idx0, linha Sol
    assert.equal(sol.bav, 4);
    const casa1 = m.houses.find((h) => h.house === 1)!;
    assert.equal(casa1.sav, 34); // samudhaya[0]
    assert.match(casa1.savClass!, /Alta/);
    const casa3 = m.houses.find((h) => h.house === 3)!;
    assert.equal(casa3.sav, 22);
    assert.match(casa3.savClass!, /Baixa/);
  });

  it("marca MKS e Digbala corretamente", () => {
    const m = buildVedicStructuralMatrix(baseProfile());
    // Júpiter casa 4 — Digbala (Júpiter→1? não: Júpiter digbala é casa 1)
    assert.equal(m.planets.find((p) => p.name === "Júpiter")!.digbala, false);
    // Vênus casa 12? MKS de Vênus é casa 6 → false; Saturno casa 7 — digbala sim
    assert.equal(m.planets.find((p) => p.name === "Saturno")!.digbala, true);
    // Sol casa 1 — MKS? MKS de Sol é casa 12 → false; mas Digbala? Sol→10 → false
    assert.equal(m.planets.find((p) => p.name === "Sol")!.mks, false);
    // Move Vênus para casa 6 → MKS
    const profile = baseProfile();
    profile.vedic_natal.planets = basePlanets().map((p) =>
      p.name === "Vênus" ? { ...p, house: 6, sign: "Virgem", longitude: 165 } : p
    );
    const m2 = buildVedicStructuralMatrix(profile);
    assert.equal(m2.planets.find((p) => p.name === "Vênus")!.mks, true);
    assert.match(m2.planets.find((p) => p.name === "Vênus")!.houseType, /MKS/);
  });

  it("detecta Argala e Virodhargala a partir do planeta", () => {
    const m = buildVedicStructuralMatrix(baseProfile());
    // Sol na casa 1. Casa 2 a partir dele = casa 2 (Lua). Casa 4 = casa 4 (Júpiter).
    const sol = m.planets.find((p) => p.name === "Sol")!;
    assert.deepEqual(sol.argala.houses["2"], ["Lua"]);
    assert.deepEqual(sol.argala.houses["4"], ["Júpiter"]);
    // Virodhargala: casa 12 a partir da 1 = casa 12 (Vênus, Nodo Sul)
    assert.deepEqual(sol.virodhargala.houses["12"]!.sort(), ["Ketu", "Vênus"]);
  });

  it("calcula Kartari (Papa quando há maléfico no flanco)", () => {
    const m = buildVedicStructuralMatrix(baseProfile());
    // Sol casa 1: flancos = casa 2 (Lua — benéfico) e casa 12 (Vênus benéfico + Nodo Sul/Ketu maléfico) → Papa
    assert.equal(m.planets.find((p) => p.name === "Sol")!.kartari, "Papa Kartari");
    // Júpiter casa 4: flancos = casas 5 (vazia) e 3 (Marte+Mercúrio — Marte maléfico) → Papa
    assert.equal(m.planets.find((p) => p.name === "Júpiter")!.kartari, "Papa Kartari");
  });

  it("calcula natureza funcional por lagna (Yogakaraka de Saturno para Touro)", () => {
    const profile = baseProfile({ vedic_specifics: { lagna: "Touro" } });
    const m = buildVedicStructuralMatrix(profile);
    // Com lagna Touro: Saturno rege 9 (Capricórnio) e 10 (Aquário) → Yogakaraka
    const sat = m.planets.find((p) => p.name === "Saturno")!;
    assert.match(sat.functionalNature, /Yogakaraka/);
    // Mercúrio rege 2 (Gêmeos) e 5 (Virgem) → Benéfico Funcional
    const merc = m.planets.find((p) => p.name === "Mercúrio")!;
    assert.match(merc.functionalNature, /Benéfico Funcional/);
  });

  it("detecta Neechabhanga (regente da debilitação em Kendra)", () => {
    const profile = baseProfile();
    // Sol debilitado em Libra (casa 7); Vênus (regente de Libra) em Peixes casa 12 — não é Kendra
    // Marte (regente da exaltação do Sol = Áries) casa 3 — não é Kendra → sem neechabhanga
    profile.vedic_natal.planets = basePlanets().map((p) =>
      p.name === "Sol" ? { ...p, sign: "Libra", house: 7, dignity: "Debilitado", longitude: 200 } : p
    );
    let m = buildVedicStructuralMatrix(profile);
    assert.equal(m.planets.find((p) => p.name === "Sol")!.neechabhanga, false);
    // Agora Vênus em Kendra (casa 1)
    profile.vedic_natal.planets = basePlanets().map((p) => {
      if (p.name === "Sol") return { ...p, sign: "Libra", house: 7, dignity: "Debilitado", longitude: 200 };
      if (p.name === "Vênus") return { ...p, sign: "Áries", house: 1, longitude: 20 };
      return p;
    });
    m = buildVedicStructuralMatrix(profile);
    assert.equal(m.planets.find((p) => p.name === "Sol")!.neechabhanga, true);
  });

  it("preenche bhavesha e karakas por casa", () => {
    const m = buildVedicStructuralMatrix(baseProfile());
    // Lagna Áries → casa 4 = Câncer, bhavesha = Lua (Touro casa 2)
    const casa4 = m.houses.find((h) => h.house === 4)!;
    assert.equal(casa4.sign, "Câncer");
    assert.equal(casa4.bhavesha!.name, "Lua");
    assert.equal(casa4.bhavesha!.house, 2);
    // Karakas da casa 4: Lua e Marte
    assert.deepEqual(casa4.karakas.map((k) => k.name).sort(), ["Lua", "Marte"]);
  });

  it("degrada graciosamente sem ashtakavarga nem D-9", () => {
    const profile = baseProfile();
    delete (profile.vedic_balas as any).ashtakavarga;
    delete (profile as any).vedic_vargas;
    const m = buildVedicStructuralMatrix(profile);
    assert.equal(m.planets.find((p) => p.name === "Sol")!.bav, null);
    assert.equal(m.planets.find((p) => p.name === "Sol")!.vargottama, null);
    assert.ok(m.unavailable.length >= 2);
    assert.equal(m.houses[0].sav, null);
  });

  it("exibe Rahu/Ketu como nomes de exibição dos nodos", () => {
    const m = buildVedicStructuralMatrix(baseProfile());
    assert.equal(m.planets.find((p) => p.name === "Nodo Norte")!.displayName, "Rahu");
    assert.equal(m.planets.find((p) => p.name === "Nodo Sul")!.displayName, "Ketu");
  });
});
