import assert from "node:assert/strict";
import test from "node:test";
import {
  splitDynamicsCombinations,
  POOL_YOGA_COUNT,
  POOL_DOSHA_COUNT,
} from "./dynamicsFilter";

test("itens fora dos dois tiers são descartados absolutamente", () => {
  const yogas = ["Dharidhra Yoga: r", "Kapata Yoga: r", "Rajabhrashta Yoga: r", "Vanchana Chora Bheethi Yoga: r"];
  const doshas = ["Dosha Inexistente: r"];
  const split = splitDynamicsCombinations(yogas, doshas);
  assert.equal(split.totalInterpreted, 0);
  assert.equal(split.secondaryCount, 0);
});

test("pool limitado a 5 yogas e 3 doshas, tudo na carga inicial", () => {
  const yogas = [
    "Hamsa Yoga: r", "Raja Yoga: r", "Gaja Kesari Yoga: r", "Dhana Yoga: r",
    "Budhaditya Yoga: r", "Amala Yoga: r", "Vasumathi Yoga: r", "Parijatha Yoga: r",
  ];
  const doshas = [
    "Kala Sarpa Dosha: r", "Manglik Dosha: r", "Guru Chandala Dosha: r", "Pitru Dosha: r", "Ghata Dosha: r",
  ];
  const split = splitDynamicsCombinations(yogas, doshas);
  assert.equal(split.primary.yogas.length, POOL_YOGA_COUNT);
  assert.equal(split.primary.doshas.length, POOL_DOSHA_COUNT);
  assert.equal(split.secondaryCount, 0);
  assert.equal(split.totalInterpreted, POOL_YOGA_COUNT + POOL_DOSHA_COUNT);
});

test("tier 1 sempre precede tier 2, e tier 2 segue ordem de prioridade", () => {
  const yogas = ["Vasumathi Yoga: r", "Subha Yoga: r", "Amala Yoga: r", "Dhana Yoga: r"];
  const split = splitDynamicsCombinations(yogas, []);
  assert.equal(split.primary.yogas[0], "Dhana Yoga: r");   // tier 1
  assert.equal(split.primary.yogas[1], "Amala Yoga: r");   // tier 2, prioridade 1
  assert.equal(split.primary.yogas[2], "Vasumathi Yoga: r"); // tier 2, prioridade 2
  assert.equal(split.primary.yogas[3], "Subha Yoga: r");   // tier 2, última
});

test("sem duplicatas entre primary e secondary", () => {
  const yogas = ["Hamsa Yoga: a", "Raja Yoga: b", "Gaja Kesari Yoga: c", "Dhana Yoga: d", "Budhaditya Yoga: e", "Lakshmi Yoga: f"];
  const doshas = ["Pitru Dosha: x", "Manglik Dosha: y", "Kala Sarpa Dosha: z"];
  const split = splitDynamicsCombinations(yogas, doshas);
  const all = [...split.primary.yogas, ...split.secondary.yogas, ...split.primary.doshas, ...split.secondary.doshas];
  assert.equal(new Set(all).size, all.length);
});

test("deduplica grafias variantes do mesmo yoga", () => {
  const yogas = ["Gaja Kesari Yoga: r", "Gajakesari Yoga: r", "Hamsa Yoga: r"];
  const split = splitDynamicsCombinations(yogas, []);
  assert.equal(split.totalInterpreted, 2);
});

test("listas vazias ou curtas não geram secondary", () => {
  const split = splitDynamicsCombinations(["Raja Yoga: a"], []);
  assert.equal(split.secondaryCount, 0);
  assert.equal(split.totalInterpreted, 1);
  const empty = splitDynamicsCombinations([], []);
  assert.equal(empty.totalInterpreted, 0);
});
