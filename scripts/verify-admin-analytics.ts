/**
 * Cross-checks the admin analytics service against the raw tables.
 *
 * Every figure is recomputed here with plain row-level queries and JS
 * arithmetic (no shared SQL with the service), then compared with what the
 * service returns. Run with:
 *
 *   npx tsx scripts/verify-admin-analytics.ts [range] [tz]
 *
 * e.g. `npx tsx scripts/verify-admin-analytics.ts 90d Asia/Manila`
 *      `npx tsx scripts/verify-admin-analytics.ts custom America/New_York 2026-03-01 2026-04-30`
 */
import "dotenv/config";
import pg from "pg";
import { resolveRange } from "@/lib/admin-range";
import { getAnalytics } from "@/service/analytics.service";

const rangeKey = process.argv[2] ?? "90d";
const tz = process.argv[3] ?? "Asia/Manila";
const [customFrom, customTo] = [process.argv[4], process.argv[5]];

const connectionString = (process.env.DATABASE_URL ?? "")
  .replace(/[?&]pgbouncer=true/, "")
  .replace(/[?&]connection_limit=1/, "");

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: service=${JSON.stringify(actual)} raw=${JSON.stringify(expected)}`);
}

const localDay = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

async function main() {
  const range = resolveRange({ range: rangeKey, tz, from: customFrom, to: customTo });
  const data = await getAnalytics(range, { refresh: true });
  console.log(
    `Range ${range.key} ${range.fromLocal}..${range.toLocal} (${tz}), granularity=${range.granularity}, ` +
      `from=${range.from.toISOString()} to=${range.to.toISOString()}`,
  );

  const db = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await db.connect();
  const rows = async <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
    (await db.query(sql, params)).rows as T[];
  // node-pg reads UTC-naive timestamps as local time; rebuild them as UTC instants.
  const asDate = (v: unknown) => {
    const d = v as Date;
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()));
  };
  const inRange = (d: Date | null, lo = range.from, hi = range.to) =>
    !!d && d.getTime() >= lo.getTime() && d.getTime() < hi.getTime();

  const users = await rows<{ id: string; created_at: Date; plan_type: string; subscription_status: string | null; subscription_end_date: Date | null; subscription_start_date: Date | null; applied_promo_code: string | null }>(
    `select id, created_at, plan_type::text, subscription_status, subscription_end_date, subscription_start_date, applied_promo_code from users`,
  );
  const userIds = new Set(users.map((u) => u.id));
  const subjects = await rows<{ id: string; user_id: string; created_at: Date }>(`select id, user_id, created_at from subjects`);
  const notes = await rows<{ subject_id: string; created_at: Date; processing_status: string; file_name: string | null }>(
    `select subject_id, created_at, processing_status::text, file_name from notes`,
  );
  const tools = await rows<{ subject_id: string | null; note_id: string | null; created_at: Date; type: string }>(
    `select subject_id, note_id, created_at, type::text from learning_tools`,
  );
  const noteRows = await rows<{ id: string; subject_id: string }>(`select id, subject_id from notes`);
  const visits = await rows<{ user_id: string; hour_start: Date }>(`select user_id, hour_start from user_activity`);
  const ai = await rows<{ user_id: string; created_at: Date }>(`select user_id, created_at from ai_operation_logs`);
  const pays = await rows<{ user_id: string | null; status: string; amount: number; occurred_at: Date }>(
    `select user_id, status::text, amount, occurred_at from payment_transactions`,
  );

  const subjectOwner = new Map(subjects.map((s) => [s.id, s.user_id]));
  const noteSubject = new Map(noteRows.map((n) => [n.id, n.subject_id]));

  type Ev = { user: string; at: Date; kind: string };
  const events: Ev[] = [];
  for (const s of subjects) events.push({ user: s.user_id, at: asDate(s.created_at), kind: "subject" });
  for (const n of notes) {
    const u = subjectOwner.get(n.subject_id);
    if (u) events.push({ user: u, at: asDate(n.created_at), kind: "note" });
  }
  for (const t of tools) {
    const sid = t.subject_id ?? (t.note_id ? noteSubject.get(t.note_id) : undefined);
    const u = sid ? subjectOwner.get(sid) : undefined;
    if (u) events.push({ user: u, at: asDate(t.created_at), kind: "tool" });
  }
  for (const a of ai) events.push({ user: a.user_id, at: asDate(a.created_at), kind: "ai" });
  for (const v of visits) events.push({ user: v.user_id, at: asDate(v.hour_start), kind: "visit" });
  const live = events.filter((e) => userIds.has(e.user));

  const inWin = (lo: Date, hi: Date) => live.filter((e) => e.at >= lo && e.at < hi);
  const distinct = (evs: Ev[]) => new Set(evs.map((e) => e.user)).size;

  // Users
  const created = (u: { created_at: Date }) => asDate(u.created_at);
  check("users.total", data.users.total.current, users.filter((u) => created(u) < range.to).length);
  check("users.signups", data.users.signups.current, users.filter((u) => inRange(created(u))).length);
  check("users.signups (previous)", data.users.signups.previous, users.filter((u) => inRange(created(u), range.compareFrom, range.compareTo)).length);
  const cur = inWin(range.from, range.to);
  check("users.active", data.users.active.current, distinct(cur));
  check("users.active (previous)", data.users.active.previous, distinct(inWin(range.compareFrom, range.compareTo)));
  const byId = new Map(users.map((u) => [u.id, u]));
  check("users.returning", data.users.returning.current, new Set(cur.filter((e) => created(byId.get(e.user)!) < range.from).map((e) => e.user)).size);
  check("users.wau", data.users.wau, distinct(inWin(new Date(range.to.getTime() - 7 * 86400000), range.to)));
  check("users.mau", data.users.mau, distinct(inWin(new Date(range.to.getTime() - 30 * 86400000), range.to)));

  // DAU: distinct users per local day, averaged over the days spanned
  const perDay = new Map<string, Set<string>>();
  for (const e of cur) {
    const d = localDay(e.at);
    if (!perDay.has(d)) perDay.set(d, new Set());
    perDay.get(d)!.add(e.user);
  }
  const days = Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / 86400000));
  const avgDau = [...perDay.values()].reduce((a, s) => a + s.size, 0) / days;
  check("users.avgDau", data.users.avgDau.current, Math.round(avgDau * 100) / 100);

  // Series sums must equal the KPI totals (no double counting across buckets)
  check("series signups sum", data.series.reduce((a, p) => a + p.signups, 0), data.users.signups.current);
  check("series subjects sum", data.series.reduce((a, p) => a + p.subjects, 0), cur.filter((e) => e.kind === "subject").length);
  check("series notes sum", data.series.reduce((a, p) => a + p.notes, 0), cur.filter((e) => e.kind === "note").length);
  check("series tools sum", data.series.reduce((a, p) => a + p.tools, 0), cur.filter((e) => e.kind === "tool").length);
  const series0 = data.series.map((p) => p.t.slice(0, 10));
  check("series has no duplicate buckets", new Set(data.series.map((p) => p.t)).size, data.series.length);
  if (range.granularity === "day") {
    // every daily active count must match the raw per-day distinct count
    let mismatched = 0;
    for (const p of data.series) {
      if ((perDay.get(p.t.slice(0, 10))?.size ?? 0) !== p.active) mismatched++;
    }
    check("series daily active (mismatched days)", mismatched, 0);
  }
  void series0;

  // Product
  check("product.notes", data.product.features.find((f) => f.key === "notes")?.count, cur.filter((e) => e.kind === "note").length);
  for (const [key, type] of [["quiz", "QUIZ"], ["flashcards", "FLASHCARDS"], ["summary", "SUMMARY"], ["organized", "ORGANIZED_NOTE"]] as const) {
    check(`product.${key}`, data.product.features.find((f) => f.key === key)?.count, tools.filter((t) => t.type === type && inRange(asDate(t.created_at))).length);
  }
  check("product.notesFailed", data.product.notesFailed.current, notes.filter((n) => n.processing_status === "FAILED" && inRange(asDate(n.created_at))).length);
  check("product.uploads", data.product.features.find((f) => f.key === "uploads")?.count, notes.filter((n) => n.file_name && inRange(asDate(n.created_at))).length);

  // Revenue (ledger only)
  const paid = pays.filter((p) => p.status === "PAID" && inRange(asDate(p.occurred_at)));
  check("revenue.total", data.revenue.total.current, paid.reduce((a, p) => a + p.amount, 0) / 100);
  check("revenue.payments", data.revenue.payments.current, paid.length);
  check("revenue.failed", data.revenue.failed.current, pays.filter((p) => p.status === "FAILED" && inRange(asDate(p.occurred_at))).length);

  // Subscribers snapshot
  const now = Date.now();
  const activePaid = users.filter((u) => u.plan_type !== "FREE" && u.subscription_status === "active" && (!u.subscription_end_date || asDate(u.subscription_end_date).getTime() > now));
  check("subscribers.paidPlan", data.revenue.subscribers.paidPlan, activePaid.length);
  check("subscribers.free", data.revenue.subscribers.free, users.filter((u) => u.plan_type === "FREE").length);
  check(
    "subscribers.paying+promo+complimentary",
    data.revenue.subscribers.paying + data.revenue.subscribers.promo + data.revenue.subscribers.complimentary,
    activePaid.length,
  );

  // Funnel
  const cohort = users.filter((u) => inRange(created(u)));
  check("funnel.signed_up", data.funnel[0].count, cohort.length);
  const activated = cohort.filter((u) => live.some((e) => e.user === u.id && ["subject", "note", "tool"].includes(e.kind)));
  check("funnel.activated", data.funnel[1].count, activated.length);
  const returned = cohort.filter((u) => live.some((e) => e.user === u.id && e.at.getTime() >= created(u).getTime() + 86400000));
  check("funnel.came_back", data.funnel[2].count, returned.length);
  check("funnel.on_paid_plan", data.funnel[3].count, cohort.filter((u) => u.plan_type !== "FREE" && u.subscription_status === "active").length);

  // Auth accounts
  if (data.users.accounts) {
    const [a] = await rows<{ total: string; unverified: string; without_profile: string }>(
      `select count(*) total, count(*) filter (where email_confirmed_at is null) unverified,
              count(*) filter (where not exists (select 1 from users u where u.id = a.id::text)) without_profile from auth.users a`,
    );
    check("accounts.total", data.users.accounts.total, Number(a.total));
    check("accounts.unverified", data.users.accounts.unverified, Number(a.unverified));
    check("accounts.withoutProfile", data.users.accounts.withoutProfile, Number(a.without_profile));
  }

  // Cohorts: cohort sizes + retention recomputed by week
  const weekStart = (d: Date) => {
    const local = new Date(localDay(d) + "T00:00:00Z");
    const dow = (local.getUTCDay() + 6) % 7;
    return new Date(local.getTime() - dow * 86400000).toISOString().slice(0, 10);
  };
  let cohortMismatch = 0;
  for (const c of data.users.cohorts.week) {
    const members = users.filter((u) => weekStart(created(u)) === c.cohort);
    if (members.length !== c.size) cohortMismatch++;
    c.retained.forEach((n, k) => {
      const target = new Date(new Date(c.cohort + "T00:00:00Z").getTime() + k * 7 * 86400000).toISOString().slice(0, 10);
      const active = new Set(live.filter((e) => weekStart(e.at) === target && members.some((m) => m.id === e.user)).map((e) => e.user));
      if (active.size !== n) cohortMismatch++;
    });
  }
  check("cohorts.week mismatches", cohortMismatch, 0);

  // Monthly cohorts, recomputed the same independent way
  const monthStart = (d: Date) => localDay(d).slice(0, 7) + "-01";
  const monthIndex = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7));
  let monthMismatch = 0;
  for (const c of data.users.cohorts.month) {
    const members = new Set(users.filter((u) => monthStart(created(u)) === c.cohort).map((u) => u.id));
    if (members.size !== c.size) monthMismatch++;
    c.retained.forEach((n, k) => {
      const active = new Set(
        live.filter((e) => members.has(e.user) && monthIndex(monthStart(e.at)) === monthIndex(c.cohort) + k).map((e) => e.user),
      );
      if (active.size !== n) monthMismatch++;
    });
  }
  check("cohorts.month mismatches", monthMismatch, 0);
  console.log("monthly cohorts:", JSON.stringify(data.users.cohorts.month.map((c) => [c.cohort, c.size, c.retained])));

  console.log("\nSummary:", JSON.stringify({
    users: { total: data.users.total.current, signups: data.users.signups.current, active: data.users.active.current, wau: data.users.wau, mau: data.users.mau, avgDau: data.users.avgDau.current },
    subscribers: data.revenue.subscribers,
    funnel: data.funnel.map((f) => `${f.label}:${f.count}`),
    insights: data.insights.map((i) => i.title),
  }, null, 1));

  await db.end();
  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
