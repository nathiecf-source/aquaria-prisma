/**
 * External astrology provider clients.
 *
 * Exports/contracts:
 *  - BirthInput: standalone birth-input shape (no import from astrology.ts to avoid cycles)
 *  - fetchJHoraHoroscope(input): POST to {JHORA_API_URL}/horoscope, returns the raw JHora JSON
 *  - fetchAstrologyAPIFallback(input): POST to /v1/planets/extended and /v1/major_vdasha,
 *    returns { planets, majorDasha }
 *  - fetchAstrologyProviderResult(input): tries JHora first, then AstrologyAPI fallback;
 *    returns { jhora?, astrologyapi?, meta: { source, status: 'full'|'partial', attempted, errors } }
 *  - Robust IANA -> numeric offset helper (getTimezoneOffsetHours)
 *  - JHora section locators: getRasiChart, getNakshatraPada, getPlanetaryStates,
 *    getShadBala, getVimsottariDasha, hasPlanetaryData, validateJHoraResponse
 *
 * Assumptions:
 *  - JHora default base URL: https://jagannatha-hora-359167915530.europe-west1.run.app
 *    (observed from the live root endpoint). Override with JHORA_API_URL.
 *  - JHora /horoscope expects { date, time (HH:MM:SS), latitude, longitude, timezone (numeric), place }.
 *  - AstrologyAPI base URL: https://json.astrologyapi.com/v1. Auth header: x-astrologyapi-key.
 *  - AstrologyAPI endpoints tested: /v1/planets/extended and /v1/major_vdasha.
 *  - A JHora response is considered valid only when it is an object with horoscope.divisional_charts
 *    containing at least one recognizable planetary chart (e.g. D-1_rasi with Sun/Moon/Ascendant).
 *  - fetch() is the global Node/Web fetch (Node 18+ / tsx runtime).
 *  - API keys are NEVER logged.
 */

const DEFAULT_JHORA_URL = "https://jagannatha-hora-359167915530.europe-west1.run.app";
const DEFAULT_ASTROLOGY_API_BASE = "https://json.astrologyapi.com/v1";
const getJHoraUrl = () => process.env.JHORA_API_URL || DEFAULT_JHORA_URL;
const getAstrologyApiBase = () => process.env.ASTROLOGY_API_URL || DEFAULT_ASTROLOGY_API_BASE;
const getAstrologyApiKey = () => process.env.ASTROLOGY_API_KEY || "";

const TAG = "[astrologyProviders]";

export interface BirthInput {
  name?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or HH:MM:SS
  latitude: number;
  longitude: number;
  timezone: string; // IANA name (e.g. "America/Sao_Paulo") or numeric offset ("-3", "+5:30")
  place: string;
}

export interface JHoraResponse {
  birth_details?: Record<string, unknown>;
  horoscope?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface JHoraPlanetEntry {
  sign: string;
  longitude: number;
  [key: string]: unknown;
}

export type JHoraDashaEntry = [string, string];

export interface AstrologyAPIPlanet {
  id: number;
  name: string;
  fullDegree: number;
  normDegree: number;
  sign: string;
  signLord: string;
  nakshatra: string;
  nakshatraLord: string;
  nakshatra_pad: number;
  house: number;
  isRetro: string | boolean;
  [key: string]: unknown;
}

export interface AstrologyAPIDasha {
  planet: string;
  planet_id: number;
  start: string;
  end: string;
}

export interface AstrologyAPIResponse {
  planets: AstrologyAPIPlanet[];
  majorDasha: AstrologyAPIDasha[];
}

export interface AstrologyProviderResult {
  jhora?: JHoraResponse;
  astrologyapi?: AstrologyAPIResponse;
  meta: {
    source: "jhora" | "astrologyapi";
    status: "full" | "partial";
    attempted: string[];
    errors: string[];
  };
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly context?: { attempted: string[]; errors: string[] }
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

class ProviderHttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ProviderHttpError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error && typeof error === "object") {
    const name = (error as Error).name;
    return name === "AbortError" || name === "FetchError";
  }
  return false;
}

export function normalizeTime(time: string): string {
  const clean = time.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(clean)) return clean;
  if (/^\d{2}:\d{2}$/.test(clean)) return `${clean}:00`;
  // accept H:MM as well and pad hour
  const m = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) throw new ProviderError(`Invalid time format: ${time}`);
  const h = m[1].padStart(2, "0");
  const min = m[2];
  const s = (m[3] || "00").padStart(2, "0");
  return `${h}:${min}:${s}`;
}

function splitDate(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) {
    throw new ProviderError(`Invalid date format: ${dateStr}`);
  }
  return { year, month, day };
}

