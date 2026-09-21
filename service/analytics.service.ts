/**
 * Admin analytics
 *
 * Every number here comes from the database, computed with a handful of
 * set-based queries (no per-row lookups). Results are cached per server
 * instance for a short time and de-duplicated while in flight; the API route
 * only reaches this after the admin check, so cached data is never served to
 * anyone else.
 *
 * Definitions worth knowing:
 *  - "Active user": a user with any recorded activity in the period, i.e. an
 *    authenticated visit (user_activity, tracked since the table was added) or
 *    creating a subject, note or study tool, or an AI operation. Content
 *    creation gives history from before visit tracking existed.
 *  - Revenue comes only from the payment ledger (payment_transactions), which
 *    is fed by PayMongo webhooks; it is never estimated from plan prices.
 *  - All times are stored as UTC `timestamp without time zone`; buckets and
 *    "days" are computed in the viewer's timezone.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TtlCache } from "@/lib/ttl-cache";
import {
  addDays,
  addMonths,
  formatYmd,
  localToday,
  startOfMonth,
  startOfWeek,
  zonedStart,
  type ResolvedRange,
} from "@/lib/admin-range";
import type {
  AnalyticsResponse,
  CohortRow,
  Delta,
  FeatureUsage,
  FunnelStep,
  Insight,
  PaymentRow,
  RecentUser,
  SeriesPoint,
  TopUser,
  Unavailable,
} from "@/lib/admin-analytics-types";

const DAY_MS = 86_400_000;
const CACHE_TTL_MS = 60_000;
/** Recorded customers needed before a lifetime value is worth showing. */
const LTV_MIN_CUSTOMERS = 10;

// ---------------------------------------------------------------- SQL helpers

