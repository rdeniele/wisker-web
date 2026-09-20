"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuArrowLeft,
  LuClock,
  LuFileText,
  LuLibrary,
  LuSearch,
  LuX,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";

interface SearchResult {
  id: string;
  title: string;
  type: "subject" | "note";
  subjectName?: string;
  lastAccessed?: string;
}

/** Debounced search against /api/search. */
function useSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        if (!cancelled) setResults(data.results || []);
      } catch (error) {
        console.error("Search error:", error);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  return { results, loading };
}

function ResultList({
  query,
  results,
  loading,
  activeIndex,
  onPick,
  listId,
}: {
  query: string;
  results: SearchResult[];
  loading: boolean;
  activeIndex: number;
  onPick: (r: SearchResult) => void;
  listId: string;
}) {
  if (!query.trim()) {
    return (
      <p className="px-4 py-6 text-center text-[15px] font-semibold text-gray-600">
        Search your subjects and notes.
      </p>
    );
  }
  if (loading && results.length === 0) {
    return (
      <div className="space-y-2 p-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  if (results.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-[15px] font-semibold text-gray-600">
        No matches for “{query.trim()}”.
      </p>
    );
  }
  return (
    <ul id={listId} role="listbox" aria-label="Search results" className="p-2">
      {results.map((r, i) => (
        <li
          key={`${r.type}-${r.id}-${i}`}
          role="option"
          aria-selected={i === activeIndex}
        >
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onPick(r)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-sand",
              i === activeIndex && "bg-sand",
            )}
          >
            <span
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                r.type === "subject"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-indigo-100 text-indigo-700",
              )}
            >
              {r.type === "subject" ? (
                <LuLibrary className="h-5 w-5" aria-hidden />
              ) : (
                <LuFileText className="h-5 w-5" aria-hidden />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold text-ink">
                {r.title}
              </span>
              <span className="block truncate text-sm font-semibold text-gray-600">
                {r.type === "subject" ? "Subject" : `Note · ${r.subjectName ?? ""}`}
              </span>
            </span>
            {r.lastAccessed && (
              <span className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-gray-500 sm:flex">
                <LuClock className="h-3.5 w-3.5" aria-hidden />
                {r.lastAccessed}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

function useResultNavigation(onDone: () => void) {
  const router = useRouter();
  return (r: SearchResult) => {
    // The API returns the parent subject id for notes, so both land on the subject page.
    router.push(`/subjects/${r.id}`);
    onDone();
  };
}

/** Desktop search: an always-visible field with a results popover. */
export function SearchField({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = "global-search-results";
  const { results, loading } = useSearch(query);
  const pick = useResultNavigation(() => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  });

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // "/" focuses search, like most product search boxes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const showPanel = open && query.trim().length > 0;

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <LuSearch
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Search subjects and notes"
        placeholder="Search subjects and notes"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            inputRef.current?.blur();
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && active >= 0 && results[active]) {
            e.preventDefault();
            pick(results[active]);
          }
        }}
        className="field h-12 rounded-full pl-12 pr-12 [&::-webkit-search-cancel-button]:hidden"
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="btn btn-icon absolute right-1.5 top-1/2 h-9 min-h-0 w-9 min-w-0 -translate-y-1/2 rounded-full text-gray-500"
        >
          <LuX className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-lg border border-line bg-white px-2 py-0.5 text-xs font-bold text-gray-500 xl:block">
          /
        </kbd>
      )}

      {showPanel && (
        <div className="animate-pop-in absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-3xl border border-line bg-white shadow-xl">
          <ResultList
            query={query}
            results={results}
            loading={loading}
            activeIndex={active}
            onPick={pick}
            listId={listId}
          />
        </div>
      )}
    </div>
  );
}

/** Mobile search: a full-screen sheet with the keyboard up immediately. */
export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const listId = "mobile-search-results";
  const { results, loading } = useSearch(query);
  const pick = useResultNavigation(() => {
    onClose();
    setQuery("");
  });

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="animate-fade-in fixed inset-0 z-[90] flex flex-col bg-cream"
    >
      <div className="pt-safe flex items-center gap-2 border-b border-line bg-white px-3 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="btn btn-icon shrink-0"
        >
          <LuArrowLeft className="h-6 w-6" aria-hidden />
        </button>
        <div className="relative min-w-0 flex-1">
          <LuSearch
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
            aria-hidden
          />
          <input
            autoFocus
            type="search"
            enterKeyHint="search"
            aria-label="Search subjects and notes"
            placeholder="Search subjects and notes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="field h-12 rounded-full pl-12 pr-4 [&::-webkit-search-cancel-button]:hidden"
          />
        </div>
      </div>
      <div className="pb-safe min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ResultList
          query={query}
          results={results}
          loading={loading}
          activeIndex={-1}
          onPick={pick}
          listId={listId}
        />
      </div>
    </div>
  );
}
