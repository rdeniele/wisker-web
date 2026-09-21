"use client";

import React from "react";
import { KpiCard, Panel, PlanChip, Unavailable } from "@/components/admin/ui";
import { RankedBars, TimeChart } from "@/components/admin/charts";
import { KpiGrid, type TabProps } from "@/components/admin/tabs/parts";
import { cn } from "@/lib/utils";
import { fmtDateTime, fmtInt, fmtPct, fmtPeso, fmtPesoCompact, planLabel } from "@/lib/admin-format";

export default function RevenueTab({ data }: TabProps) {
  const { revenue: r, series, range } = data;
  const has = r.ledgerStartedAt !== null;
  const s = r.subscribers;
  const na = "—";

  return (
    <div className="space-y-8">
      {!has && (
        <Unavailable title="No payments recorded yet">
          Revenue, MRR, ARR, ARPU and lifetime value come only from real payments, and none are in the database yet.
          The payment ledger records every PayMongo payment from now on (payments made before it existed were never
          stored here). Subscriber counts below are real and available now.
        </Unavailable>
      )}

      <KpiGrid>
        <KpiCard label="Revenue" value={has ? fmtPeso(r.total.current) : na} delta={has ? r.total : undefined}
          hint="Recorded payments in the period, net of refunds." />
        <KpiCard label="Payments" value={has ? fmtInt(r.payments.current) : na} delta={has ? r.payments : undefined}
          hint="Successful payments recorded in the period." />
        <KpiCard label="Paying customers" value={has ? fmtInt(r.payers.current) : na} delta={has ? r.payers : undefined}
          hint="Distinct users with a successful payment in the period." />
        <KpiCard label="New paying customers" value={has ? fmtInt(r.firstTimePayers.current) : na}
          delta={has ? r.firstTimePayers : undefined} hint="Users whose first ever recorded payment fell in this period." />
        <KpiCard label="MRR" value={r.mrr === null ? na : fmtPeso(r.mrr)}
          note={r.arr === null ? "Needs recorded payments" : `ARR ${fmtPeso(r.arr)}`}
          hint="Monthly-normalised value of active subscriptions whose latest recorded payment still covers today (yearly ÷ 12). Promo and granted plans are excluded." />
        <KpiCard label="ARPU" value={r.arpu === null ? na : fmtPeso(r.arpu)}
          note={r.arppu === null ? undefined : `ARPPU ${fmtPeso(r.arppu)}`}
          hint="Revenue in the period ÷ all users (ARPU) and ÷ paying customers (ARPPU)." />
        <KpiCard label="Failed payments" value={has ? fmtInt(r.failed.current) : na} delta={has ? r.failed : undefined}
          goodWhen="down" hint="Payments the provider reported as failed." />
        <KpiCard label="Refunds" value={has ? fmtInt(r.refunded.current) : na}
          delta={has ? r.refunded : undefined} goodWhen="down"
          note={has && r.refundedAmount.current > 0 ? fmtPeso(r.refundedAmount.current) : undefined}
          hint="Payments marked refunded (from the provider's refund events)." />
      </KpiGrid>

      {has && (
        <TimeChart title="Revenue" subtitle="Recorded payments, net of refunds" kind="bar" data={series}
          series={[{ key: "revenue", label: "Revenue", format: fmtPeso, axisFormat: fmtPesoCompact }]}
          granularity={range.granularity} />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Free vs paying" subtitle="Everyone, right now">
          <RankedBars
            items={[
              { label: "Free plan", value: s.free },
              { label: "Paying (payment on record)", value: s.paying, hint: "Latest recorded payment still covers today" },
              { label: "On a promo code", value: s.promo, hint: "Paid plan through a promo, no payment on record" },
              { label: "Granted or unrecorded", value: s.complimentary, hint: "Paid plan with no payment and no promo (admin-granted, or before payments were recorded)" },
              { label: "Expired, still on paid plan", value: s.expired, hint: "End date passed but the plan was never downgraded" },
            ]}
          />
          <p className="mt-3 text-xs text-gray-500">
            Conversion (active paid plans ÷ all users):{" "}
            <strong className="text-ink">{r.conversionRate === null ? na : fmtPct(r.conversionRate, 1)}</strong>
          </p>
        </Panel>

        <Panel title="Subscriptions" subtitle="Movement in the selected period">
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-sand p-3">
              <dt className="text-xs font-bold text-gray-600">Started or renewed</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums text-ink">{fmtInt(r.subscriptionsStarted.current)}</dd>
              <dd className="text-xs text-gray-500">prev {fmtInt(r.subscriptionsStarted.previous)}</dd>
            </div>
            <div className="rounded-2xl bg-sand p-3">
              <dt className="text-xs font-bold text-gray-600">Ended (not renewed)</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums text-ink">{fmtInt(r.subscriptionsEnded.current)}</dd>
              <dd className="text-xs text-gray-500">prev {fmtInt(r.subscriptionsEnded.previous)}</dd>
            </div>
            <div className="rounded-2xl bg-sand p-3" title="Subscriptions that ended in the period ÷ subscriptions with a recorded term that were active at its start">
              <dt className="text-xs font-bold text-gray-600">Churn rate</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums text-ink">
                {r.churnRate === null ? na : fmtPct(r.churnRate, 1)}
              </dd>
              <dd className="text-xs text-gray-500">{r.churnRate === null ? "No subscribers with a term at the start" : "of subscribers at the start"}</dd>
            </div>
            <div className="rounded-2xl bg-sand p-3" title="Total recorded revenue ÷ customers with a recorded payment">
              <dt className="text-xs font-bold text-gray-600">Lifetime value</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums text-ink">
                {r.ltv.value === null ? na : fmtPeso(r.ltv.value)}
              </dd>
              <dd className="text-xs text-gray-500">
                {r.ltv.value === null ? `Needs ${r.ltv.required} customers (have ${r.ltv.customers})` : `${r.ltv.customers} customers`}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-gray-500">
            Cancellations aren&apos;t recorded as events, so churn is derived from subscription end dates.
            Renewals count as &ldquo;started or renewed&rdquo; because a renewal resets the start date.
          </p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Active paid plans" subtitle="By plan, right now">
          {s.byPlan.length === 0 ? (
            <p className="text-sm text-gray-500">No active paid plans.</p>
          ) : (
            <RankedBars items={s.byPlan.map((p) => ({ label: planLabel(p.plan), value: p.count }))} />
          )}
        </Panel>
        <Panel title="Revenue by plan" subtitle="Recorded payments in the period">
          {r.byPlan.length === 0 ? (
            <p className="text-sm text-gray-500">No recorded payments in this period.</p>
          ) : (
            <RankedBars format={fmtPeso} items={r.byPlan.map((p) => ({ label: `${planLabel(p.plan)} · ${p.payments} payment${p.payments === 1 ? "" : "s"}`, value: p.revenue }))} />
          )}
        </Panel>
      </div>

      <Panel title="Recent payments" subtitle="Successful, failed and refunded, in the period">
        {r.recent.length === 0 ? (
          <p className="text-sm text-gray-500">No payments recorded in this period.</p>
        ) : (
          <ul className="divide-y divide-line">
            {r.recent.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                <span className={cn("chip !px-2 !py-0.5 !text-xs", p.status === "PAID" ? "chip-success" : p.status === "FAILED" ? "chip-danger" : "chip-neutral")}>
                  {p.status === "PAID" ? "Paid" : p.status === "FAILED" ? "Failed" : "Refunded"}
                </span>
                <span className="min-w-0 flex-1 basis-40 truncate font-semibold text-ink">{p.email ?? "Unknown user"}</span>
                {p.planType && <PlanChip plan={p.planType} />}
                <span className="font-bold tabular-nums text-ink">{fmtPeso(p.amount)}</span>
                <span className="w-full text-xs text-gray-500 sm:w-auto">
                  {fmtDateTime(p.occurredAt)}
                  {p.billingPeriod ? ` · ${p.billingPeriod}` : ""}
                  {p.promoCode ? ` · ${p.promoCode}` : ""}
                  {p.failureReason ? ` · ${p.failureReason}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
