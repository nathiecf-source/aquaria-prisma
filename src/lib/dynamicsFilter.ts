/**
 * Two-tier relevance whitelist for Vedic Yogas/Doshas returned by JHora.
 * Shared between the backend (generation split) and the frontend (paywall counter).
 *
 * Tier 1 (heavy classics) always wins. Tier 2 (intermediate) fills remaining
 * slots in priority order. Anything outside both tiers is DISCARDED — it is not
 * sent to the primary reading nor to the "reveal more" secondary call.
 *
 * JHora returns entries like "Raja Yoga: descrição..." — matching runs on the
 * combination name before the colon (and on dosha keys like "Pitru Dosha").
 */

export const POOL_YOGA_COUNT = 5;
export const POOL_DOSHA_COUNT = 3;
// Single-stage reading: the whole pool is interpreted in the initial call.
export const PRIMARY_YOGA_COUNT = POOL_YOGA_COUNT;
export const PRIMARY_DOSHA_COUNT = POOL_DOSHA_COUNT;

// Tier 1 — the 8 indispensable yoga families, in descending order of weight.
const YOGA_TIER1: RegExp[] = [
  /hamsa|malavya|ruchaka|bhadra|\bsasa\b|shasha|mahapurusha|pancha/i, // Pancha Mahapurusha
  /raja\s*yoga|raj\s*yoga|rajayoga|kendra.*trikona|trikona.*kendra/i, // Raja Yogas
  /gaja\s*kesari|gajakesari/i,                                       // Gaja Kesari
  /dhana|wealth|prosper/i,                                           // Dhana Yogas
  /budha\s*aditya|budhaditya|budha-aditya/i,                         // Budhaditya
  /neecha\s*bhanga|neechabhanga|neecha-bhanga/i,                     // Neecha Bhanga Raja
  /chandra\s*mangala|chandra-mangala|chandramangala/i,               // Chandra-Mangala
  /saraswati|sarasvati|lakshmi|laxmi|\badhi\b/i,                     // Saraswati / Lakshmi / Adhi
];

// Tier 2 — intermediate yogas recognized in Jyotish, in descending priority.
// Covers the names JHora actually emits (e.g. "Vesai Yoga", "Sunaphaa Yoga").
const YOGA_TIER2: RegExp[] = [
  /amala|amla/i,                                                     // Amala
  /vasumathi|vasumat|swaveeryaddhana|veeryaddhana|svaveerya/i,       // wealth yogas
  /parijatha|parijata|kalpadruma/i,                                  // Parijatha / Kalpadruma
  /brahma|harihara/i,                                                // Brahma / Harihara Brahma
  /sunapha|anapha|durudhara|ubhayachara|obhayachara|kemadruma/i,     // lunar yogas
  /vesai|\bvesi\b|vosi|ubhayachari/i,                                // solar yogas
  /buddhimaturya|nipuna|medha|mati\b/i,                              // intellect yogas
  /kartari|subha/i,                                                  // Kartari / Subha
];

// Tier 1 — the 5 indispensable doshas, in descending order of weight.
const DOSHA_TIER1: RegExp[] = [
  /kala\s*sarpa|kaal\s*sarp|kalasarpa/i,  // Kala Sarpa
  /kuja|manglik|mangal|angarak/i,         // Mangal / Kuja
  /guru\s*chandal|chandala/i,             // Guru Chandal
  /pitru|pitra|pitrii/i,                  // Pitru
  /vish|kemadruma|kemdruma/i,             // Vish / Kemadruma
];

// Tier 2 — secondary doshas, in descending priority.
const DOSHA_TIER2: RegExp[] = [
  /shrapit|shrapita/i,
  /ganda\s*moola|gandmool|gandanta|ganda/i,
  /kalathra/i,
  /ghata/i,
];

function baseName(entry: string): string {
  return String(entry).split(":")[0].trim();
}

// Whitelist rank: lower = more important. -1 = not whitelisted (discard).
// Tier 1 ranks 0..n, tier 2 ranks 1000+ so tier 1 always precedes tier 2.
function rankOf(entry: string, tiers: RegExp[][]): number {
  const name = baseName(entry);
  for (let t = 0; t < tiers.length; t++) {
    for (let i = 0; i < tiers[t].length; i++) {
      if (tiers[t][i].test(name)) return t * 1000 + i;
    }
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

function filterAndSort(list: string[], tiers: RegExp[][]): string[] {
  const seen = new Set<string>();
  return list
    .map((entry, index) => ({ entry, index, rank: rankOf(entry, tiers) }))
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
  const pool = {
    yogas: filterAndSort(yogas || [], [YOGA_TIER1, YOGA_TIER2]).slice(0, POOL_YOGA_COUNT),
    doshas: filterAndSort(doshas || [], [DOSHA_TIER1, DOSHA_TIER2]).slice(0, POOL_DOSHA_COUNT),
  };

  const primary = {
    yogas: pool.yogas.slice(0, PRIMARY_YOGA_COUNT),
    doshas: pool.doshas.slice(0, PRIMARY_DOSHA_COUNT),
  };
  const secondary = {
    yogas: pool.yogas.slice(PRIMARY_YOGA_COUNT),
    doshas: pool.doshas.slice(PRIMARY_DOSHA_COUNT),
  };

  return {
    primary,
    secondary,
    secondaryCount: secondary.yogas.length + secondary.doshas.length,
    totalInterpreted: pool.yogas.length + pool.doshas.length,
  };
}
