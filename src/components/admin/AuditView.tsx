"use client";

import React, { useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";
import { cn } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { fmtDateTime, fmtInt } from "@/lib/admin-format";
import { readJson } from "@/lib/http";

interface Entry {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  metadata: unknown;
  createdAt: string;
}
interface Response {
  items: Entry[];
  total: number;
  page: number;
  pageSize: number;
}

const ACTIONS = [
  { value: "", label: "All actions" },
  { value: "user.", label: "User changes" },
  { value: "users.", label: "Exports" },
  { value: "plan.", label: "Plans" },
  { value: "promo.", label: "Promo codes" },
];
const PAGE_SIZE = 25;

export default function AuditView() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(q.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (query) p.set("q", query);
    if (action) p.set("action", action);
    (async () => {
      try {
        const res = await fetch(`/api/admin/audit?${p}`, { signal: controller.signal, cache: "no-store" });
        const json = await readJson<{ success: boolean; data?: Response; error?: { message?: string } }>(res);
        if (!res.ok || !json?.success || !json.data) throw new Error(json?.error?.message || "Couldn't load the audit log.");
        setData(json.data);
        setError(null);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Couldn't load the audit log.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [page, query, action, tick]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-5">
      <header className="min-w-0">
        <p className="eyebrow">Admin</p>
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Audit log</h1>
        <p className="mt-1 text-sm text-gray-600">
          Every admin change and data export, newest first. Entries can&apos;t be edited or deleted.
        </p>
      </header>

      <div className="card grid grid-cols-1 gap-3 p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:p-4">
        <label className="relative">
          <span className="sr-only">Search the audit log</span>
          <LuSearch aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="search" className="field !pl-10" placeholder="Search admin, target or action" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select aria-label="Action type" className="field" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
          {ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" className="card flex flex-col gap-3 border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-red-800">{error}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTick((t) => t + 1)}>Try again</button>
        </div>
      )}

      <div className={cn("transition-opacity", loading && data && "opacity-60")} aria-busy={loading}>
        {!data && loading ? (
          <div className="card space-y-3 p-4">
            {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : data && data.items.length === 0 ? (
          <div className="card px-6 py-12 text-center">
            <p className="font-display text-xl font-semibold text-ink">No entries</p>
            <p className="mt-1 text-sm text-gray-600">
              {query || action ? "Nothing matches these filters." : "Admin actions will appear here as they happen."}
            </p>
          </div>
        ) : data ? (
          <>
            <ul className="card divide-y divide-line">
              {data.items.map((e) => (
                <li key={e.id} className="p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="min-w-0 break-words text-sm font-bold text-ink">
                      {e.action}
                      {e.targetLabel && <span className="font-semibold text-gray-600"> · {e.targetLabel}</span>}
                    </p>
                    <p className="text-xs text-gray-500">{fmtDateTime(e.createdAt)}</p>
                  </div>
                  <p className="mt-0.5 break-words text-xs text-gray-500">by {e.actorEmail}</p>
                  {e.metadata ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-bold text-gray-600">Details</summary>
                      <pre className="mt-1 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-sand p-2 text-xs text-gray-700">
                        {JSON.stringify(e.metadata, null, 1)}
                      </pre>
                    </details>
                  ) : null}
                </li>
              ))}
            </ul>
            <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600" aria-live="polite">{fmtInt(data.total)} entr{data.total === 1 ? "y" : "ies"}</p>
              <div className="flex items-center gap-2">
                <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                <span className="text-sm font-bold tabular-nums text-ink">{page} / {totalPages}</span>
                <button type="button" className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </nav>
          </>
        ) : null}
      </div>
    </div>
  );
}
