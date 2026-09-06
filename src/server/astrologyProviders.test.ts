import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTime,
  parseOffsetToHours,
  getTimezoneOffsetHours,
  validateJHoraResponse,
  hasPlanetaryData,
  buildJHoraBody,
  getRasiChart,
  getVimsottariDasha,
  getNakshatraPada,
  fetchJHoraHoroscope,
  fetchAstrologyProviderResult,
  fetchAstrologyAPIFallback,
  ProviderError,
  type BirthInput,
  type JHoraResponse,
} from "./astrologyProviders.ts";

const sampleBirth: BirthInput = {
  name: "Test",
  date: "1990-06-15",
  time: "14:30",
  latitude: -23.55,
  longitude: -46.63,
  timezone: "America/Sao_Paulo",
  place: "Sao Paulo",
};

function makeValidJHora(): JHoraResponse {
  return {
    birth_details: { date: "1990-06-15" },
    horoscope: {
      divisional_charts: {
        "D-1_rasi": {
          Ascendant: { sign: "Libra", longitude: 14.6 },
          Sun: { sign: "Gemini", longitude: 0.6 },
          Moon: { sign: "Aquarius", longitude: 24.7 },
        },
      },
      nakshatra_pada: {
        Sun: { nakshatra: "Mrigasira", pada: 3 },
      },
      graha_dashas: {
        vimsottari: [
          ["Jupiter-Jupiter-Jupiter", "1984-10-23 11:35:57"],
        ] as any,
      },
    },
  };
}

describe("astrologyProviders helpers", () => {
  test("normalizeTime pads seconds", () => {
    assert.equal(normalizeTime("14:30"), "14:30:00");
    assert.equal(normalizeTime("9:05"), "09:05:00");
    assert.equal(normalizeTime("14:30:15"), "14:30:15");
  });

  test("normalizeTime rejects invalid input", () => {
    assert.throws(() => normalizeTime("bad"), ProviderError);
  });

  test("parseOffsetToHours handles common formats", () => {
    assert.equal(parseOffsetToHours("UTC"), 0);
    assert.equal(parseOffsetToHours("+5:30"), 5.5);
    assert.equal(parseOffsetToHours("-03:00"), -3);
    assert.equal(parseOffsetToHours("-3"), -3);
    assert.equal(parseOffsetToHours("+0530"), 5.5);
    assert.equal(parseOffsetToHours("America/Sao_Paulo"), null);
    assert.equal(parseOffsetToHours("+0530"), 5.5);
  });

  test("getTimezoneOffsetHours resolves IANA at instant", () => {
    // Sao Paulo on 1990-06-15 was UTC-03:00 (no DST in June at that time).
    assert.equal(getTimezoneOffsetHours("America/Sao_Paulo", "1990-06-15", "14:30"), -3);
    assert.equal(getTimezoneOffsetHours("Asia/Kolkata", "1990-06-15", "14:30"), 5.5);
  });

  test("buildJHoraBody uses numeric offset", () => {
    const body = buildJHoraBody(sampleBirth);
    assert.equal(body.date, "1990-06-15");
    assert.equal(body.time, "14:30:00");
    assert.equal(body.latitude, -23.55);
    assert.equal(body.longitude, -46.63);
    assert.equal(typeof body.timezone, "number");
    assert.equal(body.place, "Sao Paulo");
  });

  test("validateJHoraResponse accepts valid chart", () => {
    assert.doesNotThrow(() => validateJHoraResponse(makeValidJHora()));
    assert.equal(hasPlanetaryData(makeValidJHora()), true);
  });

  test("validateJHoraResponse rejects invalid responses", () => {
    assert.throws(() => validateJHoraResponse(null), ProviderError);
    assert.throws(() => validateJHoraResponse({}), ProviderError);
    assert.throws(
      () => validateJHoraResponse({ horoscope: { divisional_charts: {} } }),
      ProviderError
    );
    assert.throws(
      () =>
        validateJHoraResponse({
          horoscope: {
            divisional_charts: { "D-1_rasi": { nothing: true } },
          },
        }),
      ProviderError
    );
  });

  test("getRasiChart locates chart robustly", () => {
    const chart = getRasiChart(makeValidJHora());
    assert.ok(chart);
    assert.equal(chart!.Sun.sign, "Gemini");
  });

  test("getVimsottariDasha locates dasha list", () => {
    const dasha = getVimsottariDasha(makeValidJHora());
    assert.ok(dasha);
    assert.equal(dasha!.length, 1);
  });

  test("getNakshatraPada locates nakshatra section", () => {
    const np = getNakshatraPada(makeValidJHora());
    assert.ok(np);
    assert.equal(np!.Sun.nakshatra, "Mrigasira");
  });
});