/** A JS instant as a UTC-naive timestamp, matching how columns are stored. */
const ts = (d: Date) =>
  Prisma.sql`(${d.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;

/** A stored UTC-naive column converted to the viewer's local wall-clock time. */
const loc = (col: string, tz: string) =>
  Prisma.sql`((${Prisma.raw(col)} AT TIME ZONE 'UTC') AT TIME ZONE ${tz})`;

/** ISO-8601 string (UTC) for a stored timestamp column. */
const isoSql = (col: string) =>
  Prisma.sql`to_char(${Prisma.raw(col)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

/**
 * Activity events in [lo, hi), unified across every place a user leaves a
 * footprint. `act` drops events of users that no longer exist.
 */
function eventsCte(lo: Date, hi: Date) {
  const l = ts(lo);
  const h = ts(hi);
  return Prisma.sql`
    ev AS (
      SELECT s.user_id AS user_id, s.created_at AS ts, 'subject'::text AS kind
        FROM subjects s WHERE s.created_at >= ${l} AND s.created_at < ${h}
      UNION ALL
      SELECT s.user_id, n.created_at, 'note'
        FROM notes n JOIN subjects s ON s.id = n.subject_id
        WHERE n.created_at >= ${l} AND n.created_at < ${h}
      UNION ALL
      SELECT s.user_id, lt.created_at, 'tool'
        FROM learning_tools lt
        LEFT JOIN notes ln ON ln.id = lt.note_id
        JOIN subjects s ON s.id = COALESCE(lt.subject_id, ln.subject_id)
        WHERE lt.created_at >= ${l} AND lt.created_at < ${h}
      UNION ALL
      SELECT a.user_id, a.created_at, 'ai'
        FROM ai_operation_logs a WHERE a.created_at >= ${l} AND a.created_at < ${h}
      UNION ALL
      SELECT ua.user_id, ua.hour_start, 'visit'
        FROM user_activity ua WHERE ua.hour_start >= ${l} AND ua.hour_start < ${h}
    ),
    act AS (
      SELECT e.user_id, e.ts, e.kind FROM ev e JOIN users u ON u.id = e.user_id
    )`;
}

const delta = (current: number, previous: number): Delta => ({
  current,
  previous,
  change: previous > 0 ? (current - previous) / previous : null,
});
const pesos = (centavos: number) => Math.round(centavos) / 100;
const ratio = (a: number, b: number) => (b > 0 ? a / b : null);

/** Run async tasks with a concurrency cap (the DB pooler has very few slots). */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}

// ------------------------------------------------------------ window metrics

interface WindowMetrics {
  signups: number;
  totalUsers: number;
  active: number;
  returning: number;
  wau: number;
  mau: number;
  avgDau: number;
  subjects: number;
  notes: number;
  toolsByType: Record<string, number>;
  notesFromFiles: number;
  notesFailed: number;
  kbBuilt: number;
  ai: { total: number; failed: number; tokens: number; credits: number };
  pay: {
    revenue: number;
    paid: number;
    payers: number;
    failed: number;
    refunded: number;
    refundedAmount: number;
  };
  firstTimePayers: number;
  subStarted: number;
  subEnded: number;
  subsAtStart: number;
}

/** Everything that is a single number for [lo, hi), in one round trip. */
async function windowMetrics(lo: Date, hi: Date, tz: string): Promise<WindowMetrics> {
  const evLo = new Date(Math.min(lo.getTime(), hi.getTime() - 30 * DAY_MS));
  const l = ts(lo);
  const h = ts(hi);
  const days = Math.max(1, Math.ceil((hi.getTime() - lo.getTime()) / DAY_MS));

  const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
    WITH ${eventsCte(evLo, hi)},
    daily AS (
      SELECT date_trunc('day', ${loc("ts", tz)}) AS d, count(DISTINCT user_id) AS n
      FROM act WHERE ts >= ${l} AND ts < ${h} GROUP BY 1
    )
    SELECT
      (SELECT count(*)::int FROM users WHERE created_at >= ${l} AND created_at < ${h}) AS signups,
      (SELECT count(*)::int FROM users WHERE created_at < ${h}) AS total_users,
      (SELECT count(DISTINCT user_id)::int FROM act WHERE ts >= ${l} AND ts < ${h}) AS active,
      (SELECT count(DISTINCT a.user_id)::int FROM act a JOIN users u ON u.id = a.user_id
         WHERE a.ts >= ${l} AND a.ts < ${h} AND u.created_at < ${l}) AS returning,
      (SELECT count(DISTINCT user_id)::int FROM act WHERE ts >= ${h} - interval '7 days' AND ts < ${h}) AS wau,
      (SELECT count(DISTINCT user_id)::int FROM act WHERE ts >= ${h} - interval '30 days' AND ts < ${h}) AS mau,
      (SELECT coalesce(sum(n), 0)::float8 FROM daily) / ${days}::float8 AS avg_dau,
      (SELECT count(*)::int FROM act WHERE kind = 'subject' AND ts >= ${l} AND ts < ${h}) AS subjects,
      (SELECT count(*)::int FROM act WHERE kind = 'note' AND ts >= ${l} AND ts < ${h}) AS notes,
      (SELECT coalesce(jsonb_object_agg(type, n), '{}'::jsonb) FROM (
         SELECT type::text AS type, count(*)::int AS n FROM learning_tools
         WHERE created_at >= ${l} AND created_at < ${h} GROUP BY 1) t) AS tools_by_type,
      (SELECT count(*)::int FROM notes WHERE created_at >= ${l} AND created_at < ${h}
         AND file_name IS NOT NULL) AS notes_from_files,
      (SELECT count(*)::int FROM notes WHERE created_at >= ${l} AND created_at < ${h}
         AND processing_status = 'FAILED') AS notes_failed,
      (SELECT count(*)::int FROM knowledge_bases WHERE processed_at >= ${l} AND processed_at < ${h}) AS kb_built,
      (SELECT jsonb_build_object(
         'total', count(*),
         'failed', count(*) FILTER (WHERE NOT success),
         'tokens', coalesce(sum(coalesce(tokens_used, input_tokens + output_tokens)), 0),
         'credits', coalesce(sum(credit_cost), 0))
       FROM ai_operation_logs WHERE created_at >= ${l} AND created_at < ${h}) AS ai,
      (SELECT jsonb_build_object(
         'revenue', coalesce(sum(amount) FILTER (WHERE status = 'PAID'), 0),
         'paid', count(*) FILTER (WHERE status = 'PAID'),
         'payers', count(DISTINCT user_id) FILTER (WHERE status = 'PAID'),
         'failed', count(*) FILTER (WHERE status = 'FAILED'),
         'refunded', count(*) FILTER (WHERE status = 'REFUNDED'),
         'refundedAmount', coalesce(sum(amount) FILTER (WHERE status = 'REFUNDED'), 0))
       FROM payment_transactions WHERE occurred_at >= ${l} AND occurred_at < ${h}) AS pay,
      (SELECT count(*)::int FROM (
         SELECT user_id, min(occurred_at) AS first_at FROM payment_transactions
         WHERE status IN ('PAID', 'REFUNDED') AND user_id IS NOT NULL GROUP BY 1) f
       WHERE first_at >= ${l} AND first_at < ${h}) AS first_time_payers,
      (SELECT count(*)::int FROM users
         WHERE subscription_start_date >= ${l} AND subscription_start_date < ${h}) AS sub_started,
      (SELECT count(*)::int FROM users
         WHERE subscription_end_date >= ${l} AND subscription_end_date < ${h}) AS sub_ended,
      (SELECT count(*)::int FROM users
         WHERE subscription_start_date < ${l} AND subscription_end_date >= ${l}) AS subs_at_start
  `);

  const r = rows[0] ?? {};
  const n = (k: string) => Number(r[k] ?? 0);
  const json = <T,>(k: string, fallback: T): T => (r[k] as T) ?? fallback;
  const pay = json<Record<string, number>>("pay", {});
  const ai = json<Record<string, number>>("ai", {});
  return {
    signups: n("signups"),
    totalUsers: n("total_users"),
    active: n("active"),
    returning: n("returning"),
    wau: n("wau"),
    mau: n("mau"),
    avgDau: n("avg_dau"),
    subjects: n("subjects"),
    notes: n("notes"),
    toolsByType: json<Record<string, number>>("tools_by_type", {}),
    notesFromFiles: n("notes_from_files"),
    notesFailed: n("notes_failed"),
    kbBuilt: n("kb_built"),
    ai: {
      total: Number(ai.total ?? 0),
      failed: Number(ai.failed ?? 0),
      tokens: Number(ai.tokens ?? 0),
      credits: Number(ai.credits ?? 0),
    },
    pay: {
      revenue: Number(pay.revenue ?? 0),
      paid: Number(pay.paid ?? 0),
      payers: Number(pay.payers ?? 0),
      failed: Number(pay.failed ?? 0),
      refunded: Number(pay.refunded ?? 0),
      refundedAmount: Number(pay.refundedAmount ?? 0),
    },
    firstTimePayers: n("first_time_payers"),
    subStarted: n("sub_started"),
    subEnded: n("sub_ended"),
    subsAtStart: n("subs_at_start"),
  };
}

const toolTotal = (m: WindowMetrics) =>
  Object.values(m.toolsByType).reduce((a, b) => a + b, 0);

// ------------------------------------------------------------------- series

async function loadSeries(range: ResolvedRange): Promise<SeriesPoint[]> {
  const { from, to, tz } = range;
  const g = Prisma.raw(range.granularity); // whitelisted by resolveRange
  const l = ts(from);
  const h = ts(to);

  const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
    WITH ${eventsCte(from, to)},
    b AS (
      SELECT gs AS bucket FROM generate_series(
        date_trunc('${g}', ${from.toISOString()}::timestamptz AT TIME ZONE ${tz}),
        date_trunc('${g}', (${to.toISOString()}::timestamptz - interval '1 second') AT TIME ZONE ${tz}),
        interval '1 ${g}') gs
    ),
    new_users AS (
      SELECT date_trunc('${g}', ${loc("created_at", tz)}) AS bucket, count(*) AS n
      FROM users WHERE created_at >= ${l} AND created_at < ${h} GROUP BY 1
    ),
    active AS (
      SELECT date_trunc('${g}', ${loc("ts", tz)}) AS bucket,
             count(DISTINCT user_id) AS n,
             count(*) FILTER (WHERE kind = 'subject') AS subjects,
             count(*) FILTER (WHERE kind = 'note') AS notes,
             count(*) FILTER (WHERE kind = 'tool') AS tools
      FROM act GROUP BY 1
    ),
    pay AS (
      SELECT date_trunc('${g}', ${loc("occurred_at", tz)}) AS bucket,
             coalesce(sum(amount) FILTER (WHERE status = 'PAID'), 0) AS amount,
             count(*) FILTER (WHERE status = 'PAID') AS paid,
             count(*) FILTER (WHERE status = 'FAILED') AS failed
      FROM payment_transactions WHERE occurred_at >= ${l} AND occurred_at < ${h} GROUP BY 1
    )
    SELECT to_char(b.bucket, 'YYYY-MM-DD"T"HH24:MI:SS') AS t,
           coalesce(nu.n, 0)::int AS signups,
           coalesce(a.n, 0)::int AS active,
           coalesce(a.subjects, 0)::int AS subjects,
           coalesce(a.notes, 0)::int AS notes,
           coalesce(a.tools, 0)::int AS tools,
           coalesce(p.amount, 0)::float8 AS revenue,
           coalesce(p.paid, 0)::int AS payments,
           coalesce(p.failed, 0)::int AS failed_payments
    FROM b
    LEFT JOIN new_users nu ON nu.bucket = b.bucket
    LEFT JOIN active a ON a.bucket = b.bucket
    LEFT JOIN pay p ON p.bucket = b.bucket
    ORDER BY b.bucket
  `);

  return rows.map((r) => ({
    t: String(r.t),
    signups: Number(r.signups),
    active: Number(r.active),
    subjects: Number(r.subjects),
    notes: Number(r.notes),
    tools: Number(r.tools),
    revenue: pesos(Number(r.revenue)),
    payments: Number(r.payments),
    failedPayments: Number(r.failed_payments),
  }));
}

