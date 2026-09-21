"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LuSearch, LuStar, LuTrash2 } from "react-icons/lu";
import { useToast } from "@/contexts/ToastContext";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { readJson, SERVICE_UNAVAILABLE_MESSAGE } from "@/lib/http";
import { cn } from "@/lib/utils";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_SHORT,
  FEEDBACK_STATUSES,
  FEEDBACK_STATUS_LABELS,
  type FeedbackCategoryValue,
  type FeedbackStatusValue,
} from "@/lib/feedback";

interface FeedbackItem {
  id: string;
  email: string;
  category: FeedbackCategoryValue;
  rating: number | null;
  message: string;
  userAgent: string | null;
  status: FeedbackStatusValue;
  adminNotes: string | null;
  createdAt: string;
}

interface FeedbackStats {
  total: number;
  byStatus: Record<FeedbackStatusValue, number>;
  byCategory: Record<FeedbackCategoryValue, number>;
  averageRating: number | null;
  ratedCount: number;
}

interface ListData {
  items: FeedbackItem[];
  total: number;
  page: number;
  pageSize: number;
  stats: FeedbackStats;
}

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: { message?: string };
}

const PAGE_SIZE = 20;

const STATUS_CHIP: Record<FeedbackStatusValue, string> = {
  NEW: "chip-accent",
  REVIEWED: "chip-neutral",
  PLANNED: "",
  DONE: "chip-success",
  DISMISSED: "chip-neutral",
};

const CATEGORY_CHIP: Record<FeedbackCategoryValue, string> = {
  BUG: "chip-danger",
  FEATURE_REQUEST: "chip-accent",
  IMPROVEMENT: "",
  PRAISE: "chip-success",
  OTHER: "chip-neutral",
};

