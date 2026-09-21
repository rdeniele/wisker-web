"use client";

import React from "react";
import Link from "next/link";
import { KpiCard, Panel } from "@/components/admin/ui";
import { TimeChart } from "@/components/admin/charts";
import { InsightList, KpiGrid, UnavailableList, type TabProps } from "@/components/admin/tabs/parts";
import { fmtDec, fmtInt, fmtPct, fmtPeso, fmtPesoCompact } from "@/lib/admin-format";

export default function OverviewTab({ data }: TabProps) {
  const { users, revenue, product, series, range } = data;
  const g = range.granularity;
  const hasRevenue = revenue.ledgerStartedAt !== null;
  const s = revenue.subscribers;

  return (
    <div className="space-y-8">
      <KpiGrid>
        <KpiCard
          label="Total users"
          value={fmtInt(users.total.current)}
          delta={users.total}
          note={data.newFeedback > 0 ? (
            <Link href="/admin/feedback" className="underline">{data.newFeedback} new feedback</Link>
          ) : undefined}
          hint="All registered users as of the end of the selected period."
        />
        <KpiCard
          label="New users"
          value={fmtInt(users.signups.current)}
          delta={users.signups}
          spark={series.map((p) => p.signups)}
          hint="Accounts created in the selected period."
        />
        <KpiCard
          label="Active users"
          value={fmtInt(users.active.current)}
          delta={users.active}
          note={`WAU ${fmtInt(users.wau)} · MAU ${fmtInt(users.mau)}`}
          spark={series.map((p) => p.active)}
          hint="Distinct users with any recorded activity (a visit, or creating a subject, note or study tool). WAU/MAU are the trailing 7 and 30 days ending at the end of the period."
        />
        <KpiCard
          label="Avg daily active users"
          value={fmtDec(users.avgDau.current)}
          delta={users.avgDau}
          note={users.stickiness !== null ? `Stickiness ${fmtPct(users.stickiness)}` : undefined}
          hint="Average number of distinct users active per day. Stickiness is DAU ÷ MAU."
        />
        <KpiCard
          label="Revenue"
          value={hasRevenue ? fmtPeso(revenue.total.current) : "—"}
          delta={hasRevenue ? revenue.total : undefined}
          note={hasRevenue ? `${fmtInt(revenue.payments.current)} payments` : "No payments recorded yet"}
          spark={hasRevenue ? series.map((p) => p.revenue) : undefined}
          hint="Recorded payments (net of refunds) from the payment ledger. Never estimated from plan prices."
        />
        <KpiCard
          label="Active paid plans"
          value={fmtInt(s.paidPlan)}
          note={`${s.paying} paying · ${s.promo} promo · ${s.complimentary} granted`}
          hint="Users currently on an active paid plan, split by what can be verified: a recorded payment, a promo code, or granted/unrecorded."
        />
        <KpiCard
          label="Content created"
          value={fmtInt(product.contentActions.current)}
          delta={product.contentActions}
          spark={series.map((p) => p.subjects + p.notes + p.tools)}
          hint="Subjects, notes and study tools created."
        />
        <KpiCard
          label="Free → paid"
          value={revenue.conversionRate === null ? "—" : fmtPct(revenue.conversionRate, 1)}
          note={`${fmtInt(s.paidPlan)} of ${fmtInt(users.total.current)} users`}
          hint="Share of all users currently on an active paid plan (includes promo and granted plans)."
        />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <TimeChart
            title="New vs active users"
            subtitle="Accounts created and distinct users active in each period"
            data={series}
            series={[
              { key: "signups", label: "New users" },
              { key: "active", label: "Active users" },
            ]}
            granularity={g}
          />
        </div>
        <Panel title="What stands out" subtitle="Computed from the numbers on this page">
          <InsightList insights={data.insights} limit={5} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TimeChart
          title="Content created"
          subtitle="Subjects, notes and study tools"
          kind="bar"
          stacked
          data={series}
          series={[
            { key: "subjects", label: "Subjects" },
            { key: "notes", label: "Notes" },
            { key: "tools", label: "Study tools" },
          ]}
          granularity={g}
        />
        {hasRevenue ? (
          <TimeChart
            title="Revenue"
            subtitle="Recorded payments, net of refunds"
            kind="bar"
            data={series}
            series={[
              { key: "revenue", label: "Revenue", format: fmtPeso, axisFormat: fmtPesoCompact },
            ]}
            granularity={g}
          />
        ) : (
          <Panel title="Revenue" subtitle="Recorded payments, net of refunds">
            <p className="text-sm text-gray-600">
              No payments have been recorded yet. The payment ledger fills from PayMongo webhooks
              going forward, so revenue appears here after the first payment.
            </p>
          </Panel>
        )}
      </div>

      <UnavailableList items={data.unavailable} />
    </div>
  );
}
