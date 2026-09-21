/**
 * Share one request between callers that ask for the same URL at about the same
 * time. The app shell mounts some widgets twice (desktop + mobile variants), and
 * each used to fire its own identical request on every page load.
 *
 * Results are kept for `ttlMs` so the second mount reuses them; pass
 * `force: true` after a mutation to always hit the network.
 */
interface Entry {
  at: number;
  promise: Promise<{ ok: boolean; status: number; json: unknown }>;
}

const entries = new Map<string, Entry>();

export function fetchJsonOnce(
  url: string,
  opts: { ttlMs?: number; force?: boolean } = {},
) {
  const { ttlMs = 1500, force = false } = opts;
  const hit = entries.get(url);
  if (!force && hit && Date.now() - hit.at < ttlMs) return hit.promise;

  const promise = fetch(url).then(async (res) => ({
    ok: res.ok,
    status: res.status,
    json: (await res.json().catch(() => null)) as unknown,
  }));
  entries.set(url, { at: Date.now(), promise });
  // A failed request must not be reused.
  promise.catch(() => entries.delete(url));
  return promise;
}
