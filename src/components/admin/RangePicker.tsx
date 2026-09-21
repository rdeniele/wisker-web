"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { RangeKey } from "@/lib/admin-range";
import type { RangeSelection } from "@/components/admin/useAnalytics";

const PRESETS: { value: RangeKey; label: string; long: string }[] = [
  { value: "today", label: "Today", long: "Today" },
  { value: "7d", label: "7D", long: "Last 7 days" },
  { value: "30d", label: "30D", long: "Last 30 days" },
  { value: "90d", label: "90D", long: "Last 90 days" },
  { value: "12m", label: "12M", long: "Last 12 months" },
  { value: "custom", label: "Custom", long: "Custom range" },
];

/** Date-range filter: presets first, custom dates tucked behind one button. */
export default function RangePicker({
  value,
  onChange,
  maxDate,
}: {
  value: RangeSelection;
  onChange: (next: RangeSelection) => void;
  /** Latest selectable day, `YYYY-MM-DD` (today in the viewer's timezone). */
  maxDate?: string;
}) {
  const [draft, setDraft] = useState({ from: value.from ?? "", to: value.to ?? "" });
  const valid = !!draft.from && !!draft.to && draft.from <= draft.to;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div role="group" aria-label="Date range" className="flex max-w-full flex-wrap gap-1 rounded-2xl border border-line bg-white p-1">
        {PRESETS.map((p) => {
          const on = value.range === p.value;
          return (
            <button
              key={p.value}
              type="button"
              aria-pressed={on}
              aria-label={p.long}
              onClick={() =>
                p.value === "custom"
                  ? onChange({ range: "custom", from: draft.from || undefined, to: draft.to || undefined })
                  : onChange({ range: p.value })
              }
              className={cn(
                "min-h-10 rounded-xl px-3 text-sm font-bold transition-colors",
                on ? "bg-ink text-white" : "text-gray-600 hover:bg-sand hover:text-ink",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {value.range === "custom" && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) onChange({ range: "custom", from: draft.from, to: draft.to });
          }}
        >
          <label className="min-w-[9.5rem] flex-1 text-xs font-bold text-gray-600">
            From
            <input
              type="date"
              className="field mt-1 !min-h-10 !py-1.5"
              value={draft.from}
              max={draft.to || maxDate}
              onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
            />
          </label>
          <label className="min-w-[9.5rem] flex-1 text-xs font-bold text-gray-600">
            To
            <input
              type="date"
              className="field mt-1 !min-h-10 !py-1.5"
              value={draft.to}
              min={draft.from || undefined}
              max={maxDate}
              onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
            />
          </label>
          <button type="submit" disabled={!valid} className="btn btn-primary btn-sm">
            Apply
          </button>
        </form>
      )}
    </div>
  );
}
