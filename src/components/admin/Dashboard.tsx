"use client";

import React, { Suspense, useMemo, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { LuRefreshCw } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/button";
import Skeleton from "@/components/ui/Skeleton";
import { Segmented, KpiSkeleton } from "@/components/admin/ui";
import RangePicker from "@/components/admin/RangePicker";
import { browserTimeZone, useAnalytics, type RangeSelection } from "@/components/admin/useAnalytics";
import { RANGE_KEYS, type RangeKey } from "@/lib/admin-range";
import { fmtRelative } from "@/lib/admin-format";

// Each tab is its own chunk, loaded only when opened.
const tabSkeleton = () => <KpiSkeleton count={4} />;
const OverviewTab = dynamic(() => import("@/components/admin/tabs/OverviewTab"), { loading: tabSkeleton });
const UsersTab = dynamic(() => import("@/components/admin/tabs/UsersTab"), { loading: tabSkeleton });
const RevenueTab = dynamic(() => import("@/components/admin/tabs/RevenueTab"), { loading: tabSkeleton });
const ProductTab = dynamic(() => import("@/components/admin/tabs/ProductTab"), { loading: tabSkeleton });
const BusinessTab = dynamic(() => import("@/components/admin/tabs/BusinessTab"), { loading: tabSkeleton });

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "users", label: "Users" },
  { value: "revenue", label: "Revenue" },
  { value: "product", label: "Product" },
  { value: "business", label: "Business" },
] as const;
type Tab = (typeof TABS)[number]["value"];

const isTab = (v: string | null): v is Tab => TABS.some((t) => t.value === v);
const isRange = (v: string | null): v is RangeKey => RANGE_KEYS.includes(v as RangeKey);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const subscribeNever = () => () => {};

function DashboardInner() {
  const pathname = usePathname();
  const params = useSearchParams();

  // The viewer's timezone decides where "today" and each day begins.
  // (null on the server and during hydration, so the two renders agree.)
  const tz = useSyncExternalStore(subscribeNever, browserTimeZone, () => null);

  const tab: Tab = isTab(params.get("tab")) ? (params.get("tab") as Tab) : "overview";
  const rangeParam = params.get("range");
  const selection: RangeSelection = useMemo(() => {
    const range: RangeKey = isRange(rangeParam) ? rangeParam : "30d";
    const from = params.get("from");
    const to = params.get("to");
    return {
      range,
      from: from && ISO_DATE.test(from) ? from : undefined,
      to: to && ISO_DATE.test(to) ? to : undefined,
    };
  }, [rangeParam, params]);

  const { data, error, loading, refresh } = useAnalytics(selection, tz);

  const setQuery = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) next.delete(k);
      else next.set(k, v);
    }
    // Filters live in the URL for sharing/back-forward, but changing them must not
    // re-render the server tree (and re-run the admin auth check): update history only.
    window.history.replaceState(null, "", `${pathname}?${next}`);
  };

  const today = useMemo(() => {
    if (!tz) return undefined;
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  }, [tz]);

  const stale = loading && data !== null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Admin</p>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            {data ? (
              <>
                {data.range.fromLocal === data.range.toLocal
                  ? data.range.fromLocal
                  : `${data.range.fromLocal} to ${data.range.toLocal}`}
                {data.range.partial ? " (in progress)" : ""} · {data.range.tz} · compared with the previous{" "}
                {data.range.key === "today" ? "day" : "period"}
              </>
            ) : (
              "Business intelligence and operations"
            )}
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 lg:items-end">
          <RangePicker
            value={selection}
            maxDate={today}
            onChange={(next) =>
              setQuery({
                range: next.range,
                from: next.range === "custom" ? next.from : undefined,
                to: next.range === "custom" ? next.to : undefined,
              })
            }
          />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {data && (
              <span>
                Updated {fmtRelative(data.generatedAt)}
                {data.cached ? " (cached)" : ""}
              </span>
            )}
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="btn btn-secondary btn-sm !min-h-8 gap-1.5 !px-3"
              aria-label="Refresh data"
            >
              {loading ? <Spinner className="h-3.5 w-3.5" /> : <LuRefreshCw aria-hidden className="h-3.5 w-3.5" />}
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 scrollbar-none">
        <Segmented label="Dashboard section" value={tab} onChange={(v) => setQuery({ tab: v === "overview" ? undefined : v })} options={[...TABS]} />
      </div>

      {error && (
        <div role="alert" className="card flex flex-col gap-3 border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-bold text-red-800">Couldn&apos;t load the dashboard</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button type="button" onClick={refresh} className="btn btn-secondary btn-sm shrink-0">
            Try again
          </button>
        </div>
      )}

      {!data && !error && (
        <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
          <KpiSkeleton />
          <Skeleton className="h-64 w-full !rounded-3xl" />
        </div>
      )}

      {data && (
        <div
          className={cn("transition-opacity duration-200", stale && "pointer-events-none opacity-60")}
          aria-busy={stale}
        >
          {tab === "overview" && <OverviewTab data={data} />}
          {tab === "users" && <UsersTab data={data} />}
          {tab === "revenue" && <RevenueTab data={data} />}
          {tab === "product" && <ProductTab data={data} />}
          {tab === "business" && <BusinessTab data={data} />}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<KpiSkeleton />}>
      <DashboardInner />
    </Suspense>
  );
}
