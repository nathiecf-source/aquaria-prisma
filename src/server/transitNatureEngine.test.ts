import assert from "node:assert/strict";
import test from "node:test";
import { getTransitNature } from "./transitNatureEngine";

test("Júpiter em signo de domicílio + casa angular = Terreno Favorável", () => {
  const result = getTransitNature("Júpiter", 30 * 4 + 15, 1); // 15° Leão, Casa 1
  assert.equal(result.label, "Terreno Favorável");
  assert.ok(result.sentence.includes("apoio"));
});

test("Saturno em Queda/Exílio + dusthana = Terreno Restritivo", () => {
  // Saturno em Áries (~0° Áries) é exílio (fall?) no fichamento: detriment Sagitário/Peixes, fall Leão.
  // Vamos usar Marte em Câncer (detriment? No fichamento Marte exaltado em Capricórnio, detriment em Libra/Touro? Câncer é neutro).
  // Para garantir terreno restritivo, use Saturno em Casa 12 (dusthana) sem domicílio.
  const result = getTransitNature("Saturno", 15, 12); // 15° Áries, Casa 12
  assert.equal(result.label, "Terreno Restritivo");
  assert.ok(result.sentence.includes("exigem"));
});

test("Vênus em signo neutro + casa cadente = Terreno Neutro", () => {
  const result = getTransitNature("Vênus", 30 * 3 + 10, 3); // 10° Câncer, Casa 3
  assert.equal(result.label, "Terreno Neutro");
  assert.ok(result.sentence.includes("depende"));
});

test("Netuno em Casa 9 (trikona) = Terreno Neutro ou Favorável", () => {
  const result = getTransitNature("Netuno", 30 * 8 + 20, 9); // 20° Sagitário, Casa 9
  assert.ok(["Terreno Neutro", "Terreno Favorável"].includes(result.label));
});
