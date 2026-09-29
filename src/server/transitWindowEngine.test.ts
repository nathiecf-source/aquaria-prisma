import assert from "node:assert/strict";
import test from "node:test";
import {
  getPlanetLongitude,
  findSignWindow,
  findCuspPeakDate,
  getPlanetSpeedGroup,
} from "./transitWindowEngine";

test("getPlanetLongitude retorna longitude consistente para Sol", async () => {
  const date = new Date("2026-03-20T12:00:00Z");
  const lon = await getPlanetLongitude("Sol", date);
  assert.ok(lon >= 0 && lon < 360);
  // Sol próximo ao equinócio de março (~0° Áries)
  const normalized = ((lon % 360) + 360) % 360;
  assert.ok(normalized < 5 || normalized > 355, `longitude do Sol ${lon}`);
});

test("getPlanetSpeedGroup classifica planetas corretamente", () => {
  assert.equal(getPlanetSpeedGroup("Sol"), "fast");
  assert.equal(getPlanetSpeedGroup("Marte"), "fast");
  assert.equal(getPlanetSpeedGroup("Júpiter"), "medium");
  assert.equal(getPlanetSpeedGroup("Saturno"), "medium");
  assert.equal(getPlanetSpeedGroup("Urano"), "slow");
  assert.equal(getPlanetSpeedGroup("Netuno"), "slow");
  assert.equal(getPlanetSpeedGroup("Plutão"), "slow");
});

test("findSignWindow: Sol em junho retorna ingresso e saída no mesmo signo", async () => {
  const ref = new Date("2026-06-15T00:00:00Z");
  const lon = await getPlanetLongitude("Sol", ref);
  const signIdx = Math.floor(((lon % 360) + 360) % 360 / 30);
  assert.equal(signIdx, 2); // Gêmeos

  const window = await findSignWindow("Sol", ref, 1);
  assert.ok(window.ingressDate < ref);
  assert.ok(window.egressDate);
  assert.ok(window.egressDate! > ref);

  // Ingresso próximo de 20 de maio e saída próximo de 21 de junho
  assert.equal(window.ingressDate.getUTCMonth(), 4); // maio
  assert.ok(window.ingressDate.getUTCDate() >= 19);
  assert.equal(window.egressDate!.getUTCMonth(), 5); // junho
  assert.ok(window.egressDate!.getUTCDate() >= 19);
});

test("findSignWindow: Plutão em 2026 retorna ingresso recente e saída distante", async () => {
  const ref = new Date("2026-06-01T00:00:00Z");
  const window = await findSignWindow("Plutão", ref, 30);
  assert.ok(window.ingressDate);
  assert.ok(window.egressDate);
  // Plutão entrou em Aquário entre 2022 e 2024 no modelo linear; saída é décadas à frente
  assert.ok(window.ingressDate.getUTCFullYear() >= 2022);
  assert.ok(window.ingressDate.getUTCFullYear() <= 2025);
  assert.ok(window.egressDate!.getUTCFullYear() >= 2030);
});

test("findCuspPeakDate: Sol cruza um grau alvo dentro de poucos dias", async () => {
  const ref = new Date("2026-03-15T00:00:00Z");
  const target = 0; // 0° Áries, equinócio
  const peak = await findCuspPeakDate("Sol", target, ref, 1);
  assert.ok(peak);
  // Pico deve estar entre 15 e 25 de março
  assert.ok(peak!.getUTCMonth() === 2);
  assert.ok(peak!.getUTCDate() >= 18 && peak!.getUTCDate() <= 22);
});

test("performance: calcular janelas para 7 planetas leva menos de 3 segundos", async () => {
  const ref = new Date("2026-06-15T00:00:00Z");
  const planets = ["Sol", "Marte", "Júpiter", "Saturno", "Urano", "Netuno", "Plutão"];
  const start = Date.now();
  await Promise.all(planets.map(p => findSignWindow(p, ref, 30)));
  const elapsed = Date.now() - start;
  assert.ok(elapsed < 3000, `tempo decorrido: ${elapsed}ms`);
});
