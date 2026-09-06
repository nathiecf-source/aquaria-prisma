import assert from "node:assert/strict";
import test from "node:test";
import { calculateLocalTropicalPositions, calculateSolarReturnChart, findExactSolarReturnInstant } from "./solarReturnEngine";

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