describe("fetchJHoraHoroscope mocked", () => {
  let originalFetch: typeof fetch;

  before(() => {
    originalFetch = globalThis.fetch;
  });

  after(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns valid JHora response", async () => {
    const expected = makeValidJHora();
    (globalThis as any).fetch = async () =>
      new Response(JSON.stringify(expected), { status: 200 });

    const res = await fetchJHoraHoroscope(sampleBirth);
    assert.ok(res);
    assert.equal(res.horoscope?.divisional_charts?.["D-1_rasi"]?.Sun?.sign, "Gemini");
  });

  test("retries on 429 then succeeds", async () => {
    let calls = 0;
    const expected = makeValidJHora();
    (globalThis as any).fetch = async () => {
      calls++;
      if (calls === 1) return new Response("rate limited", { status: 429 });
      return new Response(JSON.stringify(expected), { status: 200 });
    };

    const res = await fetchJHoraHoroscope(sampleBirth, { retries: 3, baseDelayMs: 1 } as any);
    assert.equal(calls, 2);
    assert.ok(res);
  });

  test("does not retry 400", async () => {
    let calls = 0;
    (globalThis as any).fetch = async () => {
      calls++;
      return new Response("bad request", { status: 400 });
    };

    await assert.rejects(() =>
      fetchJHoraHoroscope(sampleBirth, { retries: 3, baseDelayMs: 1 } as any)
    );
    assert.equal(calls, 1);
  });

  test("retries network error then succeeds", async () => {
    let calls = 0;
    const expected = makeValidJHora();
    (globalThis as any).fetch = async () => {
      calls++;
      if (calls === 1) throw new TypeError("network down");
      return new Response(JSON.stringify(expected), { status: 200 });
    };

    const res = await fetchJHoraHoroscope(sampleBirth, { retries: 3, baseDelayMs: 1 } as any);
    assert.equal(calls, 2);
    assert.ok(res);
  });
});

describe("fetchAstrologyProviderResult fallback flow", () => {
  let originalFetch: typeof fetch;

  before(() => {
    originalFetch = globalThis.fetch;
  });

  after(() => {
    globalThis.fetch = originalFetch;
  });

  test("uses AstrologyAPI fallback when JHora fails", async () => {
    const planets = [
      {
        id: 0,
        name: "Sun",
        fullDegree: 72.1,
        normDegree: 12.1,
        sign: "Gemini",
        signLord: "Mercury",
        nakshatra: "Ardra",
        nakshatraLord: "Rahu",
        nakshatra_pad: 2,
        house: 9,
        isRetro: "false",
      },
    ];
    const dasha = [
      {
        planet: "Ketu",
        planet_id: 8,
        start: "2-5-1994 14:7",
        end: "2-5-2001 8:7",
      },
    ];

    (globalThis as any).fetch = async (url: string) => {
      if (url.includes("/horoscope")) {
        return new Response("JHora down", { status: 500 });
      }
      if (url.includes("/planets/extended")) {
        return new Response(JSON.stringify(planets), { status: 200 });
      }
      if (url.includes("/major_vdasha")) {
        return new Response(JSON.stringify(dasha), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    };

    const result = await fetchAstrologyProviderResult(sampleBirth, {
      jhoraUrl: "http://localhost:9999",
      astrologyApiKey: "test-key",
    } as any);

    assert.equal(result.meta.source, "astrologyapi");
    assert.equal(result.meta.status, "partial");
    assert.ok(result.astrologyapi);
    assert.equal(result.astrologyapi!.planets.length, 1);
    assert.equal(result.astrologyapi!.majorDasha.length, 1);
    assert.equal(result.meta.attempted.includes("jhora"), true);
    assert.equal(result.meta.attempted.includes("astrologyapi"), true);
  });

  test("throws when no API key configured for fallback", async () => {
    (globalThis as any).fetch = async (url: string) => {
      if (url.includes("/horoscope")) {
        return new Response("JHora down", { status: 500 });
      }
      return new Response("not found", { status: 404 });
    };

    await assert.rejects(
      () =>
        fetchAstrologyProviderResult(sampleBirth, {
          jhoraUrl: "http://bad-host",
        } as any),
      ProviderError
    );
  });
});
