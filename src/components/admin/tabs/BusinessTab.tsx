"use client";

import React, { useState } from "react";
import { Panel, Segmented } from "@/components/admin/ui";
import { InsightList, UnavailableList, type TabProps } from "@/components/admin/tabs/parts";
import { SERIES_COLORS } from "@/components/admin/charts";
import { fmtInt, fmtPct, parseLocal } from "@/lib/admin-format";
import type { CohortRow } from "@/lib/admin-analytics-types";

export default function BusinessTab({ data }: TabProps) {
  const { funnel, users } = data;
  const [cohortKind, setCohortKind] = useState<"week" | "month">("month");
  const first = funnel[0]?.count ?? 0;

  return (
    <div className="space-y-8">
      <Panel
        title="Acquisition → activation → retention → revenue"
        subtitle={`Users who signed up ${data.range.fromLocal} to ${data.range.toLocal}, followed to today`}
      >
        {first === 0 ? (
          <p className="text-sm text-gray-500">
            Nobody signed up in this period, so there is no funnel to show. Try a longer range.
          </p>
        ) : (
          <ol className="space-y-4">
            {funnel.map((step, i) => (
              <li key={step.key}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span className="font-bold text-ink">
                    {i + 1}. {step.label}
                  </span>
                  <span className="tabular-nums text-ink">
                    <strong>{fmtInt(step.count)}</strong>
                    <span className="ml-1.5 text-xs font-medium text-gray-500">
                      {step.ofFirst === null ? "" : `${fmtPct(step.ofFirst, 1)} of signups`}
                    </span>
                  </span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-gray-100" aria-hidden>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(step.ofFirst ?? 0) * 100}%`, background: SERIES_COLORS[0], minWidth: step.count > 0 ? 6 : 0 }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">{step.hint}</p>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <Panel
        title="Retention cohorts"
        subtitle="Share of each signup cohort that was active in each later period (period 0 is the signup period)"
        action={
          <Segmented
            label="Cohort size"
            size="sm"
            value={cohortKind}
            onChange={setCohortKind}
            options={[
              { value: "month", label: "Monthly" },
              { value: "week", label: "Weekly" },
            ]}
          />
        }
      >
        <CohortTable rows={users.cohorts[cohortKind]} kind={cohortKind} />
        {users.trackingSince && (
          <p className="mt-3 text-xs text-gray-500">
            Activity before {users.trackingSince} is inferred from content creation only, so early cohorts
            under-count users who only visited.
          </p>
        )}
      </Panel>

      <Panel title="What stands out" subtitle="Computed from the numbers, not written by hand">
        <InsightList insights={data.insights} />
      </Panel>

      <UnavailableList items={data.unavailable} />
    </div>
  );
}

const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function CohortTable({ rows, kind }: { rows: CohortRow[]; kind: "week" | "month" }) {
  const populated = rows.some((r) => r.size > 0);
  if (!populated) {
    return <p className="text-sm text-gray-500">No signups in the last {kind === "week" ? "8 weeks" : "6 months"}.</p>;
  }
  const cols = Math.max(...rows.map((r) => r.retained.length));
  return (
    <div>
      <table className="w-full table-fixed border-separate border-spacing-0.5 text-center text-[10px] sm:border-spacing-1 sm:text-xs">
        <thead>
          <tr className="text-gray-500">
            <th className="w-[3.75rem] text-left font-bold sm:w-16">Cohort</th>
            <th className="w-9 font-bold sm:w-10">Users</th>
            {Array.from({ length: cols }, (_, k) => (
              <th key={k} className="font-bold">
                {kind === "week" ? "W" : "M"}
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.cohort}>
              <th scope="row" className="whitespace-nowrap text-left font-bold text-ink">
                {(kind === "week" ? dayFmt : monthFmt).format(parseLocal(r.cohort))}
              </th>
              <td className="font-semibold tabular-nums text-ink">{r.size}</td>
              {Array.from({ length: cols }, (_, k) => {
                const n = r.retained[k];
                if (n === undefined || n === null || r.size === 0) {
                  return <td key={k} className="rounded-md bg-gray-50 py-1.5 text-gray-300">·</td>;
                }
                const share = n / r.size;
                return (
                  <td
                    key={k}
                    title={`${n} of ${r.size} users (${fmtPct(share, 1)})`}
                    className="rounded-md py-1.5 font-bold tabular-nums"
                    // One-hue sequential ramp: darker = higher retention
                    style={{
                      background: `rgb(76 74 230 / ${(0.08 + share * 0.72).toFixed(2)})`,
                      color: share > 0.5 ? "#fff" : "var(--ink)",
                    }}
                  >
                    {fmtPct(share)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
