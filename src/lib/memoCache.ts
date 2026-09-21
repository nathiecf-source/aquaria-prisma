/**
 * Lightweight in-memory cache with TTL and stale-while-revalidate semantics.
 * Entries live only for the duration of the page session.
 */

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const store = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Returns cached data when available and a promise resolving to fresh data.
 * - Fresh entry (< ttl): promise resolves with the cached value, no fetch.
 * - Stale entry: returns the stale data immediately and refetches in background.
 * - Miss: data is null and the promise resolves with the fetched value.
 */
export function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL,
): { data: T | null; promise: Promise<T> } {
  const entry = store.get(key) as CacheEntry<T> | undefined;

  const promise = entry && Date.now() - entry.ts < ttlMs
    ? Promise.resolve(entry.data)
    : fetcher().then((data) => {
        store.set(key, { data, ts: Date.now() });
        return data;
      });

  return { data: entry?.data ?? null, promise };
}

/** Removes entries whose key starts with the given prefix (or all, if omitted). */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