function splitTime(timeStr: string): { hour: number; minute: number; second: number } {
  const normalized = normalizeTime(timeStr);
  const [hour, minute, second] = normalized.split(":").map(Number);
  return { hour, minute, second };
}

function localToUtcTimestamp(
  dateStr: string,
  timeStr: string,
  offsetHours = 0
): number {
  const { year, month, day } = splitDate(dateStr);
  const { hour, minute, second } = splitTime(timeStr);
  return Date.UTC(year, month - 1, day, hour, minute, second) - offsetHours * 3600000;
}

function formatOffsetFromIntl(timezone: string, utcMs: number): number | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    });
    const parts = formatter.formatToParts(new Date(utcMs));
    const tzPart = parts.find((p) => p.type === "timeZoneName")?.value;
    if (!tzPart) return null;
    if (tzPart === "GMT" || tzPart === "UTC") return 0;
    const match = tzPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!match) return null;
    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3] || "0", 10);
    return sign * (hours + minutes / 60);
  } catch {
    return null;
  }
}

export function parseOffsetToHours(timezone: string): number | null {
  const t = timezone.trim().toLowerCase();
  if (t === "utc" || t === "z" || t === "gmt") return 0;

  // Only treat bare +/- decimal offsets as numeric (e.g. "-3", "+5.5", "-03").
  // 3-4 digit strings such as "+0530" are handled as HHMM by the offset parser below.
  if (/^[+-]?\d{1,2}(?:\.\d+)?$/.test(t)) {
    const numeric = parseFloat(t);
    if (!Number.isNaN(numeric)) return numeric;
  }

  // ISO-ish offsets: +5:30, -03:00, +0530, -3.
  const m = t.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!m) return null;
  const sign = m[1] === "+" ? 1 : -1;
  const hours = parseInt(m[2], 10);
  const minutes = parseInt(m[3] || "0", 10);
  return sign * (hours + minutes / 60);
}

export function getTimezoneOffsetHours(
  timezone: string,
  dateStr: string,
  timeStr: string
): number {
  const numeric = parseOffsetToHours(timezone);
  if (numeric !== null) return numeric;

  const firstGuess = formatOffsetFromIntl(timezone, localToUtcTimestamp(dateStr, timeStr, 0));
  if (firstGuess === null) {
    console.warn(TAG, "Could not resolve IANA offset for", timezone, "- using 0");
    return 0;
  }
  // Second pass uses the first offset to convert local time to real UTC, then
  // re-read the offset for that exact instant (handles DST transitions robustly).
  const refined = formatOffsetFromIntl(
    timezone,
    localToUtcTimestamp(dateStr, timeStr, firstGuess)
  );
  return refined ?? firstGuess;
}

interface FetchRetryOptions {
  retries?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
  isRetryableStatus?: (status: number) => boolean;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: FetchRetryOptions = {}
): Promise<Response> {
  const maxAttempts = options.retries ?? 3;
  const baseDelay = options.baseDelayMs ?? 500;
  const timeoutMs = options.timeoutMs ?? 15000;
  const isRetryableStatus =
    options.isRetryableStatus ?? ((s) => s === 429 || s >= 500);

  let delay = baseDelay;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        const err = new ProviderHttpError(
          response.status,
          `${init.method || "GET"} ${url} -> HTTP ${response.status} ${response.statusText}: ${body.slice(0, 200)}`
        );
        if (isRetryableStatus(response.status) && attempt < maxAttempts) {
          console.warn(
            TAG,
            `${init.method} ${url} attempt ${attempt}/${maxAttempts} failed with ${response.status}; retrying in ${delay}ms`
          );
          lastError = err;
          await sleep(delay + Math.floor(Math.random() * delay));
          delay *= 2;
          continue;
        }
        throw err;
      }

      return response;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;

      if (isNetworkError(error) && attempt < maxAttempts) {
        console.warn(
          TAG,
          `${init.method} ${url} attempt ${attempt}/${maxAttempts} network error; retrying in ${delay}ms`
        );
        await sleep(delay + Math.floor(Math.random() * delay));
        delay *= 2;
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new ProviderError(`fetchWithRetry exhausted all ${maxAttempts} attempts`);
}

function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    const lower = k.toLowerCase();
    redacted[k] =
      lower.includes("key") || lower.includes("authorization") || lower.includes("token")
        ? "<redacted>"
        : v;
  }
  return redacted;
}

export function buildJHoraBody(input: BirthInput): Record<string, unknown> {
  return {
    date: input.date,
    time: normalizeTime(input.time),
    latitude: input.latitude,
    longitude: input.longitude,
    timezone: getTimezoneOffsetHours(input.timezone, input.date, input.time),
    place: input.place || "unknown",
  };
}

