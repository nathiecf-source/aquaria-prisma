import assert from "node:assert/strict";
import test from "node:test";
import { createCycleSignature, createDashaSignature, createPortalSignature, createTransitSignature } from "./cycleNotice";

const aspect = {
  planeta_transito: "Júpiter",
  aspecto: "Conjunção" as const,
  planeta_natal: "Sol",
  grau_transito: 15,
  grau_natal: 14,
  distancia: 1,
  casa_natal: 5,
  ritmo_tempo: "Médio prazo",
};

test("creates the same signature regardless of identity order", () => {
  assert.equal(createCycleSignature(["B", "A"]).signature, createCycleSignature(["A", "B"]).signature);
});

test("transit signature ignores moving degrees, orb and generated text", () => {
  const first = createTransitSignature([aspect]);
  const second = createTransitSignature([{ ...aspect, grau_transito: 16.5, distancia: 2.5, ritmo_tempo: "Outro texto" }]);
  assert.equal(first.signature, second.signature);
});

test("transit signature changes when a displayed block enters or leaves", () => {
  const first = createTransitSignature([aspect]);
  const second = createTransitSignature([aspect, { ...aspect, planeta_transito: "Saturno", aspecto: "Oposição", casa_natal: 12 }]);
  assert.notEqual(first.signature, second.signature);
});

test("portal signature does not depend on rapid activations or generated text", () => {
  const profection = {
    age: 38,
    profectedHouse: 3,
    sign: "Gêmeos",
    primaryLord: "Mercúrio",
    source: "ruler",
    lords: [{ name: "Mercúrio", source: "ruler", sign: "Virgem", house: 6 }],
    reading: "Texto variável",
    activations: [{ planet: "Lua" }],
  };
  const first = createPortalSignature(profection, 2026);
  const second = createPortalSignature({ ...profection, reading: "Outra redação", activations: [{ planet: "Sol" }] }, 2026);
  assert.equal(first.signature, second.signature);
});

test("dasha signature changes with the displayed triad", () => {
  const first = createDashaSignature({ mahadasha: "Lua", antardasha: "Vênus", pratyantardasha: "Vênus" });
  const second = createDashaSignature({ mahadasha: "Lua", antardasha: "Vênus", pratyantardasha: "Sol" });
  assert.notEqual(first.signature, second.signature);
});