// ------------------------------------------------------------------- funnel

async function loadFunnel(range: ResolvedRange): Promise<FunnelStep[]> {
  const { from, to } = range;
  const evHi = new Date(Date.now() + DAY_MS);
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
    WITH ${eventsCte(from, evHi)},
    cu AS (
      SELECT id, created_at, plan_type, subscription_status FROM users
      WHERE created_at >= ${ts(from)} AND created_at < ${ts(to)}
    )
    SELECT
      count(*)::int AS signed_up,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM act a WHERE a.user_id = cu.id AND a.kind IN ('subject', 'note', 'tool')
      ))::int AS activated,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM act a WHERE a.user_id = cu.id AND a.ts >= cu.created_at + interval '1 day'
      ))::int AS returned,
      count(*) FILTER (WHERE plan_type <> 'FREE' AND subscription_status = 'active')::int AS on_paid_plan,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM payment_transactions p
        WHERE p.user_id = cu.id AND p.status IN ('PAID', 'REFUNDED')
      ))::int AS paid_recorded
    FROM cu
  `);
  const r = rows[0] ?? {};
  const first = Number(r.signed_up ?? 0);
  const step = (key: string, label: string, v: unknown, hint: string): FunnelStep => ({
    key,
    label,
    count: Number(v ?? 0),
    ofFirst: ratio(Number(v ?? 0), first),
    hint,
  });
  return [
    step("signed_up", "Signed up", r.signed_up, "Accounts created in the period"),
    step(
      "activated",
      "Activated",
      r.activated,
      "Created at least one subject, note or study tool",
    ),
    step(
      "returned",
      "Came back",
      r.returned,
      "Active again at least 24 hours after signing up",
    ),
    step(
      "on_paid_plan",
      "On a paid plan",
      r.on_paid_plan,
      "Currently on an active paid plan (includes promo and complimentary plans)",
    ),
    step(
      "paid_recorded",
      "Paid",
      r.paid_recorded,
      "Has a payment recorded in the payment ledger",
    ),
  ];
}

// ------------------------------------------------------------------- cohorts

async function loadCohorts(
  granularity: "week" | "month",
  tz: string,
): Promise<CohortRow[]> {
  const today = localToday(tz);
  const periods = granularity === "week" ? 8 : 6;
  const currentStart = granularity === "week" ? startOfWeek(today) : startOfMonth(today);
  const firstStart =
    granularity === "week"
      ? addDays(currentStart, -7 * (periods - 1))
      : addMonths(currentStart, -(periods - 1));
  const lo = zonedStart(firstStart, tz);
  const hi = new Date(Date.now() + DAY_MS);
  const g = Prisma.raw(granularity);
  const k =
    granularity === "week"
      ? Prisma.sql`((pa.p::date - cs.c::date) / 7)`
      : Prisma.sql`((extract(year from pa.p) - extract(year from cs.c)) * 12
                    + extract(month from pa.p) - extract(month from cs.c))::int`;

  const rows = await prisma.$queryRaw<{ cohort: string; k: number; n: number }[]>(Prisma.sql`
    WITH ${eventsCte(lo, hi)},
    cs AS (
      SELECT id, date_trunc('${g}', ${loc("created_at", tz)}) AS c
      FROM users WHERE created_at >= ${ts(lo)}
    ),
    pa AS (
      SELECT DISTINCT a.user_id, date_trunc('${g}', ${loc("a.ts", tz)}) AS p
      FROM act a WHERE a.user_id IN (SELECT id FROM cs)
    )
    SELECT to_char(cs.c, 'YYYY-MM-DD') AS cohort, -1 AS k, count(*)::int AS n
      FROM cs GROUP BY 1
    UNION ALL
    SELECT to_char(cs.c, 'YYYY-MM-DD'), ${k}, count(*)::int
      FROM cs JOIN pa ON pa.user_id = cs.id AND pa.p >= cs.c GROUP BY 1, 2
  `);

  const cohorts: CohortRow[] = [];
  for (let i = 0; i < periods; i++) {
    const start = granularity === "week" ? addDays(firstStart, 7 * i) : addMonths(firstStart, i);
    const key = formatYmd(start);
    const elapsed = periods - 1 - i; // periods after this cohort that exist so far
    const size = Number(rows.find((r) => r.cohort === key && Number(r.k) === -1)?.n ?? 0);
    const retained: (number | null)[] = [];
    for (let p = 0; p <= elapsed; p++) {
      retained.push(Number(rows.find((r) => r.cohort === key && Number(r.k) === p)?.n ?? 0));
    }
    cohorts.push({ cohort: key, size, retained });
  }
  return cohorts;
}

// ------------------------------------------------------- range-level extras

async function loadTopUsers(range: ResolvedRange) {
  const { from, to, tz } = range;
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
    WITH ${eventsCte(from, to)},
    per_user AS (
      SELECT user_id,
             count(*) FILTER (WHERE kind IN ('subject', 'note', 'tool'))::int AS actions,
             count(DISTINCT date_trunc('day', ${loc("ts", tz)}))::int AS active_days,
             max(ts) AS last_ts
      FROM act GROUP BY 1
    )
    SELECT u.id, u.email, u.plan_type::text AS plan_type, p.actions, p.active_days,
           ${isoSql("p.last_ts")} AS last_at,
           avg(p.actions) OVER ()::float8 AS avg_actions,
           avg(p.active_days) OVER ()::float8 AS avg_days
    FROM per_user p JOIN users u ON u.id = p.user_id
    ORDER BY p.actions DESC, p.active_days DESC, u.email
    LIMIT 10
  `);
  const top: TopUser[] = rows.map((r) => ({
    id: String(r.id),
    email: String(r.email),
    planType: String(r.plan_type),
    actions: Number(r.actions),
    activeDays: Number(r.active_days),
    lastActiveAt: r.last_at ? String(r.last_at) : null,
  }));
  const engagement = rows[0]
    ? { avgActions: Number(rows[0].avg_actions), avgActiveDays: Number(rows[0].avg_days) }
    : null;
  return { top, engagement };
}

