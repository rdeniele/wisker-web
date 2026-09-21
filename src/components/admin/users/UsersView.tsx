"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { LuArrowDown, LuArrowUp, LuDownload, LuSearch } from "react-icons/lu";
import { cn } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import { PlanChip, StatusChip } from "@/components/admin/ui";
import { fmtDate, fmtInt, fmtRelative } from "@/lib/admin-format";
import { readJson } from "@/lib/http";
import type { AdminUserRow } from "@/service/admin-users.service";

// The detail dialog is only needed once a user is opened.
const UserDetailModal = dynamic(() => import("@/components/admin/users/UserDetailModal"));

interface ListResponse {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    total: number;
    free: number;
    pro: number;
    premium: number;
    suspended: number;
    marketingOptIn: number;
  };
}

const SORTS = [
  { value: "createdAt", label: "Joined" },
  { value: "lastActive", label: "Last active" },
  { value: "email", label: "Email" },
  { value: "plan", label: "Plan" },
  { value: "subscriptionEnd", label: "Subscription end" },
];

function UsersViewInner() {
  const pathname = usePathname();
  const params = useSearchParams();
  const { showToast } = useToast();

  const q = params.get("q") ?? "";
  const plan = params.get("plan") ?? "";
  const account = params.get("account") ?? "";
  const activity = params.get("activity") ?? "";
  const sort = params.get("sort") ?? "createdAt";
  const dir = params.get("dir") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = [10, 25, 50].includes(Number(params.get("pageSize"))) ? Number(params.get("pageSize")) : 25;
  const openId = params.get("user");

  const [search, setSearch] = useState(q);
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const setQuery = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(paramsRef.current.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      // Any filter change goes back to page 1; paging/opening a user keeps it.
      if (!("page" in patch) && !("user" in patch)) next.delete("page");
      const qs = next.toString();
      // History only: no server re-render (and no repeated admin auth check) per filter change.
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname],
  );

  // Debounced search: one request after typing stops.
  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => setQuery({ q: search.trim() || undefined }), 350);
    return () => clearTimeout(t);
  }, [search, q, setQuery]);
  // Keep the box in sync when the URL changes from elsewhere (e.g. a link from the dashboard).
  useEffect(() => setSearch(q), [q]);

  const qs = [q, plan, account, activity, sort, dir, page, pageSize].join("|");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const p = new URLSearchParams({ sort, dir, page: String(page), pageSize: String(pageSize) });
    if (q) p.set("q", q);
    if (plan) p.set("plan", plan);
    if (account) p.set("account", account);
    if (activity) p.set("activity", activity);
    (async () => {
      try {
        const res = await fetch(`/api/admin/users?${p}`, { signal: controller.signal, cache: "no-store" });
        const json = await readJson<{ success: boolean; data?: ListResponse; error?: { message?: string } }>(res);
        if (!res.ok || !json?.success || !json.data) throw new Error(json?.error?.message || "Couldn't load users.");
        setData(json.data);
        setError(null);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Couldn't load users.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
    // qs captures every input; reloadTick forces a refetch after a change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs, reloadTick]);

  const exportEmails = async () => {
    try {
      const res = await fetch("/api/admin/users?export=marketing", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const blob = new Blob([await res.text()], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wisker-marketing-emails-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Couldn't export emails.", "error");
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const from = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.total, data.page * data.pageSize) : 0;
  const filtered = !!(q || plan || account || activity);
  const s = data?.summary;

  // Landing on a page past the end (after a filter) → go back to the last page.
  useEffect(() => {
    if (data && data.users.length === 0 && data.total > 0 && page > 1) setQuery({ page: String(totalPages) });
  }, [data, page, totalPages, setQuery]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Admin</p>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            {s
              ? `${fmtInt(s.total)} users · ${fmtInt(s.free)} free · ${fmtInt(s.pro)} pro · ${fmtInt(s.premium)} premium${s.suspended ? ` · ${s.suspended} suspended` : ""}`
              : "Search, review and manage accounts"}
          </p>
        </div>
        <button type="button" onClick={exportEmails} className="btn btn-accent btn-sm self-start sm:self-auto">
          <LuDownload aria-hidden className="h-4 w-4" />
          Export marketing emails{s ? ` (${fmtInt(s.marketingOptIn)})` : ""}
        </button>
      </header>

      {/* One filter row above the list */}
      <div className="card grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]">
        <label className="relative sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Search by email or user ID</span>
          <LuSearch aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            className="field !pl-10"
            placeholder="Search email or user ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select aria-label="Plan" className="field" value={plan} onChange={(e) => setQuery({ plan: e.target.value })}>
          <option value="">All plans</option>
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
          <option value="PREMIUM">Premium</option>
        </select>
        <select aria-label="Account status" className="field" value={account} onChange={(e) => setQuery({ account: e.target.value })}>
          <option value="">Any account status</option>
          <option value="active">Active accounts</option>
          <option value="suspended">Suspended</option>
        </select>
        <select aria-label="Activity" className="field" value={activity} onChange={(e) => setQuery({ activity: e.target.value })}>
          <option value="">Any activity</option>
          <option value="active7">Active in last 7 days</option>
          <option value="dormant30">Inactive 30+ days</option>
          <option value="never">Never active</option>
        </select>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <select aria-label="Sort by" className="field min-w-0 flex-1" value={sort} onChange={(e) => setQuery({ sort: e.target.value })}>
            {SORTS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-secondary btn-icon shrink-0"
            aria-label={dir === "asc" ? "Ascending. Switch to descending" : "Descending. Switch to ascending"}
            onClick={() => setQuery({ dir: dir === "asc" ? "desc" : "asc" })}
          >
            {dir === "asc" ? <LuArrowUp aria-hidden className="h-4 w-4" /> : <LuArrowDown aria-hidden className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="card flex flex-col gap-3 border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-red-800">{error}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReloadTick((t) => t + 1)}>
            Try again
          </button>
        </div>
      )}

      <div className={cn("transition-opacity", loading && data && "opacity-60")} aria-busy={loading}>
        {!data && loading ? (
          <div className="card divide-y divide-line">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="hidden h-6 w-16 sm:block" />
              </div>
            ))}
          </div>
        ) : data && data.users.length === 0 ? (
          <div className="card px-6 py-12 text-center">
            <p className="font-display text-xl font-semibold text-ink">No users match</p>
            <p className="mt-1 text-sm text-gray-600">
              {filtered ? "Try a different search or clear the filters." : "There are no users yet."}
            </p>
            {filtered && (
              <button type="button" className="btn btn-secondary btn-sm mt-4" onClick={() => window.history.replaceState(null, "", pathname)}>
                Clear filters
              </button>
            )}
          </div>
        ) : data ? (
          <>
            {/* Desktop table */}
            <div className="card hidden overflow-hidden md:block">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="bg-sand text-xs font-bold uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="w-[34%] px-4 py-3">User</th>
                    <th className="w-[10%] px-3 py-3">Plan</th>
                    <th className="w-[13%] px-3 py-3">Status</th>
                    <th className="w-[15%] px-3 py-3">Last active</th>
                    <th className="w-[16%] px-3 py-3">Content</th>
                    <th className="w-[12%] px-3 py-3 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.users.map((u) => (
                    <tr key={u.id} className="hover:bg-cream/60">
                      <td className="px-4 py-3">
                        <p className="truncate font-semibold text-ink" title={u.email}>{u.email}</p>
                        <p className="text-xs text-gray-500">Joined {fmtDate(u.createdAt)}</p>
                      </td>
                      <td className="px-3 py-3"><PlanChip plan={u.planType} /></td>
                      <td className="px-3 py-3"><StatusChip user={u} /></td>
                      <td className="px-3 py-3 text-gray-600" title={u.lastActiveAt ?? "No recorded activity"}>{fmtRelative(u.lastActiveAt)}</td>
                      <td className="px-3 py-3 tabular-nums text-gray-600" title="Subjects · notes · study tools">
                        {u.counts.subjects} · {u.counts.notes} · {u.counts.tools}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button type="button" className="btn btn-secondary btn-sm !min-h-9 !px-3" onClick={() => setQuery({ user: u.id })}>
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phone/tablet cards: no sideways scrolling */}
            <ul className="space-y-3 md:hidden">
              {data.users.map((u) => (
                <li key={u.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{u.email}</p>
                      <p className="text-xs text-gray-500">Joined {fmtDate(u.createdAt)} · active {fmtRelative(u.lastActiveAt).toLowerCase()}</p>
                    </div>
                    <PlanChip plan={u.planType} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip user={u} />
                      <span className="text-xs tabular-nums text-gray-600">
                        {u.counts.subjects} subjects · {u.counts.notes} notes · {u.counts.tools} tools
                      </span>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm !min-h-9 !px-3" onClick={() => setQuery({ user: u.id })}>
                      Open
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600" aria-live="polite">
                Showing <strong className="text-ink">{fmtInt(from)}–{fmtInt(to)}</strong> of{" "}
                <strong className="text-ink">{fmtInt(data.total)}</strong>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Rows per page" className="field !min-h-10 !w-auto !py-1.5" value={pageSize} onChange={(e) => setQuery({ pageSize: e.target.value })}>
                  {[10, 25, 50].map((n) => (
                    <option key={n} value={n}>{n} / page</option>
                  ))}
                </select>
                <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setQuery({ page: String(page - 1) })}>
                  Previous
                </button>
                <span className="text-sm font-bold tabular-nums text-ink">{page} / {totalPages}</span>
                <button type="button" className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setQuery({ page: String(page + 1) })}>
                  Next
                </button>
              </div>
            </nav>
          </>
        ) : null}
      </div>

      {openId && (
        <UserDetailModal
          userId={openId}
          onClose={() => setQuery({ user: undefined })}
          onChanged={() => setReloadTick((t) => t + 1)}
        />
      )}
    </div>
  );
}

export default function UsersView() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <UsersViewInner />
    </Suspense>
  );
}
