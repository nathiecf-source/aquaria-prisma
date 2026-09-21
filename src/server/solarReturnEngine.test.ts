import assert from "node:assert/strict";
import test from "node:test";
import { analyzeSolarReturnChart, calculateLocalTropicalPositions, calculateSolarReturnChart, findExactSolarReturnInstant, getSolarReturnLunarPhase } from "./solarReturnEngine";

const birthData = {
  birthDate: "1990-01-01",
  birthTime: "06:30",
  birthPlace: {
    latitude: 12.9716,
    longitude: 77.5946,
    timezone: "Asia/Kolkata",
  },
};

const natal = { planets: [{ name: "Sol", longitude: 280.34951696016424 }] };

test("finds the local solar return within one arcsecond", () => {
  const instant = findExactSolarReturnInstant(birthData, 2026, natal);
  const longitude = calculateLocalTropicalPositions(instant).Sol;
  const error = Math.abs(((longitude - natal.planets[0].longitude + 540) % 360) - 180);
  assert.ok(error <= 1 / 3600, `solar longitude error was ${error}°`);
});

test("builds a complete local Placidus chart", () => {
  const chart = calculateSolarReturnChart(birthData, 2026, natal);
  assert.equal(chart.houses.length, 12);
  assert.ok(chart.planets.length >= 9);
  assert.ok(chart.planets.every((planet) => planet.house >= 1 && planet.house <= 12));
  assert.match(chart.exactReturnInstant || "", /^2025-12-3[01]T/);
});

test("keeps the return instant while changing the annual location", () => {
  const first = calculateSolarReturnChart(birthData, 2026, natal, {
    location: { name: "São Paulo", latitude: -23.55, longitude: -46.63, timezone: "America/Sao_Paulo" },
  });
  const second = calculateSolarReturnChart(birthData, 2026, natal, {
    location: { name: "Lisboa", latitude: 38.72, longitude: -9.14, timezone: "Europe/Lisbon" },
  });
  assert.equal(first.exactReturnInstant, second.exactReturnInstant);
  assert.notEqual(first.houses[0].longitude, second.houses[0].longitude);
});

test("classifies lunar phases across the zodiac boundary", () => {
  assert.equal(getSolarReturnLunarPhase(355, 2), "Lua Nova");
  assert.equal(getSolarReturnLunarPhase(0, 90), "Quarto Crescente");
  assert.equal(getSolarReturnLunarPhase(10, 190), "Lua Cheia");
});

test("derives annual overlay, stellium and cycle flags", () => {
  const houses = Array.from({ length: 12 }, (_, index) => ({
    house: index + 1, cuspDegree: 0, longitude: index * 30, sign: ["Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem", "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"][index], ruler: "Marte",
  }));
  const planet = (name: string, longitude: number, isRetrograde = false) => ({
    name, longitude, sign: ["Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem", "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"][Math.floor(longitude / 30)], degree: longitude % 30, house: Math.floor(longitude / 30) + 1, isRetrograde, ruler: "Marte",
  });
  const chart = {
    houses,
    planets: [planet("Sol", 5), planet("Lua", 12), planet("Marte", 20), planet("Mercúrio", 80), planet("Vênus", 130), planet("Júpiter", 170), planet("Saturno", 210), planet("Urano", 250), planet("Netuno", 290), planet("Plutão", 6)],
    aspects: [], exactReturnInstant: "2026-01-01T00:00:00.000Z",
  };
  const natalChart = {
    houses,
    planets: [planet("Sol", 5), planet("Lua", 10)],
  };
  const analysis = analyzeSolarReturnChart(chart, natalChart, 19, { name: "São Paulo", latitude: -23.55, longitude: -46.63, timezone: "America/Sao_Paulo" });
  assert.equal(analysis.ascendant.natalHouse, 1);
  assert.equal(analysis.stellium?.sign, "Áries");
  assert.deepEqual(analysis.stellium?.planets, ["Sol", "Lua", "Marte", "Plutão"]);
  assert.equal(analysis.cycles.metonic, true);
  assert.deepEqual(analysis.cycles.slowPlanetOnSun, { planet: "Plutão", orb: 1 });
});
