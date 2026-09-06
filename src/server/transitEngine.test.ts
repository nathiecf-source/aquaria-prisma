import assert from "node:assert/strict";
import test from "node:test";
import {
  getAshtakavargaScore,
  classifyBavTerrain,
  classifySavStrength,
  getVedicTransitTerrain,
  SIGN_NAMES,
} from "./transitEngine";

const sampleAshtakavarga = {
  binna_ashtaka_varga: [
    [6, 0, 2, 5, 2, 6, 5, 4, 4, 5, 4, 5],   // Sol
    [4, 3, 3, 6, 6, 2, 2, 4, 7, 4, 3, 5],   // Lua
    [5, 1, 1, 4, 3, 4, 5, 4, 3, 2, 1, 6],   // Marte
    [6, 6, 2, 5, 3, 4, 5, 7, 3, 5, 4, 4],   // Mercúrio
    [4, 3, 7, 3, 6, 5, 4, 1, 6, 6, 4, 7],   // Júpiter
    [5, 6, 4, 2, 4, 3, 5, 4, 3, 7, 5, 4],   // Vênus
    [4, 3, 2, 4, 2, 2, 3, 2, 5, 4, 3, 5],   // Saturno
    [5, 4, 4, 4, 5, 2, 3, 5, 6, 3, 2, 6],   // Ascendente
  ],
  samudhaya_ashtaka_varga: [34, 22, 21, 29, 26, 26, 29, 26, 31, 33, 24, 36],
};

const profile = {
  vedic_specifics: { lagna: "Libra" },
  vedic_balas: { ashtakavarga: sampleAshtakavarga },
};

const ayanamsha2026 = 23.853056 + (2026 - 2000) * 0.0139697;

// Tropical = ayanamsha + 10° => sideral = 10° Áries.
// Com Ascendente Sideral em Libra (índice 6), Áries (índice 0) cai na 7ª casa védica.
const tropicalAries10 = 10 + ayanamsha2026;
const expectedSideralSign = "Áries";
const expectedVedicHouse = 7;

test("calculates vedic terrain for a known transit", () => {
  const result = getVedicTransitTerrain(profile, "Sol", tropicalAries10, 10, new Date("2026-01-15"));
  assert.ok(result);
  assert.equal(result!.sideral_sign, expectedSideralSign);
  assert.equal(result!.sideral_house, expectedVedicHouse);
  assert.equal(result!.ashtakavarga_score, 6); // Sol (linha 0), coluna Áries (0)
  assert.equal(result!.terrain_classification, "Fértil");
  assert.equal(result!.sav_score, 34); // SAV da coluna Áries
  assert.equal(result!.sav_classification, "potente");
  assert.equal(result!.divergences.house_shift.has_shift, true);
  assert.equal(result!.divergences.house_shift.tropical_house, 10);
  assert.equal(result!.divergences.house_shift.vedic_house, 7);
  assert.ok(result!.divergences.house_shift.interpretation_key.includes("Casa 10"));
  assert.ok(result!.divergences.house_shift.interpretation_key.includes("Casa 7"));
});

test("classifies BAV terrain correctly", () => {
  assert.equal(classifyBavTerrain(0), "Árido");
  assert.equal(classifyBavTerrain(2), "Árido");
  assert.equal(classifyBavTerrain(3), "Neutro");
  assert.equal(classifyBavTerrain(4), "Neutro");
  assert.equal(classifyBavTerrain(5), "Fértil");
  assert.equal(classifyBavTerrain(8), "Fértil");
  assert.equal(classifyBavTerrain(null), "Indisponível");
});

test("classifies SAV strength correctly", () => {
  assert.equal(classifySavStrength(23), "escassa");
  assert.equal(classifySavStrength(26), "limitada");
  assert.equal(classifySavStrength(29), "equilibrada");
  assert.equal(classifySavStrength(32), "favorecida");
  assert.equal(classifySavStrength(35), "potente");
  assert.equal(classifySavStrength(null), "Indisponível");
});

test("returns null when vedic ascendant is missing", () => {
  const result = getVedicTransitTerrain({ vedic_specifics: {} }, "Sol", tropicalAries10, 10);
  assert.equal(result, null);
});

test("returns null when lagna sign is unknown", () => {
  const result = getVedicTransitTerrain({ vedic_specifics: { lagna: "Unknown" } }, "Sol", tropicalAries10, 10);
  assert.equal(result, null);
});

test("extracts BAV and SAV from JHora ashtakavarga shape", () => {
  const { bav, sav } = getAshtakavargaScore(sampleAshtakavarga, "Sol", 2);
  assert.equal(bav, 2);
  assert.equal(sav, 21);
});

test("returns null scores for missing or malformed ashtakavarga", () => {
  const { bav, sav } = getAshtakavargaScore({}, "Sol", 2);
  assert.equal(bav, null);
  assert.equal(sav, null);
});

test("returns null BAV for unknown planet", () => {
  const { bav, sav } = getAshtakavargaScore(sampleAshtakavarga, "Plutão", 2);
  assert.equal(bav, null);
  assert.equal(sav, 21);
});

test("returns terrain with unavailable scores when ashtakavarga is missing but lagna exists", () => {
  const partialProfile = { vedic_specifics: { lagna: "Libra" }, vedic_balas: {} };
  const result = getVedicTransitTerrain(partialProfile, "Sol", tropicalAries10, 10, new Date("2026-01-15"));
  assert.ok(result);
  assert.equal(result!.sideral_sign, expectedSideralSign);
  assert.equal(result!.sideral_house, expectedVedicHouse);
  assert.equal(result!.ashtakavarga_score, null);
  assert.equal(result!.terrain_classification, "Indisponível");
  assert.equal(result!.sav_score, null);
  assert.equal(result!.sav_classification, "Indisponível");
});

test("detects no house shift when tropical and vedic houses coincide", () => {
  // Ascendente em Libra -> Libra é a Casa 1. Tropical = 180° + ayanamsha => sideral = 180° Libra.
  const tropicalLibra = 180 + ayanamsha2026;
  const result = getVedicTransitTerrain(profile, "Sol", tropicalLibra, 1, new Date("2026-01-15"));
  assert.ok(result);
  assert.equal(result!.sideral_sign, "Libra");
  assert.equal(result!.sideral_house, 1);
  assert.equal(result!.divergences.house_shift.has_shift, false);
});
