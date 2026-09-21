"use client";

/** Shared building blocks for the admin dashboard, built on the Wisker design system. */

import React from "react";
import { LuArrowDownRight, LuArrowUpRight, LuInfo, LuMinus } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { fmtChange } from "@/lib/admin-format";
import Skeleton from "@/components/ui/Skeleton";
import { Sparkline } from "@/components/admin/charts";
import type { Delta } from "@/lib/admin-analytics-types";

// ---------------------------------------------------------------- delta chip

/**
 * Change vs the comparison period. `goodWhen` says which direction is good, so
 * a rise in failures reads as bad. No baseline (previous = 0) says "New"/"—"
 * rather than inventing a percentage.
 */
export function DeltaChip({
  delta,
  goodWhen = "up",
  compareLabel = "vs previous",
}: {
  delta: Delta;
  goodWhen?: "up" | "down";
  compareLabel?: string;
}) {
  const text = fmtChange(delta.change);
  if (text === null) {
    const isNew = delta.current > 0 && delta.previous === 0;
    return (
      <span className="chip chip-neutral !px-2 !py-0.5 !text-xs" title={`Previous period: ${delta.previous}`}>
        <LuMinus aria-hidden className="h-3 w-3" />
        {isNew ? "New" : "No change"}
      </span>
    );
  }
  const up = delta.change! > 0;
  const flat = delta.change === 0;
  const good = flat ? null : (goodWhen === "up") === up;
  return (
    <span
      className={cn(
        "chip !px-2 !py-0.5 !text-xs",
        good === null ? "chip-neutral" : good ? "chip-success" : "chip-danger",
      )}
      title={`${compareLabel}: ${delta.previous}`}
    >
      {flat ? (
        <LuMinus aria-hidden className="h-3 w-3" />
      ) : up ? (
        <LuArrowUpRight aria-hidden className="h-3 w-3" />
      ) : (
        <LuArrowDownRight aria-hidden className="h-3 w-3" />
      )}
      <span className="sr-only">{up ? "Up" : flat ? "Unchanged" : "Down"} </span>
      {text.replace(/^[+-]/, "")}
    </span>
  );
}

// ------------------------------------------------------------------ KPI card

export function KpiCard({
  label,
  value,
  delta,
  goodWhen,
  note,
  spark,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  delta?: Delta;
  goodWhen?: "up" | "down";
  /** Small line under the value (definition, breakdown…). */
  note?: React.ReactNode;
  spark?: number[];
  /** Tooltip text explaining how the number is defined. */
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("card flex min-w-0 flex-col gap-2 p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-[13px] font-bold text-gray-600">{label}</p>
        {hint && (
          <span title={hint} className="shrink-0 text-gray-400" aria-label={hint} role="img">
            <LuInfo aria-hidden className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="min-w-0 truncate font-display text-[1.75rem] font-semibold leading-none tracking-tight text-ink tabular-nums sm:text-[2rem]">
          {value}
        </p>
        {spark && <Sparkline values={spark} />}
      </div>
      <div className="flex min-h-[22px] flex-wrap items-center gap-x-2 gap-y-1">
        {delta && <DeltaChip delta={delta} goodWhen={goodWhen} />}
        {note && <span className="text-xs font-medium text-gray-500">{note}</span>}
      </div>
    </div>
  );
}

export function KpiSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card space-y-3 p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

// -------------------------------------------------------------------- layout

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Panel({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("card min-w-0 p-4 sm:p-5", className)}>
      {(title || action) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {title && <h3 className="text-base font-bold text-ink">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-[13px] text-gray-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/** A note about a metric the data can't support (never a fake number). */
export function Unavailable({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-dashed border-[#f3d6ae] bg-sand p-4">
      <LuInfo aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-orange-700" />
      <div className="min-w-0 text-sm">
        <p className="font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-gray-600">{children}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- pill tabs

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-line bg-white p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={on}
            className={cn(
              "rounded-xl font-bold transition-colors",
              size === "sm" ? "min-h-8 px-2.5 text-xs" : "min-h-10 px-3 text-sm",
              on ? "bg-ink text-white" : "text-gray-600 hover:bg-sand hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- status chip

export function PlanChip({ plan }: { plan: string }) {
  return (
    <span
      className={cn(
        "chip !px-2.5 !py-0.5 !text-xs",
        plan === "FREE" ? "chip-neutral" : plan === "PREMIUM" ? "chip-accent" : "",
      )}
    >
      {plan === "PRO" ? "Pro" : plan === "PREMIUM" ? "Premium" : plan === "FREE" ? "Free" : plan}
    </span>
  );
}

/** Account status shown in the list. Suspension wins over subscription state. */
export function StatusChip({
  user,
}: {
  user: {
    suspendedAt: string | null;
    subscriptionStatus: string | null;
    planType: string;
    /** True when the paid term has ended (computed on the server). */
    planExpired: boolean;
  };
}) {
  if (user.suspendedAt) return <span className="chip chip-danger !px-2.5 !py-0.5 !text-xs">Suspended</span>;
  const expired = user.planExpired;
  if (user.planType !== "FREE" && user.subscriptionStatus === "active") {
    return expired ? (
      <span className="chip !px-2.5 !py-0.5 !text-xs">Expired</span>
    ) : (
      <span className="chip chip-success !px-2.5 !py-0.5 !text-xs">Active plan</span>
    );
  }
  return <span className="chip chip-neutral !px-2.5 !py-0.5 !text-xs">{user.subscriptionStatus === "canceled" ? "Canceled" : user.subscriptionStatus === "past_due" ? "Past due" : "No plan"}</span>;
}
