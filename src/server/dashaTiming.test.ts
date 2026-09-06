import assert from "node:assert/strict";
import test from "node:test";
import { mapTiming } from "./astrology";
import type { AstrologyProviderResult, JHoraDashaEntry } from "./astrologyProviders";

const periods: JHoraDashaEntry[] = [
  ["Moon-Moon-Moon", "2018-10-09 20:56:28"],
  ["Moon-Kethu-Mercury", "2026-07-11 07:11:06"],
  ["Moon-Venus-Venus", "2026-08-10 11:36:36"],
  ["Moon-Venus-Sun", "2026-11-19 22:39:09"],
  ["Moon-Venus-Moon", "2026-12-20 09:09:55"],
  ["Moon-Venus-Kethu", "2028-03-05 17:35:59"],
  ["Moon-Sun-Sun", "2028-04-10 05:51:53"],
  ["Moon-Sun-Venus", "2028-09-09 10:25:42"],
  ["Mars-Mars-Mars", "2028-10-09 20:56:28"],
];

const result: AstrologyProviderResult = {
  jhora: { horoscope: { graha_dashas: { vimsottari: periods } } },
  meta: { source: "jhora", status: "full", attempted: ["jhora"], errors: [] },
};

test("derives independent Maha, Antar and Pratyantar boundaries", () => {
  const timing = mapTiming(result, "2026-09-06");
  assert.deepEqual(
    [timing.mahadasha, timing.antardasha, timing.pratyantardasha],
    ["Lua", "Vênus", "Vênus"],
  );
  assert.equal(timing.mahadashaStart, "2018-10-09 20:56:28");
  assert.equal(timing.mahadashaEnd, "2028-10-09 20:56:28");
  assert.equal(timing.antardashaStart, "2026-08-10 11:36:36");
  assert.equal(timing.antardashaEnd, "2028-04-10 05:51:53");
  assert.equal(timing.pratyantardashaEnd, "2026-11-19 22:39:09");
  assert.equal(timing.nextPratyantardasha, "Sol");
  assert.equal(timing.nextPratyantardashaStart, "2026-11-19 22:39:09");
});
