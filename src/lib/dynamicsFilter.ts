/**
 * Strict relevance whitelist for Vedic Yogas/Doshas returned by JHora.
 * Shared between the backend (generation split) and the frontend (paywall counter).
 *
 * Anything outside the whitelist is DISCARDED — it is not sent to the primary
 * reading nor to the "reveal more" secondary call. Whitelist order defines the
 * importance ranking used for sorting.
 *
 * JHora returns entries like "Raja Yoga: descrição..." — matching runs on the
 * combination name before the colon (and on dosha keys like "Pitru Dosha").
 */

export const PRIMARY_YOGA_COUNT = 4;
export const PRIMARY_DOSHA_COUNT = 2;
export const SECONDARY_YOGA_COUNT = 4;
export const SECONDARY_DOSHA_COUNT = 3;

// The 8 indispensable yoga families, in descending order of weight.
const YOGA_WHITELIST: RegExp[] = [
  /hamsa|malavya|ruchaka|bhadra|\bsasa\b|shasha|mahapurusha|pancha/i, // Pancha Mahapurusha
  /raja\s*yoga|raj\s*yoga|rajayoga|kendra.*trikona|trikona.*kendra/i, // Raja Yogas
  /gaja\s*kesari|gajakesari/i,                                       // Gaja Kesari
  /dhana|wealth|prosper/i,                                           // Dhana Yogas
  /budha\s*aditya|budhaditya|budha-aditya/i,                         // Budhaditya
  /neecha\s*bhanga|neechabhanga|neecha-bhanga/i,                     // Neecha Bhanga Raja
  /chandra\s*mangala|chandra-mangala|chandramangala/i,               // Chandra-Mangala
  /saraswati|sarasvati|lakshmi|laxmi|\badhi\b/i,                     // Saraswati / Lakshmi / Adhi
];

// The 5 indispensable doshas, in descending order of weight.
const DOSHA_WHITELIST: RegExp[] = [
  /kala\s*sarpa|kaal\s*sarp|kalasarpa/i,  // Kala Sarpa
  /kuja|manglik|mangal|angarak/i,         // Mangal / Kuja
  /guru\s*chandal|chandala/i,             // Guru Chandal
  /pitru|pitra|pitrii/i,                  // Pitru
  /vish|kemadruma|kemdruma/i,             // Vish / Kemadruma
];

function baseName(entry: string): string {
  return String(entry).split(":")[0].trim();
}

// Whitelist rank: lower = more important. -1 = not whitelisted (discard).
function rankOf(entry: string, whitelist: RegExp[]): number {
  const name = baseName(entry);
  for (let i = 0; i < whitelist.length; i++) {
    if (whitelist[i].test(name)) return i;
  }
  return -1;
}

// JHora may list the same combination under variant spellings
// (e.g. "Kedara Yoga" and "Kedaara Yoga") — dedupe on normalized name.
function normalizeName(entry: string): string {
  return baseName(entry)
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/([aeiou])\1+/g, "$1")
    .replace(/[^a-z0-9]/g, "");
}

function filterAndSort(list: string[], whitelist: RegExp[]): string[] {
  const seen = new Set<string>();
  return list
    .map((entry, index) => ({ entry, index, rank: rankOf(entry, whitelist) }))
    .filter((item) => {
      if (item.rank < 0) return false;
      const key = normalizeName(item.entry);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (a.rank - b.rank) || (a.index - b.index))
    .map((item) => item.entry);
}

export interface DynamicsSplit {
  primary: { yogas: string[]; doshas: string[] };
  secondary: { yogas: string[]; doshas: string[] };
  secondaryCount: number;
  totalInterpreted: number;
}

export function splitDynamicsCombinations(yogas: string[], doshas: string[]): DynamicsSplit {
  const sortedYogas = filterAndSort(yogas || [], YOGA_WHITELIST);
  const sortedDoshas = filterAndSort(doshas || [], DOSHA_WHITELIST);

  const primary = {
    yogas: sortedYogas.slice(0, PRIMARY_YOGA_COUNT),
    doshas: sortedDoshas.slice(0, PRIMARY_DOSHA_COUNT),
  };
  const secondary = {
    yogas: sortedYogas.slice(PRIMARY_YOGA_COUNT, PRIMARY_YOGA_COUNT + SECONDARY_YOGA_COUNT),
    doshas: sortedDoshas.slice(PRIMARY_DOSHA_COUNT, PRIMARY_DOSHA_COUNT + SECONDARY_DOSHA_COUNT),
  };

  return {
    primary,
    secondary,
    secondaryCount: secondary.yogas.length + secondary.doshas.length,
    totalInterpreted: primary.yogas.length + primary.doshas.length + secondary.yogas.length + secondary.doshas.length,
  };
}
