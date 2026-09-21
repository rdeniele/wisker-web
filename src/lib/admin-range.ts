/**
 * Date-range resolution for the admin dashboard.
 *
 * Ranges are calendar-aligned in the *viewer's* timezone (so "today" means
 * the admin's today, not UTC's) and converted to absolute instants for SQL.
 * The comparison period is the same length, shifted back by the nominal
 * period, and covers the same elapsed time when the current period is still
 * in progress (so "today so far" is compared with "yesterday at this time").
 */

export type RangeKey = "today" | "7d" | "30d" | "90d" | "12m" | "custom";
export type Granularity = "hour" | "day" | "week" | "month";

export const RANGE_KEYS: RangeKey[] = ["today", "7d", "30d", "90d", "12m", "custom"];
export const DEFAULT_TZ = "UTC";
const DAY = 86_400_000;
const MAX_CUSTOM_DAYS = 731;

export interface ResolvedRange {
  key: RangeKey;
  tz: string;
  /** Inclusive start instant. */
  from: Date;
  /** Exclusive end instant, capped at "now" so partial periods stay honest. */
  to: Date;
  /** Local calendar dates (YYYY-MM-DD) the user picked; `toLocal` is inclusive. */
  fromLocal: string;
  toLocal: string;
  granularity: Granularity;
  compareFrom: Date;
  compareTo: Date;
  /** True when the range includes the current, unfinished period. */
  partial: boolean;
  /** Whole days spanned by the range (>= 1). */
  days: number;
}

type Ymd = { y: number; m: number; d: number };

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const fmt = ({ y, m, d }: Ymd) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function parseYmd(s: string | null | undefined): Ymd | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
    return null;
  }
  return { y, m, d };
}

const toUtcMs = ({ y, m, d }: Ymd) => Date.UTC(y, m - 1, d);
const fromUtcMs = (ms: number): Ymd => {
  const dt = new Date(ms);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
};
const addDays = (v: Ymd, n: number) => fromUtcMs(toUtcMs(v) + n * DAY);
const addMonths = (v: Ymd, n: number): Ymd => {
  const total = v.y * 12 + (v.m - 1) + n;
  return { y: Math.floor(total / 12), m: (total % 12) + 1, d: 1 };
};
const diffDays = (a: Ymd, b: Ymd) => Math.round((toUtcMs(b) - toUtcMs(a)) / DAY);

/** Offset (ms) of `tz` from UTC at the given instant. */
function tzOffsetMs(tz: string, instant: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** The instant at which local calendar day `v` begins in `tz`. */
export function zonedStart(v: Ymd, tz: string): Date {
  const wall = toUtcMs(v);
  let guess = wall;
  for (let i = 0; i < 3; i++) guess = wall - tzOffsetMs(tz, guess);
  return new Date(guess);
}

/** Today's calendar date in `tz`. */
export function localToday(tz: string, now = new Date()): Ymd {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

/** Monday of the ISO week containing `v`. */
export const startOfWeek = (v: Ymd): Ymd => {
  const dow = (new Date(toUtcMs(v)).getUTCDay() + 6) % 7; // Mon = 0
  return addDays(v, -dow);
};
export const startOfMonth = (v: Ymd): Ymd => ({ y: v.y, m: v.m, d: 1 });
export { addDays, addMonths, fmt as formatYmd };

function pickGranularity(days: number): Granularity {
  if (days <= 1) return "hour";
  if (days <= 92) return "day";
  if (days <= 180) return "week";
  return "month";
}

export function resolveRange(
  input: { range?: string | null; from?: string | null; to?: string | null; tz?: string | null },
  now = new Date(),
): ResolvedRange {
  const tz = input.tz && isValidTimeZone(input.tz) ? input.tz : DEFAULT_TZ;
  const key: RangeKey = RANGE_KEYS.includes(input.range as RangeKey)
    ? (input.range as RangeKey)
    : "30d";

  const today = localToday(tz, now);
  let start: Ymd;
  let endInclusive: Ymd = today;
  let effectiveKey = key;

  switch (key) {
    case "today":
      start = today;
      break;
    case "7d":
      start = addDays(today, -6);
      break;
    case "90d":
      start = addDays(today, -89);
      break;
    case "12m":
      start = addMonths(today, -11);
      break;
    case "custom": {
      const f = parseYmd(input.from);
      const t = parseYmd(input.to);
      if (!f || !t) {
        // Malformed custom range: fall back to the default rather than erroring.
        start = addDays(today, -29);
        effectiveKey = "30d";
        break;
      }
      start = toUtcMs(f) <= toUtcMs(t) ? f : t;
      endInclusive = toUtcMs(f) <= toUtcMs(t) ? t : f;
      if (toUtcMs(endInclusive) > toUtcMs(today)) endInclusive = today;
      if (toUtcMs(start) > toUtcMs(endInclusive)) start = endInclusive;
      if (diffDays(start, endInclusive) + 1 > MAX_CUSTOM_DAYS) {
        start = addDays(endInclusive, -(MAX_CUSTOM_DAYS - 1));
      }
      break;
    }
    default:
      start = addDays(today, -29);
  }

  const endExclusive = addDays(endInclusive, 1);
  const days = diffDays(start, endExclusive);
  const from = zonedStart(start, tz);
  const nominalTo = zonedStart(endExclusive, tz);
  const to = new Date(Math.min(nominalTo.getTime(), now.getTime()));
  const partial = nominalTo.getTime() > now.getTime();

  // Comparison period: shifted back by the nominal length, same elapsed time.
  const shiftedStart =
    effectiveKey === "12m" ? addMonths(start, -12) : addDays(start, -days);
  const compareFrom = zonedStart(shiftedStart, tz);
  const compareTo = new Date(compareFrom.getTime() + (to.getTime() - from.getTime()));

  return {
    key: effectiveKey,
    tz,
    from,
    to,
    fromLocal: fmt(start),
    toLocal: fmt(endInclusive),
    granularity: pickGranularity(days),
    compareFrom,
    compareTo,
    partial,
    days,
  };
}