async function loadProduct(range: ResolvedRange) {
  const { from, to } = range;
  const l = ts(from);
  const h = ts(to);
  const [byModel, failures] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT model, count(*)::int AS ops, count(*) FILTER (WHERE NOT success)::int AS failed,
             coalesce(sum(coalesce(tokens_used, input_tokens + output_tokens)), 0)::float8 AS tokens,
             coalesce(sum(credit_cost), 0)::float8 AS credits,
             avg(duration_ms)::float8 AS avg_ms
      FROM ai_operation_logs WHERE created_at >= ${l} AND created_at < ${h}
      GROUP BY model ORDER BY ops DESC LIMIT 10
    `),
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT n.id, left(coalesce(n.processing_error, 'No error message recorded'), 160) AS error,
             u.email, ${isoSql("n.created_at")} AS at
      FROM notes n JOIN subjects s ON s.id = n.subject_id JOIN users u ON u.id = s.user_id
      WHERE n.processing_status = 'FAILED' AND n.created_at >= ${l} AND n.created_at < ${h}
      ORDER BY n.created_at DESC LIMIT 8
    `),
  ]);
  return {
    byModel: byModel.map((r) => ({
      model: String(r.model),
      ops: Number(r.ops),
      failed: Number(r.failed),
      tokens: Number(r.tokens),
      credits: Number(r.credits),
      avgMs: r.avg_ms === null ? null : Math.round(Number(r.avg_ms)),
    })),
    failures: failures.map((r) => ({
      id: String(r.id),
      error: String(r.error),
      email: String(r.email),
      at: String(r.at),
    })),
  };
}

