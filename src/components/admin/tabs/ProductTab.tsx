"use client";

import React from "react";
import { KpiCard, Panel, Unavailable } from "@/components/admin/ui";
import { RankedBars, TimeChart } from "@/components/admin/charts";
import { KpiGrid, type TabProps } from "@/components/admin/tabs/parts";
import { fmtCompact, fmtDateTime, fmtDec, fmtInt, fmtPct } from "@/lib/admin-format";

export default function ProductTab({ data }: TabProps) {
  const { product: p, users, series, range } = data;
  const aiSeen = p.ai.total.current > 0 || p.ai.total.previous > 0;

  return (
    <div className="space-y-8">
      <KpiGrid>
        <KpiCard label="Content created" value={fmtInt(p.contentActions.current)} delta={p.contentActions}
          spark={series.map((x) => x.subjects + x.notes + x.tools)} hint="Subjects, notes and study tools created." />
        <KpiCard label="Notes failed to process" value={fmtInt(p.notesFailed.current)} delta={p.notesFailed} goodWhen="down"
          note={p.processingFailureRate === null ? "No notes in this period" : `${fmtPct(p.processingFailureRate, 1)} of new notes`}
          hint="Notes created in the period that ended in a failed processing state." />
        <KpiCard label="Active days per user" value={users.engagement ? fmtDec(users.engagement.avgActiveDays) : "—"}
          note={users.engagement ? `${fmtDec(users.engagement.avgActions)} actions per active user` : undefined}
          hint="Engagement: how many days each active user was active. Session length isn't tracked." />
        <KpiCard label="AI operations" value={aiSeen ? fmtInt(p.ai.total.current) : "—"}
          delta={aiSeen ? p.ai.total : undefined} note={aiSeen ? undefined : "Not recorded"}
          hint="Rows in the AI operation log." />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Feature usage" subtitle="Most used first, with the previous period for comparison">
          <RankedBars showPrevious items={p.features.map((f) => ({ label: f.label, value: f.count, previous: f.previous }))} />
        </Panel>
        <TimeChart title="Content created" subtitle="Subjects, notes and study tools" kind="bar" stacked data={series}
          series={[
            { key: "subjects", label: "Subjects" },
            { key: "notes", label: "Notes" },
            { key: "tools", label: "Study tools" },
          ]}
          granularity={range.granularity} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Recent processing failures" subtitle="Notes that failed in this period">
          {p.failures.length === 0 ? (
            <p className="text-sm text-gray-500">No failed notes in this period.</p>
          ) : (
            <ul className="divide-y divide-line">
              {p.failures.map((f) => (
                <li key={f.id} className="py-2.5 text-sm">
                  <p className="break-words font-semibold text-ink">{f.error}</p>
                  <p className="text-xs text-gray-500">{f.email} · {fmtDateTime(f.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="AI usage and cost" subtitle="From the AI operation log">
          {!aiSeen ? (
            <Unavailable title="Not tracked yet">
              No AI operations were recorded in this period. The AI services don&apos;t currently write to the
              operation log, so token usage, cost and AI error rates can&apos;t be reported.
            </Unavailable>
          ) : (
            <ul className="divide-y divide-line">
              {p.ai.byModel.map((m) => (
                <li key={m.model} className="flex flex-wrap items-baseline justify-between gap-x-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate font-bold text-ink">{m.model}</span>
                  <span className="tabular-nums text-gray-600">
                    {fmtInt(m.ops)} ops · {fmtInt(m.failed)} failed · {fmtCompact(m.tokens)} tokens · {fmtDec(m.credits)} credits
                    {m.avgMs !== null ? ` · ${fmtInt(m.avgMs)} ms avg` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
