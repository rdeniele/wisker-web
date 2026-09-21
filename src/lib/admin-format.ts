/** Formatting helpers for the admin dashboard. Exact values, no rounding tricks. */
import type { Granularity } from "@/lib/admin-range";

const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const dec1 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const dec2 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});
const pesoWhole = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export const fmtInt = (n: number) => int.format(n);
/** One decimal, or two below 10 so small averages (0.03) don't collapse to 0. */
export const fmtDec = (n: number) => (Math.abs(n) < 10 ? dec2 : dec1).format(n);
export const fmtCompact = (n: number) => compact.format(n);
export const fmtPeso = (n: number) => (Number.isInteger(n) ? pesoWhole : peso).format(n);
export const fmtPesoCompact = (n: number) =>
  Math.abs(n) >= 10_000 ? `₱${compact.format(n)}` : fmtPeso(n);
export const fmtPct = (fraction: number, digits = 0) =>
  `${(fraction * 100).toFixed(digits)}%`;

/** `+12%`, `-8%`, or `null` when there is no baseline. */
export function fmtChange(change: number | null): string | null {
  if (change === null) return null;
  const v = Math.round(change * 100);
  return `${v > 0 ? "+" : ""}${v}%`;
}

/** Parse a local wall-clock string (`YYYY-MM-DD[THH:mm:ss]`) without timezone shifts. */
export function parseLocal(t: string): Date {
  const [d, time = "00:00:00"] = t.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, day, hh || 0, mm || 0);
}

const dayShort = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const dayLong = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const monthShort = new Intl.DateTimeFormat("en-US", { month: "short" });
const monthYear = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const hourShort = new Intl.DateTimeFormat("en-US", { hour: "numeric" });
const hourLong = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Short axis label for a bucket. */
export function bucketLabel(t: string, g: Granularity): string {
  const d = parseLocal(t);
  if (g === "hour") return hourShort.format(d);
  if (g === "month") return monthShort.format(d);
  return dayShort.format(d);
}

/** Full tooltip title for a bucket. */
export function bucketTitle(t: string, g: Granularity): string {
  const d = parseLocal(t);
  if (g === "hour") return hourLong.format(d);
  if (g === "week") return `Week of ${dayShort.format(d)}`;
  if (g === "month") return monthYear.format(d);
  return dayLong.format(d);
}

const dateTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const dateOnly = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? dateTime.format(new Date(iso)) : "—";
export const fmtDate = (iso: string | null | undefined) =>
  iso ? dateOnly.format(new Date(iso)) : "—";

/** "3 hours ago" style; falls back to the date after a month. */
export function fmtRelative(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "Never";
  const diff = now - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 31) return `${days}d ago`;
  return fmtDate(iso);
}

export const planLabel = (plan: string) =>
  plan === "PRO" ? "Pro" : plan === "PREMIUM" ? "Premium" : plan === "FREE" ? "Free" : plan;