async function loadRevenueDetail(range: ResolvedRange) {
  const l = ts(range.from);
  const h = ts(range.to);
  const [byPlan, recent] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT coalesce(plan_type::text, 'UNKNOWN') AS plan,
             coalesce(sum(amount) FILTER (WHERE status = 'PAID'), 0)::float8 AS revenue,
             count(*) FILTER (WHERE status = 'PAID')::int AS payments
      FROM payment_transactions WHERE occurred_at >= ${l} AND occurred_at < ${h}
      GROUP BY 1 HAVING count(*) FILTER (WHERE status = 'PAID') > 0
      ORDER BY revenue DESC
    `),
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT external_id AS id, email, status::text AS status, amount, currency,
             plan_type::text AS plan_type, billing_period, promo_code, failure_reason,
             ${isoSql("occurred_at")} AS occurred_at
      FROM payment_transactions WHERE occurred_at >= ${l} AND occurred_at < ${h}
      ORDER BY occurred_at DESC LIMIT 10
    `),
  ]);
  return {
    byPlan: byPlan.map((r) => ({
      plan: String(r.plan),
      revenue: pesos(Number(r.revenue)),
      payments: Number(r.payments),
    })),
    recent: recent.map(
      (r): PaymentRow => ({
        id: String(r.id),
        email: r.email ? String(r.email) : null,
        status: r.status as PaymentRow["status"],
        amount: pesos(Number(r.amount)),
        currency: String(r.currency),
        planType: r.plan_type ? String(r.plan_type) : null,
        billingPeriod: r.billing_period ? String(r.billing_period) : null,
        promoCode: r.promo_code ? String(r.promo_code) : null,
        failureReason: r.failure_reason ? String(r.failure_reason) : null,
        occurredAt: String(r.occurred_at),
      }),
    ),
  };
}

/** Account-level facts from Supabase Auth. Null when the auth schema can't be read. */
async function loadAccounts(range: ResolvedRange) {
  try {
    const [totals, providers] = await Promise.all([
      prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
        SELECT count(*)::int AS total,
               count(*) FILTER (WHERE a.email_confirmed_at IS NULL)::int AS unverified,
               count(*) FILTER (WHERE NOT EXISTS (
                 SELECT 1 FROM users u WHERE u.id = a.id::text))::int AS without_profile
        FROM auth.users a
      `),
      prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
        SELECT coalesce(a.raw_app_meta_data->>'provider', 'unknown') AS provider, count(*)::int AS n
        FROM auth.users a
        WHERE a.created_at >= ${ts(range.from)} AND a.created_at < ${ts(range.to)}
        GROUP BY 1 ORDER BY n DESC
      `),
    ]);
    const t = totals[0] ?? {};
    return {
      accounts: {
        total: Number(t.total ?? 0),
        unverified: Number(t.unverified ?? 0),
        withoutProfile: Number(t.without_profile ?? 0),
      },
      sources: providers.map((p) => ({ provider: String(p.provider), count: Number(p.n) })),
    };
  } catch (error) {
    console.error("Analytics: could not read auth.users:", error);
    return { accounts: null, sources: null };
  }
}

// ----------------------------------------------------------------- snapshot

interface Snapshot {
  free: number;
  totalUsers: number;
  subscribers: AnalyticsResponse["revenue"]["subscribers"];
  mrr: number | null;
  arr: number | null;
  recentlyActive: RecentUser[];
  trackingSince: string | null;
  ledger: { customers: number; total: number; startedAt: string | null };
  newFeedback: number;
}

