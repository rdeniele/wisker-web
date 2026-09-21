"use client";

import React from "react";
import Link from "next/link";
import { LuCircleAlert, LuInfo, LuTrendingUp } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { fmtRelative } from "@/lib/admin-format";
import { Panel, PlanChip } from "@/components/admin/ui";
import type {
  AnalyticsResponse,
  Insight,
  RecentUser,
  TopUser,
  Unavailable as UnavailableItem,
} from "@/lib/admin-analytics-types";

export interface TabProps {
  data: AnalyticsResponse;
}

const insightIcon = { info: LuInfo, warning: LuCircleAlert, positive: LuTrendingUp } as const;

export function InsightList({ insights, limit }: { insights: Insight[]; limit?: number }) {
  const items = limit ? insights.slice(0, limit) : insights;
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Nothing unusual in this period.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {items.map((i, idx) => {
        const Icon = insightIcon[i.level];
        return (
          <li key={idx} className="flex gap-3">
            <span
              className={cn(
                "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full",
                i.level === "warning" && "bg-yellow-100 text-yellow-800",
                i.level === "positive" && "bg-green-100 text-green-700",
                i.level === "info" && "bg-indigo-100 text-indigo-700",
              )}
            >
              <Icon aria-hidden className="h-4 w-4" />
            </span>
            <div className="min-w-0 text-sm">
              <p className="font-bold text-ink">{i.title}</p>
              <p className="text-gray-600">{i.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function UnavailableList({ items, filter }: { items: UnavailableItem[]; filter?: string[] }) {
  const shown = filter ? items.filter((i) => filter.some((f) => i.metric.toLowerCase().includes(f))) : items;
  if (shown.length === 0) return null;
  return (
    <Panel
      title="Not available with current data"
      subtitle="These aren't estimated or filled in; the database doesn't hold what they need."
      className="border-dashed !bg-sand !shadow-none"
    >
      <ul className="space-y-2 text-sm">
        {shown.map((i) => (
          <li key={i.metric}>
            <span className="font-bold text-ink">{i.metric}. </span>
            <span className="text-gray-600">{i.reason}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function UserLink({
  id,
  email,
  className,
}: {
  id: string;
  email: string;
  className?: string;
}) {
  return (
    <Link
      href={`/admin/users?q=${encodeURIComponent(id)}`}
      className={cn("min-w-0 truncate font-semibold text-ink hover:underline", className)}
    >
      {email}
    </Link>
  );
}

export function TopUsersList({ users }: { users: TopUser[] }) {
  if (users.length === 0) return <p className="text-sm text-gray-500">No activity in this period.</p>;
  return (
    <ol className="divide-y divide-line">
      {users.map((u, i) => (
        <li key={u.id} className="flex items-center gap-3 py-2.5 text-sm">
          <span className="w-5 shrink-0 text-right text-xs font-bold text-gray-400 tabular-nums">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <UserLink id={u.id} email={u.email} className="block" />
            <p className="text-xs text-gray-500">
              {u.activeDays} active day{u.activeDays === 1 ? "" : "s"}
              {u.lastActiveAt ? ` · last ${fmtRelative(u.lastActiveAt)}` : ""}
            </p>
          </div>
          <PlanChip plan={u.planType} />
          <span className="w-14 shrink-0 text-right font-bold tabular-nums text-ink" title="Content actions in this period">
            {u.actions}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function RecentUsersList({ users }: { users: RecentUser[] }) {
  if (users.length === 0) return <p className="text-sm text-gray-500">No recorded activity yet.</p>;
  return (
    <ul className="divide-y divide-line">
      {users.map((u) => (
        <li key={u.id} className="flex items-center gap-3 py-2.5 text-sm">
          <UserLink id={u.id} email={u.email} className="flex-1" />
          <PlanChip plan={u.planType} />
          <span className="w-20 shrink-0 text-right text-xs font-medium text-gray-500">{fmtRelative(u.lastActiveAt)}</span>
        </li>
      ))}
    </ul>
  );
}

/** A responsive 1 → 2 → 4 column KPI grid. */
export function KpiGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">{children}</div>
  );
}
