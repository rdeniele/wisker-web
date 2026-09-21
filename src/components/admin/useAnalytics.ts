"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalyticsResponse } from "@/lib/admin-analytics-types";
import type { RangeKey } from "@/lib/admin-range";
import { readJson } from "@/lib/http";

export interface RangeSelection {
  range: RangeKey;
  /** `YYYY-MM-DD`, only used when `range` is "custom". */
  from?: string;
  to?: string;
}

/** Responses kept briefly so flipping between ranges/tabs doesn't refetch. */
const clientCache = new Map<string, { at: number; data: AnalyticsResponse }>();
const CLIENT_TTL_MS = 30_000;

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Loads dashboard analytics for a range. One in-flight request per selection:
 * changing the selection aborts the previous request, custom dates are
 * debounced, and the previous data stays on screen while the next loads.
 */
export function useAnalytics(selection: RangeSelection, tz: string | null) {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const forceRef = useRef(false);

  const { range, from, to } = selection;
  const key = tz ? [tz, range, range === "custom" ? from : "", range === "custom" ? to : ""].join("|") : null;

  useEffect(() => {
    if (!key || !tz) return;
    if (range === "custom" && (!from || !to)) return;

    const force = forceRef.current;
    forceRef.current = false;
    const cached = clientCache.get(key);
    if (!force && cached && Date.now() - cached.at < CLIENT_TTL_MS) {
      setData(cached.data);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    // Debounce so typing/picking custom dates doesn't fire a request per change.
    const timer = setTimeout(
      async () => {
        try {
          const params = new URLSearchParams({ range, tz });
          if (range === "custom" && from && to) {
            params.set("from", from);
            params.set("to", to);
          }
          if (force) params.set("refresh", "1");
          const res = await fetch(`/api/admin/analytics?${params}`, {
            signal: controller.signal,
            cache: "no-store",
          });
          const json = await readJson<{
            success: boolean;
            data?: AnalyticsResponse;
            error?: { message?: string } | string;
          }>(res);
          if (!res.ok || !json?.success || !json.data) {
            const message =
              typeof json?.error === "string" ? json.error : json?.error?.message;
            if (res.status === 403) throw new Error("Admin access required.");
            throw new Error(message || "Couldn't load analytics.");
          }
          clientCache.set(key, { at: Date.now(), data: json.data });
          setData(json.data);
          setError(null);
        } catch (e) {
          if (controller.signal.aborted) return;
          setError(e instanceof Error ? e.message : "Couldn't load analytics.");
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      range === "custom" ? 300 : 0,
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `tick` is bumped by refresh() to re-run this effect.
  }, [key, tz, range, from, to, tick]);

  const refresh = useCallback(() => {
    forceRef.current = true;
    setTick((t) => t + 1);
  }, []);

  return { data, error, loading, refresh };
}