/** Point-in-time facts that don't depend on the selected range. */
async function loadSnapshot(): Promise<Snapshot> {
  const [subs, counts, recent, tracking, ledger, newFeedback] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT u.plan_type::text AS plan_type, u.subscription_status, u.subscription_period,
             ${isoSql("u.subscription_end_date")} AS end_at, u.applied_promo_code,
             lp.amount, lp.billing_period, ${isoSql("lp.occurred_at")} AS paid_at
      FROM users u
      LEFT JOIN LATERAL (
        SELECT amount, billing_period, occurred_at FROM payment_transactions p
        WHERE p.user_id = u.id AND p.status = 'PAID'
        ORDER BY occurred_at DESC LIMIT 1
      ) lp ON true
      WHERE u.plan_type <> 'FREE'
    `),
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT count(*)::int AS total, count(*) FILTER (WHERE plan_type = 'FREE')::int AS free FROM users
    `),
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      WITH seen AS (
        SELECT user_id, max(ts) AS last_at FROM (
          SELECT user_id, hour_start AS ts FROM user_activity
          UNION ALL SELECT user_id, created_at FROM subjects
          UNION ALL SELECT s.user_id, n.created_at FROM notes n JOIN subjects s ON s.id = n.subject_id
          UNION ALL SELECT s.user_id, lt.created_at FROM learning_tools lt
            LEFT JOIN notes ln ON ln.id = lt.note_id
            JOIN subjects s ON s.id = COALESCE(lt.subject_id, ln.subject_id)
        ) e GROUP BY 1
      )
      SELECT u.id, u.email, u.plan_type::text AS plan_type,
             ${isoSql("GREATEST(u.last_activity_date, seen.last_at)")} AS last_at
      FROM users u JOIN seen ON seen.user_id = u.id
      ORDER BY GREATEST(u.last_activity_date, seen.last_at) DESC LIMIT 8
    `),
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT to_char(min(hour_start), 'YYYY-MM-DD') AS since FROM user_activity
    `),
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT count(DISTINCT user_id) FILTER (WHERE status IN ('PAID', 'REFUNDED'))::int AS customers,
             coalesce(sum(amount) FILTER (WHERE status = 'PAID'), 0)::float8 AS total,
             ${isoSql("min(occurred_at)")} AS started
      FROM payment_transactions
    `),
    prisma.feedback.count({ where: { status: "NEW" } }).catch(() => 0),
  ]);

  const now = Date.now();
  const planCounts = new Map<string, number>();
  let paying = 0;
  let promo = 0;
  let complimentary = 0;
  let expired = 0;
  let mrrCentavos = 0;

  for (const s of subs) {
    const end = s.end_at ? new Date(String(s.end_at)).getTime() : null;
    const activeStatus = s.subscription_status === "active";
    if (!activeStatus) continue; // cancelled / inactive: not a subscriber
    if (end !== null && end <= now) {
      expired++; // still on a paid plan although the term has ended
      continue;
    }
    planCounts.set(String(s.plan_type), (planCounts.get(String(s.plan_type)) ?? 0) + 1);

    // A subscriber counts as "paying" only when their latest recorded payment still covers today.
    const paidAt = s.paid_at ? new Date(String(s.paid_at)) : null;
    const yearly = s.billing_period === "yearly";
    let covered = false;
    if (paidAt && s.amount !== null) {
      const coversUntil = new Date(paidAt);
      if (yearly) coversUntil.setUTCFullYear(coversUntil.getUTCFullYear() + 1);
      else coversUntil.setUTCMonth(coversUntil.getUTCMonth() + 1);
      covered = coversUntil.getTime() > now;
    }
    if (covered) {
      paying++;
      mrrCentavos += Number(s.amount) / (yearly ? 12 : 1);
    } else if (s.applied_promo_code) {
      promo++;
    } else {
      complimentary++;
    }
  }

  const paidPlan = [...planCounts.values()].reduce((a, b) => a + b, 0);
  const total = Number(counts[0]?.total ?? 0);
  const ledgerRow = ledger[0] ?? {};
  const startedAt = ledgerRow.started ? String(ledgerRow.started) : null;
  const mrr = startedAt ? pesos(mrrCentavos) : null;

  return {
    free: Number(counts[0]?.free ?? 0),
    totalUsers: total,
    subscribers: {
      free: Number(counts[0]?.free ?? 0),
      paidPlan,
      byPlan: [...planCounts.entries()].map(([plan, count]) => ({ plan, count })),
      paying,
      promo,
      complimentary,
      expired,
    },
    mrr,
    arr: mrr === null ? null : Math.round(mrr * 12 * 100) / 100,
    recentlyActive: recent.map((r) => ({
      id: String(r.id),
      email: String(r.email),
      planType: String(r.plan_type),
      lastActiveAt: String(r.last_at),
    })),
    trackingSince: tracking[0]?.since ? String(tracking[0].since) : null,
    ledger: {
      customers: Number(ledgerRow.customers ?? 0),
      total: pesos(Number(ledgerRow.total ?? 0)),
      startedAt,
    },
    newFeedback,
  };
}

// ----------------------------------------------------------------- insights

const pct = (v: number) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`;

function buildInsights(input: {
  range: ResolvedRange;
  series: SeriesPoint[];
  cur: WindowMetrics;
  prev: WindowMetrics;
  snapshot: Snapshot;
  accounts: { total: number; unverified: number; withoutProfile: number } | null;
}): Insight[] {
  const { range, series, cur, prev, snapshot, accounts } = input;
  const out: Insight[] = [];
  const period = range.key === "today" ? "yesterday" : "the previous period";

  // Movement vs the comparison period (only when the base is big enough to mean something)
  const moves: [string, number, number][] = [
    ["Signups", cur.signups, prev.signups],
    ["Active users", cur.active, prev.active],
    ["Content created", cur.subjects + cur.notes + toolTotal(cur), prev.subjects + prev.notes + toolTotal(prev)],
  ];
  for (const [label, c, p] of moves) {
    if (Math.max(c, p) < 5 || p === 0) continue;
    const change = (c - p) / p;
    if (Math.abs(change) >= 0.5) {
      out.push({
        level: change > 0 ? "positive" : "warning",
        title: `${label} ${change > 0 ? "up" : "down"} ${pct(change)}`,
        detail: `${c} vs ${p} in ${period}.`,
      });
    }
  }

  // Unusual buckets (needs a decent number of buckets to have a baseline)
  if (series.length >= 14) {
    for (const [label, pick] of [
      ["signups", (s: SeriesPoint) => s.signups],
      ["active users", (s: SeriesPoint) => s.active],
    ] as const) {
      const vals = series.map(pick);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
      const max = Math.max(...vals);
      if (sd > 0 && max >= 3 && max > mean + 2.5 * sd) {
        const at = series[vals.indexOf(max)].t.slice(0, 10);
        out.push({
          level: "info",
          title: `Unusual spike in ${label}`,
          detail: `${max} on ${at}, against a typical ${mean.toFixed(1)}.`,
        });
      }
    }
  }

  if (snapshot.subscribers.paidPlan > 0 && snapshot.subscribers.paying < snapshot.subscribers.paidPlan) {
    const s = snapshot.subscribers;
    out.push({
      level: "warning",
      title: `${s.paidPlan - s.paying} of ${s.paidPlan} active paid plans have no payment on record`,
      detail: `${s.promo} on a promo code and ${s.complimentary} complimentary or granted before payments were recorded. They are excluded from MRR.`,
    });
  }
  if (snapshot.subscribers.expired > 0) {
    out.push({
      level: "warning",
      title: `${snapshot.subscribers.expired} expired subscription${snapshot.subscribers.expired === 1 ? "" : "s"} still on a paid plan`,
      detail: "The end date has passed but the account keeps its paid plan and limits.",
    });
  }
  if (cur.pay.failed > 0) {
    out.push({
      level: "warning",
      title: `${cur.pay.failed} failed payment${cur.pay.failed === 1 ? "" : "s"}`,
      detail: "See recent payments on the Revenue tab for the reasons.",
    });
  }
  if (cur.notes >= 5 && cur.notesFailed / cur.notes >= 0.1) {
    out.push({
      level: "warning",
      title: `${Math.round((cur.notesFailed / cur.notes) * 100)}% of new notes failed to process`,
      detail: `${cur.notesFailed} of ${cur.notes} notes ended in a failed state.`,
    });
  }
  if (accounts && accounts.withoutProfile > 0) {
    out.push({
      level: "info",
      title: `${accounts.withoutProfile} sign-up${accounts.withoutProfile === 1 ? "" : "s"} never reached the app`,
      detail: "Auth accounts exist for them, but no profile was ever created (they never completed a login).",
    });
  }
  if (accounts && accounts.unverified > 0) {
    out.push({
      level: "info",
      title: `${accounts.unverified} account${accounts.unverified === 1 ? "" : "s"} with an unverified email`,
      detail: "These sign-ups have not confirmed their email address.",
    });
  }
  return out;
}

