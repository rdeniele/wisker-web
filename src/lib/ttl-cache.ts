/**
 * Tiny in-process TTL cache with in-flight de-duplication.
 *
 * Concurrent callers asking for the same key share one promise, so an
 * expensive query runs once no matter how many requests arrive together.
 * Failed loads are never cached. The cache is per server instance, so only
 * put data in it that is safe to serve to whoever passes the caller's
 * authorization check (the key must include everything the result depends on).
 */
export class TtlCache<T> {
  private entries = new Map<string, { value: T; expires: number }>();
  private inflight = new Map<string, Promise<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 50,
  ) {}

  async get(
    key: string,
    load: () => Promise<T>,
    opts: { bypass?: boolean } = {},
  ): Promise<{ value: T; cached: boolean }> {
    const now = Date.now();
    if (!opts.bypass) {
      const hit = this.entries.get(key);
      if (hit && hit.expires > now) return { value: hit.value, cached: true };
      const pending = this.inflight.get(key);
      if (pending) return { value: await pending, cached: true };
    }

    const promise = load();
    this.inflight.set(key, promise);
    try {
      const value = await promise;
      this.entries.set(key, { value, expires: Date.now() + this.ttlMs });
      this.evict();
      return { value, cached: false };
    } finally {
      if (this.inflight.get(key) === promise) this.inflight.delete(key);
    }
  }

  clear() {
    this.entries.clear();
  }

  private evict() {
    if (this.entries.size <= this.maxEntries) return;
    const now = Date.now();
    for (const [k, v] of this.entries) {
      if (v.expires <= now) this.entries.delete(k);
    }
    // Still too big: drop the oldest insertions.
    for (const k of this.entries.keys()) {
      if (this.entries.size <= this.maxEntries) break;
      this.entries.delete(k);
    }
  }
}
