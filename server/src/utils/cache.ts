type CacheEntry = { value: unknown; expiresAt: number };

/**
 * Small in-process TTL cache. It keeps repeated searches/forecasts cheap and
 * avoids hammering the upstream provider. A shared Redis cache would be the
 * next step for a multi-instance deployment.
 */
class TtlCache {
  private store = new Map<string, CacheEntry>();
  private readonly maxEntries: number;

  constructor(maxEntries = 250) {
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set(key: string, value: unknown, ttlMs: number): void {
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  clear(): void {
    this.store.clear();
  }
}

export const weatherCache = new TtlCache();
export const geocodeCache = new TtlCache(500);