// ------------------------------------------------------------------ assemble

const rangeCache = new TtlCache<AnalyticsResponse>(CACHE_TTL_MS, 40);
const snapshotCache = new TtlCache<Snapshot>(CACHE_TTL_MS, 2);
const cohortCache = new TtlCache<{ week: CohortRow[]; month: CohortRow[] }>(CACHE_TTL_MS * 5, 20);

/** Drop cached analytics (call after admin changes that alter the numbers). */
export function clearAnalyticsCache() {
  rangeCache.clear();
  snapshotCache.clear();
  cohortCache.clear();
}

export async function getAnalytics(
  range: ResolvedRange,
  opts: { refresh?: boolean } = {},
): Promise<AnalyticsResponse> {
  const key = [range.tz, range.key, range.fromLocal, range.toLocal].join("|");
  const { value, cached } = await rangeCache.get(
    key,
    () => computeAnalytics(range, opts),
    { bypass: opts.refresh },
  );
  return { ...value, cached };
}

async function computeAnalytics(
  range: ResolvedRange,
  opts: { refresh?: boolean },
): Promise<AnalyticsResponse> {
  const bypass = { bypass: opts.refresh };
  // Independent queries, at most 3 in flight: the DB pooler has very few slots.
  type Task = () => Promise<unknown>;
  const tasks: Task[] = [
    () => windowMetrics(range.from, range.to, range.tz),
    () => windowMetrics(range.compareFrom, range.compareTo, range.tz),
    () => loadSeries(range),
    () => loadFunnel(range),
    () => loadTopUsers(range),
    () => loadProduct(range),
    () => loadRevenueDetail(range),
    () => loadAccounts(range),
    () => snapshotCache.get("snapshot", loadSnapshot, bypass).then((r) => r.value),
    () =>
      cohortCache
        .get(
          range.tz,
          async () => {
            const [week, month] = await Promise.all([
              loadCohorts("week", range.tz),
              loadCohorts("month", range.tz),
            ]);
            return { week, month };
          },
          bypass,
        )
        .then((r) => r.value),
  ];
  const r = await mapLimit(tasks, 3, (t) => t());

  const cur = r[0] as WindowMetrics;
  const prev = r[1] as WindowMetrics;
  const series = r[2] as SeriesPoint[];
  const funnel = r[3] as FunnelStep[];
  const top = r[4] as Awaited<ReturnType<typeof loadTopUsers>>;
  const product = r[5] as Awaited<ReturnType<typeof loadProduct>>;
  const revDetail = r[6] as Awaited<ReturnType<typeof loadRevenueDetail>>;
  const acct = r[7] as Awaited<ReturnType<typeof loadAccounts>>;
  const snap = r[8] as Snapshot;
  const cohorts = r[9] as { week: CohortRow[]; month: CohortRow[] };

  const usersAtStart = cur.totalUsers - cur.signups;
  const revenueTotal = pesos(cur.pay.revenue);
  const ledgerHasData = snap.ledger.startedAt !== null;

  const ltvReady = snap.ledger.customers >= LTV_MIN_CUSTOMERS;

  const unavailable: Unavailable[] = [
    {
      metric: "Signup location and device",
      reason: "Not collected: no country, IP or device is stored when users sign up.",
    },
    {
      metric: "Sessions and session length",
      reason: "No session tracking exists. Engagement is shown as active days and content actions.",
    },
    {
      metric: "Cancellation events",
      reason: "Cancellations aren't recorded as events, so churn is derived from subscription end dates.",
    },
  ];
  if (!ledgerHasData) {
    unavailable.push({
      metric: "Revenue, MRR and ARR",
      reason:
        "No payments have been recorded yet. The payment ledger fills from PayMongo webhooks going forward; earlier payments were never stored in this database.",
    });
  }
  if (!ltvReady) {
    unavailable.push({
      metric: "Customer lifetime value",
      reason: `Needs at least ${LTV_MIN_CUSTOMERS} customers with recorded payments (currently ${snap.ledger.customers}).`,
    });
  }
  if (cur.ai.total === 0 && prev.ai.total === 0) {
    unavailable.push({
      metric: "AI usage and cost",
      reason:
        "No AI operations were recorded in this period. The AI services don't currently write to the AI operation log.",
    });
  }
  if (snap.trackingSince) {
    unavailable.push({
      metric: "Visit-based activity before " + snap.trackingSince,
      reason:
        "Visit tracking began on that date. Earlier activity is inferred from content creation only, so older active-user counts are lower bounds.",
    });
  }

  const contentCur = cur.subjects + cur.notes + toolTotal(cur);
  const contentPrev = prev.subjects + prev.notes + toolTotal(prev);

  const feature = (key: string, label: string, c: number, p: number): FeatureUsage => ({
    key,
    label,
    count: c,
    previous: p,
  });
  const tool = (m: WindowMetrics, type: string) => m.toolsByType[type] ?? 0;
  const features = [
    feature("notes", "Notes created", cur.notes, prev.notes),
    feature("subjects", "Subjects created", cur.subjects, prev.subjects),
    feature("quiz", "Quizzes generated", tool(cur, "QUIZ"), tool(prev, "QUIZ")),
    feature("flashcards", "Flashcard sets generated", tool(cur, "FLASHCARDS"), tool(prev, "FLASHCARDS")),
    feature("summary", "Summaries generated", tool(cur, "SUMMARY"), tool(prev, "SUMMARY")),
    feature("organized", "Organized notes generated", tool(cur, "ORGANIZED_NOTE"), tool(prev, "ORGANIZED_NOTE")),
    feature("uploads", "Notes from uploaded files", cur.notesFromFiles, prev.notesFromFiles),
    feature("kb", "Knowledge bases built", cur.kbBuilt, prev.kbBuilt),
  ].sort((a, b) => b.count - a.count);

  const churnBase = cur.subsAtStart;
  const arpuBase = cur.totalUsers;

  return {
    generatedAt: new Date().toISOString(),
    cached: false,
    range: {
      key: range.key,
      tz: range.tz,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      fromLocal: range.fromLocal,
      toLocal: range.toLocal,
      granularity: range.granularity,
      compareFrom: range.compareFrom.toISOString(),
      compareTo: range.compareTo.toISOString(),
      partial: range.partial,
      days: range.days,
    },
    newFeedback: snap.newFeedback,
    unavailable,
    insights: buildInsights({ range, series, cur, prev, snapshot: snap, accounts: acct.accounts }),
    series,
    users: {
      total: delta(cur.totalUsers, prev.totalUsers),
      signups: delta(cur.signups, prev.signups),
      active: delta(cur.active, prev.active),
      returning: delta(cur.returning, prev.returning),
      avgDau: delta(Math.round(cur.avgDau * 100) / 100, Math.round(prev.avgDau * 100) / 100),
      wau: cur.wau,
      mau: cur.mau,
      stickiness: ratio(cur.avgDau, cur.mau),
      growthRate: ratio(cur.signups, usersAtStart),
      engagement: top.engagement,
      topUsers: top.top,
      recentlyActive: snap.recentlyActive,
      sources: acct.sources,
      accounts: acct.accounts,
      trackingSince: snap.trackingSince,
      cohorts,
    },
    revenue: {
      total: delta(revenueTotal, pesos(prev.pay.revenue)),
      payments: delta(cur.pay.paid, prev.pay.paid),
      payers: delta(cur.pay.payers, prev.pay.payers),
      firstTimePayers: delta(cur.firstTimePayers, prev.firstTimePayers),
      failed: delta(cur.pay.failed, prev.pay.failed),
      refunded: delta(cur.pay.refunded, prev.pay.refunded),
      refundedAmount: delta(pesos(cur.pay.refundedAmount), pesos(prev.pay.refundedAmount)),
      arpu: ledgerHasData ? ratio(revenueTotal, arpuBase) : null,
      arppu: ledgerHasData ? ratio(revenueTotal, cur.pay.payers) : null,
      byPlan: revDetail.byPlan,
      recent: revDetail.recent,
      ledgerStartedAt: snap.ledger.startedAt,
      mrr: snap.mrr,
      arr: snap.arr,
      subscribers: snap.subscribers,
      conversionRate: ratio(snap.subscribers.paidPlan, snap.totalUsers),
      subscriptionsStarted: delta(cur.subStarted, prev.subStarted),
      subscriptionsEnded: delta(cur.subEnded, prev.subEnded),
      churnRate: ratio(cur.subEnded, churnBase),
      ltv: {
        value: ltvReady ? Math.round((snap.ledger.total / snap.ledger.customers) * 100) / 100 : null,
        customers: snap.ledger.customers,
        required: LTV_MIN_CUSTOMERS,
      },
    },
    product: {
      features,
      contentActions: delta(contentCur, contentPrev),
      notesFailed: delta(cur.notesFailed, prev.notesFailed),
      processingFailureRate: ratio(cur.notesFailed, cur.notes),
      ai: {
        total: delta(cur.ai.total, prev.ai.total),
        failed: delta(cur.ai.failed, prev.ai.failed),
        tokens: delta(cur.ai.tokens, prev.ai.tokens),
        credits: delta(cur.ai.credits, prev.ai.credits),
        byModel: product.byModel,
      },
      failures: product.failures,
    },
    funnel,
  };
}
