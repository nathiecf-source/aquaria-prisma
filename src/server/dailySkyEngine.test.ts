import assert from "node:assert/strict";
import test from "node:test";
import { karanaFor, nityaYogaFor, padaFor, tithiFor, varaFor, zonedDateTime } from "./dailySkyEngine";

test("converts 08:00 in Sao Paulo to UTC", () => {
  assert.equal(zonedDateTime("2026-09-19", "08:00").toISOString(), "2026-09-19T11:00:00.000Z");
});

test("uses historical daylight saving offset", () => {
  assert.equal(zonedDateTime("2018-12-15", "08:00").toISOString(), "2018-12-15T10:00:00.000Z");
});

test("classifies waxing and waning tithis", () => {
  assert.deepEqual(tithiFor(0), { name: "Pratipada (Shukla Paksha)", number: 1, paksha: "Shukla Paksha", purpose: "iniciar com presença" });
  assert.equal(tithiFor(180).name, "Pratipada (Krishna Paksha)");
  assert.equal(tithiFor(359.9).name, "Amavasya (Krishna Paksha)");
});

test("follows movable and fixed Karana sequence", () => {
  assert.equal(karanaFor(0), "Kimstughna");
  assert.equal(karanaFor(6), "Bava");
  assert.equal(karanaFor(12), "Balava");
  assert.equal(karanaFor(342), "Shakuni");
  assert.equal(karanaFor(348), "Chatushpada");
  assert.equal(karanaFor(354), "Naga");
});

test("classifies all four Nakshatra padas at exact boundaries", () => {
  assert.equal(padaFor(0), 1);
  assert.equal(padaFor(10 / 3), 2);
  assert.equal(padaFor(20 / 3), 3);
  assert.equal(padaFor(10), 4);
});

test("calculates Nitya Yoga from the sidereal luminary sum", () => {
  assert.deepEqual(nityaYogaFor(0, 0), { name: "Vishkambha", nature: "desafiadora", purpose: "reconhecer obstáculos antes de avançar" });
  assert.equal(nityaYogaFor(10, 10).name, "Priti");
});

test("maps Vara to the weekday and ruler in Sao Paulo", () => {
  assert.deepEqual(varaFor(new Date("2026-09-19T11:00:00Z")), { name: "Śanivāra", weekday: "Sábado", ruler: "Saturno" });
});
