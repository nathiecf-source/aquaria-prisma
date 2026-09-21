import assert from "node:assert/strict";
import test from "node:test";
import {
  splitDynamicsCombinations,
  PRIMARY_YOGA_COUNT,
  PRIMARY_DOSHA_COUNT,
  SECONDARY_YOGA_COUNT,
  SECONDARY_DOSHA_COUNT,
} from "./dynamicsFilter";

test("itens fora da whitelist são descartados absolutamente", () => {
  const yogas = ["Vesai Yoga: r", "Kedara Yoga: r", "Subha Yoga: r", "Anaphaa Yoga: r"];
  const doshas = ["Ghata Dosha: r", "Kalathra Dosha: r", "Shrapit Dosha: r"];
  const split = splitDynamicsCombinations(yogas, doshas);
  assert.equal(split.totalInterpreted, 0);
  assert.equal(split.secondaryCount, 0);
});

test("primary recebe no máximo 4 yogas e 2 doshas", () => {
  const yogas = [
    "Hamsa Yoga: r", "Raja Yoga: r", "Gaja Kesari Yoga: r", "Dhana Yoga: r",
    "Budhaditya Yoga: r", "Neecha Bhanga Raja Yoga: r", "Chandra-Mangala Yoga: r", "Lakshmi Yoga: r",
  ];
  const doshas = [
    "Kala Sarpa Dosha: r", "Manglik Dosha: r", "Guru Chandala Dosha: r", "Pitru Dosha: r", "Kemadruma Dosha: r",
  ];
  const split = splitDynamicsCombinations(yogas, doshas);
  assert.equal(split.primary.yogas.length, PRIMARY_YOGA_COUNT);
  assert.equal(split.primary.doshas.length, PRIMARY_DOSHA_COUNT);
  assert.equal(split.secondary.yogas.length, SECONDARY_YOGA_COUNT);
  assert.equal(split.secondary.doshas.length, SECONDARY_DOSHA_COUNT);
  assert.equal(split.totalInterpreted, 13);
});

test("whitelist ordena por peso: Mahapurusha e Raja antes de Dhana", () => {
  const yogas = ["Dhana Yoga: r", "Gaja Kesari Yoga: r", "Raja Yoga: r", "Hamsa Yoga: r"];
  const split = splitDynamicsCombinations(yogas, []);
  assert.equal(split.primary.yogas[0], "Hamsa Yoga: r");
  assert.equal(split.primary.yogas[1], "Raja Yoga: r");
  assert.equal(split.primary.yogas[2], "Gaja Kesari Yoga: r");
  assert.equal(split.primary.yogas[3], "Dhana Yoga: r");
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