export function validateJHoraResponse(raw: unknown): asserts raw is JHoraResponse {
  if (!isRecord(raw)) {
    throw new ProviderError("JHora response is not an object");
  }
  const horoscope = raw.horoscope;
  if (!isRecord(horoscope)) {
    throw new ProviderError("JHora response missing horoscope object");
  }
  const divisionalCharts = horoscope.divisional_charts;
  if (!isRecord(divisionalCharts)) {
    throw new ProviderError("JHora response missing horoscope.divisional_charts");
  }

  const candidates = ["D-1_rasi", "D1", "d1", "rasi_chart", "rasi"];
  const chartKey = candidates.find((k) => divisionalCharts[k] && isRecord(divisionalCharts[k]));
  const chart = chartKey ? (divisionalCharts[chartKey] as Record<string, unknown>) : undefined;

  if (!chart) {
    throw new ProviderError("JHora response missing any recognizable divisional chart");
  }

  const hasPlanets = ["Sun", "Moon", "Ascendant", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].some(
    (p) => chart[p] && isRecord(chart[p])
  );
  if (!hasPlanets) {
    throw new ProviderError("JHora divisional chart does not contain recognizable planetary data");
  }
}

export function hasPlanetaryData(raw: unknown): boolean {
  try {
    validateJHoraResponse(raw);
    return true;
  } catch {
    return false;
  }
}

export async function fetchJHoraHoroscope(
  input: BirthInput,
  options: { url?: string; timeoutMs?: number; retries?: number } = {}
): Promise<JHoraResponse> {
  const baseUrl = (options.url || getJHoraUrl()).replace(/\/$/, "");
  const url = `${baseUrl}/horoscope`;
  const body = buildJHoraBody(input);

  console.log(TAG, "Requesting JHora /horoscope for", input.place || "unknown", "tz", body.timezone);

  const response = await fetchWithRetry(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    {
      timeoutMs: options.timeoutMs ?? Number(process.env.JHORA_TIMEOUT_MS || 30000),
      retries: options.retries ?? 3,
    }
  );

  let raw: unknown;
  try {
    raw = await response.json();
  } catch (e) {
    throw new ProviderError(`JHora response is not valid JSON: ${(e as Error).message}`);
  }

  validateJHoraResponse(raw);
  return raw as JHoraResponse;
}

function buildAstrologyAPIBody(input: BirthInput): Record<string, unknown> {
  const { year, month, day } = splitDate(input.date);
  const { hour, minute } = splitTime(input.time);
  return {
    day,
    month,
    year,
    hour,
    min: minute,
    lat: input.latitude,
    lon: input.longitude,
    tzone: getTimezoneOffsetHours(input.timezone, input.date, input.time),
  };
}

async function fetchAstrologyAPIEndpoint<T>(
  endpoint: "/planets/extended" | "/major_vdasha",
  input: BirthInput,
  apiKey: string,
  options: { baseUrl?: string; timeoutMs?: number; retries?: number } = {}
): Promise<T> {
  const baseUrl = (options.baseUrl || getAstrologyApiBase()).replace(/\/$/, "");
  const url = `${baseUrl}${endpoint}`;
  const body = buildAstrologyAPIBody(input);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-astrologyapi-key": apiKey,
  };

  console.log(
    TAG,
    "Requesting AstrologyAPI",
    endpoint,
    "headers:",
    redactHeaders(headers)
  );

  const response = await fetchWithRetry(
    url,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    },
    {
      timeoutMs: options.timeoutMs ?? 15000,
      retries: options.retries ?? 3,
    }
  );

  try {
    return (await response.json()) as T;
  } catch (e) {
    throw new ProviderError(`AstrologyAPI ${endpoint} response is not valid JSON: ${(e as Error).message}`);
  }
}

export async function fetchAstrologyAPIFallback(
  input: BirthInput,
  options: { baseUrl?: string; apiKey?: string; timeoutMs?: number; retries?: number } = {}
): Promise<AstrologyAPIResponse> {
  const apiKey = options.apiKey || getAstrologyApiKey();
  if (!apiKey) {
    throw new ProviderError("ASTROLOGY_API_KEY is not configured");
  }

  const [planets, majorDasha] = await Promise.all([
    fetchAstrologyAPIEndpoint<AstrologyAPIPlanet[]>("/planets/extended", input, apiKey, options),
    fetchAstrologyAPIEndpoint<AstrologyAPIDasha[]>("/major_vdasha", input, apiKey, options),
  ]);

  if (!Array.isArray(planets)) {
    throw new ProviderError("AstrologyAPI /v1/planets/extended did not return an array");
  }
  if (!Array.isArray(majorDasha)) {
    throw new ProviderError("AstrologyAPI /v1/major_vdasha did not return an array");
  }

  return { planets, majorDasha };
}