function Stars({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`Rated ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <LuStar
          key={n}
          className={cn(
            "h-4 w-4",
            n <= value ? "fill-[#fbb040] text-[#fbb040]" : "text-[#d8cbbb]",
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

export default function AdminFeedbackPage() {
  const { showToast } = useToast();

  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<FeedbackStatusValue | "">("");
  const [category, setCategory] = useState<FeedbackCategoryValue | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce the search box so we don't query on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/admin/feedback?${params}`);
      const json = await readJson<ApiResult<ListData>>(res);

      if (!json) {
        setError(SERVICE_UNAVAILABLE_MESSAGE);
        return;
      }
      if (!json.success || !json.data) {
        setError(
          res.status === 403
            ? "Access denied. Admin privileges required."
            : json.error?.message || "Failed to load feedback",
        );
        return;
      }

      setError(null);
      setData(json.data);
    } catch {
      setError("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [page, status, category, search]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (
    item: FeedbackItem,
    body: { status?: FeedbackStatusValue; adminNotes?: string | null },
    successMessage: string,
  ): Promise<boolean> => {
    setSavingId(item.id);
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, ...body }),
      });
      const json = await readJson<ApiResult<{ feedback: FeedbackItem }>>(res);

      if (!res.ok || !json?.success) {
        showToast(json?.error?.message || "Failed to update feedback", "error");
        return false;
      }

      showToast(successMessage, "success");
      // Refetch so filters, counts and stats stay accurate.
      await load();
      return true;
    } catch {
      showToast("Failed to update feedback", "error");
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const saveNotes = async (item: FeedbackItem, notes: string) => {
    const ok = await patch(item, { adminNotes: notes }, "Notes saved");
    if (ok) {
      // Saved value now comes from the server; drop the local draft.
      setNoteDrafts((d) => {
        const next = { ...d };
        delete next[item.id];
        return next;
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/feedback?id=${encodeURIComponent(deleteTarget.id)}`,
        { method: "DELETE" },
      );
      const json = await readJson<ApiResult<{ deleted: boolean }>>(res);

      if (!res.ok || !json?.success) {
        showToast(json?.error?.message || "Failed to delete feedback", "error");
        return;
      }

      showToast("Feedback deleted", "success");
      setDeleteTarget(null);
      if (expandedId === deleteTarget.id) setExpandedId(null);
      // Step back a page if we just removed the last item on it.
      if (data && data.items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await load();
      }
    } catch {
      showToast("Failed to delete feedback", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feedback...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="card p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Couldn&apos;t load feedback
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/admin" className="btn btn-primary btn-sm btn-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { items, total, stats } = data;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtersActive = Boolean(status || category || search);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
          <p className="text-gray-600 mt-1">
            What users are telling us. Triage it to plan the roadmap.
          </p>
        </div>
        <Link
          href="/admin"
          className="btn btn-secondary btn-sm shrink-0 self-start sm:self-auto"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4 lg:grid-cols-6">
        <button
          type="button"
          onClick={() => {
            setStatus("");
            setCategory("");
            setPage(1);
          }}
          className="card card-interactive p-4 text-left"
        >
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </button>
        {(["NEW", "REVIEWED", "PLANNED", "DONE"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={cn(
              "card card-interactive p-4 text-left",
              status === s && "!border-[#615fff]",
            )}
          >
            <p className="text-sm text-gray-600">{FEEDBACK_STATUS_LABELS[s]}</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.byStatus[s]}
            </p>
          </button>
        ))}
        <div className="card p-4">
          <p className="text-sm text-gray-600">Avg. rating</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.averageRating !== null
              ? stats.averageRating.toFixed(1)
              : "–"}
            {stats.ratedCount > 0 && (
              <span className="ml-1 text-sm font-medium text-gray-500">
                ({stats.ratedCount})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <LuSearch
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search message, email or notes…"
              aria-label="Search feedback"
              className="field !pl-11"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as FeedbackStatusValue | "");
              setPage(1);
            }}
            aria-label="Filter by status"
            className="field"
          >
            <option value="">All statuses</option>
            {FEEDBACK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {FEEDBACK_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as FeedbackCategoryValue | "");
              setPage(1);
            }}
            aria-label="Filter by type"
            className="field"
          >
            <option value="">All types</option>
            {FEEDBACK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {FEEDBACK_CATEGORY_SHORT[c]} ({stats.byCategory[c]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      {/* List */}
      {items.length === 0 ? (
        <EmptyState
          mascot="idle"
          title={filtersActive ? "No feedback matches" : "No feedback yet"}
          description={
            filtersActive
              ? "Try clearing a filter or searching for something else."
              : "When users send feedback from the app, it will show up here."
          }
        />
      ) : (
        <ul className="space-y-4">
          {items.map((item) => {
            const expanded = expandedId === item.id;
            const draft = noteDrafts[item.id] ?? item.adminNotes ?? "";
            const notesChanged = draft.trim() !== (item.adminNotes ?? "");
            const busy = savingId === item.id;

            return (
              <li key={item.id} className="card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("chip", CATEGORY_CHIP[item.category])}>
                    {FEEDBACK_CATEGORY_SHORT[item.category]}
                  </span>
                  <span className={cn("chip", STATUS_CHIP[item.status])}>
                    {FEEDBACK_STATUS_LABELS[item.status]}
                  </span>
                  {item.rating !== null && <Stars value={item.rating} />}
                  <span className="ml-auto text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="mt-1.5 text-sm font-semibold text-gray-600 break-all">
                  {item.email}
                </p>

                <p
                  className={cn(
                    "mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink",
                    !expanded && "line-clamp-3",
                  )}
                >
                  {item.message}
                </p>
                {(item.message.length > 200 ||
                  item.message.includes("\n") ||
                  item.adminNotes ||
                  expanded) && (
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                    className="link mt-1 text-sm"
                    aria-expanded={expanded}
                  >
                    {expanded ? "Show less" : "Show more & notes"}
                  </button>
                )}

                {expanded && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    <div>
                      <label
                        htmlFor={`notes-${item.id}`}
                        className="mb-1.5 block text-sm font-bold text-ink"
                      >
                        Internal notes
                      </label>
                      <textarea
                        id={`notes-${item.id}`}
                        rows={3}
                        value={draft}
                        onChange={(e) =>
                          setNoteDrafts((d) => ({
                            ...d,
                            [item.id]: e.target.value,
                          }))
                        }
                        maxLength={5000}
                        placeholder="Roadmap thoughts, related tickets… (only admins see this)"
                        className="field resize-y"
                      />
                      <button
                        type="button"
                        disabled={!notesChanged || busy}
                        onClick={() => saveNotes(item, draft)}
                        className="btn btn-primary btn-sm mt-2"
                      >
                        Save notes
                      </button>
                    </div>
                    {item.userAgent && (
                      <p className="text-xs text-gray-500 break-all">
                        Device: {item.userAgent}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label
                    htmlFor={`status-${item.id}`}
                    className="text-sm font-bold text-ink"
                  >
                    Status
                  </label>
                  <select
                    id={`status-${item.id}`}
                    value={item.status}
                    disabled={busy}
                    onChange={(e) =>
                      patch(
                        item,
                        { status: e.target.value as FeedbackStatusValue },
                        "Status updated",
                      )
                    }
                    className="field !w-auto !min-h-[40px] !py-1.5"
                  >
                    {FEEDBACK_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {FEEDBACK_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline"
                  >
                    <LuTrash2 className="h-4 w-4" aria-hidden />
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn btn-secondary btn-sm"
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-gray-600">
            Page {page} of {totalPages} · {total} total
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn btn-secondary btn-sm"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this feedback?"
        description="This permanently removes the entry and any notes you added. Mark it Dismissed instead if you just want it out of the way."
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
