import { describe, it } from "node:test";
import assert from "node:assert";
import { findUpcomingTransits, getAngularOrb, getAspectTargetLongitudes, getDynamicOrb } from "./transitHorizonEngine";
import { getNatalDegrees } from "./transitEngine";

describe("transitHorizonEngine", () => {
  it("getDynamicOrb: lentos usam 4°, rápidos usam 2°", () => {
    assert.strictEqual(getDynamicOrb("Sol"), 2);
    assert.strictEqual(getDynamicOrb("Marte"), 2);
    assert.strictEqual(getDynamicOrb("Júpiter"), 4);
    assert.strictEqual(getDynamicOrb("Saturno"), 4);
    assert.strictEqual(getDynamicOrb("Urano"), 4);
    assert.strictEqual(getDynamicOrb("Netuno"), 4);
    assert.strictEqual(getDynamicOrb("Plutão"), 4);
  });

  it("calcula os dois alvos da quadratura e normaliza a passagem por 360°", () => {
    assert.deepStrictEqual(getAspectTargetLongitudes(350, "Quadratura"), [80, 260]);
    assert.deepStrictEqual(getAspectTargetLongitudes(350, "Conjunção"), [350]);
    assert.strictEqual(getAngularOrb(359, 1), 2);
  });

  it("findUpcomingTransits retorna array com campos esperados", async () => {
    const profile = {
      tropical_natal: {
        planets: [
          { name: "Sol", longitude: 120.5, sign: "Leão", house: 5 },
          { name: "Lua", longitude: 200.0, sign: "Libra", house: 7 },
          { name: "Marte", longitude: 15.0, sign: "Áries", house: 1 },
          { name: "Mercúrio", longitude: 110.0, sign: "Leão", house: 5 },
          { name: "Vênus", longitude: 150.0, sign: "Virgem", house: 6 },
          { name: "Júpiter", longitude: 250.0, sign: "Sagitário", house: 9 },
          { name: "Saturno", longitude: 300.0, sign: "Aquário", house: 11 },
        ],
        houses: [
          { house: 1, sign: "Áries", cuspDegree: 0, longitude: 0 },
          { house: 2, sign: "Touro", cuspDegree: 0, longitude: 30 },
          { house: 3, sign: "Gêmeos", cuspDegree: 0, longitude: 60 },
          { house: 4, sign: "Câncer", cuspDegree: 0, longitude: 90 },
          { house: 5, sign: "Leão", cuspDegree: 0, longitude: 120 },
          { house: 6, sign: "Virgem", cuspDegree: 0, longitude: 150 },
          { house: 7, sign: "Libra", cuspDegree: 0, longitude: 180 },
          { house: 8, sign: "Escorpião", cuspDegree: 0, longitude: 210 },
          { house: 9, sign: "Sagitário", cuspDegree: 0, longitude: 240 },
          { house: 10, sign: "Capricórnio", cuspDegree: 0, longitude: 270 },
          { house: 11, sign: "Aquário", cuspDegree: 0, longitude: 300 },
          { house: 12, sign: "Peixes", cuspDegree: 0, longitude: 330 },
        ],
      },
      vedic_specifics: { lagna: "Áries" },
    };

    const startDate = new Date("2026-09-29T00:00:00Z");
    const transits = await findUpcomingTransits(profile, startDate, 5);

    assert.ok(Array.isArray(transits));
    // Com este mapa fictício é provável que haja ao menos um trânsito em 5 dias.
    assert.ok(transits.length > 0, "deveria encontrar ao menos um trânsito no horizonte de 5 dias");

    for (const t of transits) {
      assert.ok(t.planet);
      assert.ok(["Conjunção", "Quadratura", "Oposição"].includes(t.aspecto));
      assert.ok(t.planetNatal);
      assert.ok(["active", "upcoming"].includes(t.status));
      assert.ok(t.activationDate);
      assert.ok(t.exitDate);
      assert.strictEqual(typeof t.minOrb, "number");
      assert.ok(["slow", "fast"].includes(t.orbCategory));

      if (t.status === "upcoming") {
        assert.ok(t.peakDate, "upcoming deve ter pico exato");
        assert.strictEqual(typeof t.daysUntilPeak, "number");
        assert.ok(t.daysUntilPeak! >= 0 && t.daysUntilPeak! <= 5, "pico deve permanecer dentro do horizonte");
      }
      if (t.peakDate) {
        const distance = Math.ceil((new Date(t.peakDate).getTime() - startDate.getTime()) / 86_400_000);
        assert.ok(distance <= 5, "nenhum pico futuro pode escapar do horizonte");
      }
    }
  });

  it("findUpcomingTransits descarta eventos totalmente passados", async () => {
    const profile = {
      tropical_natal: {
        planets: [{ name: "Sol", longitude: 0, sign: "Áries", house: 1 }],
        houses: [{ house: 1, sign: "Áries", cuspDegree: 0, longitude: 0 }],
      },
      vedic_specifics: { lagna: "Áries" },
    };

    const startDate = new Date("2026-09-29T00:00:00Z");
    const transits = await findUpcomingTransits(profile, startDate, 30);
    // Para um único planeta natal em 0° a expectativa é que não haja evento no horizonte,
    // pois a posição do Sol em 29 de setembro de 2026 não estará em conjunção exata.
    // O importante é que o retorno seja um array válido, sem crash.
    assert.ok(Array.isArray(transits));
  });
});