export async function fetchAstrologyProviderResult(
  input: BirthInput,
  options: {
    jhoraUrl?: string;
    jhoraTimeoutMs?: number;
    jhoraRetries?: number;
    astrologyApiBaseUrl?: string;
    astrologyApiKey?: string;
    astrologyApiTimeoutMs?: number;
    astrologyApiRetries?: number;
  } = {}
): Promise<AstrologyProviderResult> {
  const attempted: string[] = [];
  const errors: string[] = [];

  // 1. Try JHora first (full data source)
  attempted.push("jhora");
  try {
    const jhora = await fetchJHoraHoroscope(input, {
      url: options.jhoraUrl,
      timeoutMs: options.jhoraTimeoutMs,
      retries: options.jhoraRetries,
    });
    return {
      jhora,
      meta: {
        source: "jhora",
        status: "full",
        attempted: [...attempted],
        errors: [],
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(TAG, "JHora failed:", msg);
    errors.push(`jhora: ${msg}`);
  }

  // 2. Fallback to AstrologyAPI (partial data source)
  const apiKey = options.astrologyApiKey || getAstrologyApiKey();
  if (apiKey) {
    attempted.push("astrologyapi");
    try {
      const astrologyapi = await fetchAstrologyAPIFallback(input, {
        baseUrl: options.astrologyApiBaseUrl,
        apiKey,
        timeoutMs: options.astrologyApiTimeoutMs,
        retries: options.astrologyApiRetries,
      });
      return {
        astrologyapi,
        meta: {
          source: "astrologyapi",
          status: "partial",
          attempted: [...attempted],
          errors,
        },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(TAG, "AstrologyAPI fallback failed:", msg);
      errors.push(`astrologyapi: ${msg}`);
    }
  } else {
    errors.push("astrologyapi: ASTROLOGY_API_KEY not configured");
  }

  throw new ProviderError("All astrology providers failed", { attempted, errors });
}

function firstMatchingKey(
  obj: Record<string, unknown>,
  patterns: Array<string | RegExp>
): string | undefined {
  for (const k of Object.keys(obj)) {
    for (const p of patterns) {
      if (typeof p === "string" ? k === p : p.test(k)) return k;
    }
  }
  return undefined;
}

function horoscopeRoot(jhora: unknown): Record<string, unknown> | undefined {
  return isRecord(jhora) ? ((jhora as JHoraResponse).horoscope ?? jhora) : undefined;
}

export function getRasiChart(
  jhora: JHoraResponse | undefined | null
): Record<string, JHoraPlanetEntry> | undefined {
  if (!jhora) return undefined;
  const h = horoscopeRoot(jhora);
  const charts = h?.divisional_charts;
  if (!isRecord(charts)) return undefined;
  const key = firstMatchingKey(charts, ["D-1_rasi", /^D-?1(?:_rasi)?$/i, "rasi_chart", "rasi"]);
  const chart = key ? charts[key] : undefined;
  return isRecord(chart) ? (chart as Record<string, JHoraPlanetEntry>) : undefined;
}

export function getNakshatraPada(
  jhora: JHoraResponse | undefined | null
): Record<string, Record<string, unknown>> | undefined {
  const h = horoscopeRoot(jhora);
  const section = h?.nakshatra_pada;
  return isRecord(section) ? (section as Record<string, Record<string, unknown>>) : undefined;
}

export function getPlanetaryStates(
  jhora: JHoraResponse | undefined | null
): Record<string, unknown> | undefined {
  const h = horoscopeRoot(jhora);
  const section = h?.planetary_states;
  return isRecord(section) ? section : undefined;
}

export function getShadBala(
  jhora: JHoraResponse | undefined | null
): Record<string, unknown> | undefined {
  const h = horoscopeRoot(jhora);
  const section = h?.shad_bala ?? h?.shadbala;
  return isRecord(section) ? section : undefined;
}

export function getVimsottariDasha(
  jhora: JHoraResponse | undefined | null
): JHoraDashaEntry[] | undefined {
  const h = horoscopeRoot(jhora);
  const dashas = h?.graha_dashas;
  if (!isRecord(dashas)) return undefined;

  const candidates = ["vimsottari", "vimshottari", "vimshottari_dasha", "vimsottari_dasha"];
  const key = firstMatchingKey(dashas, candidates);
  const section = key ? dashas[key] : undefined;
  return Array.isArray(section) ? (section as JHoraDashaEntry[]) : undefined;
}

export function getBirthDetails(
  jhora: JHoraResponse | undefined | null
): Record<string, unknown> | undefined {
  return isRecord(jhora) ? jhora.birth_details : undefined;
}
