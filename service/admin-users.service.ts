/**
 * Admin user management: server-side search / filter / sort / pagination,
 * a single-user detail view, and account suspension.
 *
 * The list is one query (content counts are fetched for the visible page only,
 * in a second set-based query) so there is no N+1 regardless of page size.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { isAdminEmail } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const isoSql = (col: string) =>
  Prisma.sql`to_char(${Prisma.raw(col)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

export const USER_SORTS = [
  "createdAt",
  "email",
  "lastActive",
  "plan",
  "subscriptionEnd",
] as const;
export type UserSort = (typeof USER_SORTS)[number];

export interface UserListQuery {
  q?: string;
  plan?: "FREE" | "PRO" | "PREMIUM";
  account?: "active" | "suspended";
  activity?: "active7" | "dormant30" | "never";
  sort: UserSort;
  dir: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  planType: string;
  subscriptionStatus: string | null;
  subscriptionPeriod: string | null;
  subscriptionEndDate: string | null;
  dailyCredits: number;
  creditsUsedToday: number;
  isEarlyUser: boolean;
  earlyUserNumber: number | null;
  adminDiscountPercent: number | null;
  adminNotes: string | null;
  marketingOptIn: boolean;
  appliedPromoCode: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  suspendedAt: string | null;
  isAdmin: boolean;
  /** Paid term has ended (end date in the past). */
  planExpired: boolean;
  counts: { subjects: number; notes: number; tools: number };
}

const SORT_SQL: Record<UserSort, string> = {
  createdAt: "created_at",
  email: "lower(email)",
  lastActive: "last_active",
  plan: "plan_type",
  subscriptionEnd: "subscription_end_date",
};

export async function listUsers(query: UserListQuery) {
  const conditions: Prisma.Sql[] = [];
  if (query.q) {
    conditions.push(
      Prisma.sql`(strpos(lower(email), lower(${query.q})) > 0 OR id = ${query.q})`,
    );
  }
  if (query.plan) conditions.push(Prisma.sql`plan_type = ${query.plan}::"PlanType"`);
  if (query.account === "suspended") conditions.push(Prisma.sql`suspended_at IS NOT NULL`);
  if (query.account === "active") conditions.push(Prisma.sql`suspended_at IS NULL`);
  if (query.activity === "active7") {
    conditions.push(Prisma.sql`last_active >= (now() AT TIME ZONE 'UTC') - interval '7 days'`);
  } else if (query.activity === "dormant30") {
    conditions.push(
      Prisma.sql`last_active < (now() AT TIME ZONE 'UTC') - interval '30 days'`,
    );
  } else if (query.activity === "never") {
    conditions.push(Prisma.sql`last_active IS NULL`);
  }
  const where = conditions.length
    ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
    : Prisma.empty;
  const order = Prisma.raw(
    `${SORT_SQL[query.sort]} ${query.dir === "asc" ? "ASC" : "DESC"} NULLS LAST, id`,
  );

  const [pageRows, summaryRows] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      WITH base AS (
        SELECT u.id, u.email, u.plan_type, u.subscription_status, u.subscription_period,
               u.subscription_end_date, u.daily_credits, u.credits_used_today, u.is_early_user,
               u.early_user_number, u.admin_discount_percent, u.admin_notes, u.marketing_opt_in,
               u.applied_promo_code, u.created_at, u.suspended_at,
               GREATEST(u.last_activity_date, ua.last_seen, uc.last_content) AS last_active
        FROM users u
        LEFT JOIN LATERAL (
          SELECT max(hour_start) AS last_seen FROM user_activity WHERE user_id = u.id
        ) ua ON true
        LEFT JOIN LATERAL (
          SELECT greatest(
            (SELECT max(s.created_at) FROM subjects s WHERE s.user_id = u.id),
            (SELECT max(n.created_at) FROM notes n JOIN subjects s ON s.id = n.subject_id WHERE s.user_id = u.id),
            (SELECT max(lt.created_at) FROM learning_tools lt
               LEFT JOIN notes ln ON ln.id = lt.note_id
               JOIN subjects s ON s.id = COALESCE(lt.subject_id, ln.subject_id)
               WHERE s.user_id = u.id)
          ) AS last_content
        ) uc ON true
      )
      SELECT id, email, plan_type::text AS plan_type, subscription_status, subscription_period,
             ${isoSql("subscription_end_date")} AS subscription_end_date,
             daily_credits, credits_used_today, is_early_user, early_user_number,
             admin_discount_percent, admin_notes, marketing_opt_in, applied_promo_code,
             ${isoSql("created_at")} AS created_at,
             ${isoSql("last_active")} AS last_active,
             ${isoSql("suspended_at")} AS suspended_at,
             count(*) OVER ()::int AS total
      FROM base ${where}
      ORDER BY ${order}
      LIMIT ${query.pageSize} OFFSET ${(query.page - 1) * query.pageSize}
    `),
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE plan_type = 'FREE')::int AS free,
             count(*) FILTER (WHERE plan_type = 'PRO')::int AS pro,
             count(*) FILTER (WHERE plan_type = 'PREMIUM')::int AS premium,
             count(*) FILTER (WHERE suspended_at IS NOT NULL)::int AS suspended,
             count(*) FILTER (WHERE marketing_opt_in)::int AS marketing_opt_in
      FROM users
    `),
  ]);

  // Content counts for the visible page only (two grouped queries, not one per row).
  const ids = pageRows.map((r) => String(r.id));
  const counts = new Map<string, { subjects: number; notes: number; tools: number }>();
  if (ids.length) {
    const [subjects, notes, tools] = await Promise.all([
      prisma.$queryRaw<{ user_id: string; n: number }[]>(Prisma.sql`
        SELECT user_id, count(*)::int AS n FROM subjects WHERE user_id IN (${Prisma.join(ids)}) GROUP BY 1`),
      prisma.$queryRaw<{ user_id: string; n: number }[]>(Prisma.sql`
        SELECT s.user_id, count(*)::int AS n FROM notes n JOIN subjects s ON s.id = n.subject_id
        WHERE s.user_id IN (${Prisma.join(ids)}) GROUP BY 1`),
      prisma.$queryRaw<{ user_id: string; n: number }[]>(Prisma.sql`
        SELECT s.user_id, count(*)::int AS n FROM learning_tools lt
        LEFT JOIN notes ln ON ln.id = lt.note_id
        JOIN subjects s ON s.id = COALESCE(lt.subject_id, ln.subject_id)
        WHERE s.user_id IN (${Prisma.join(ids)}) GROUP BY 1`),
    ]);
    for (const id of ids) counts.set(id, { subjects: 0, notes: 0, tools: 0 });
    for (const r of subjects) counts.get(r.user_id)!.subjects = Number(r.n);
    for (const r of notes) counts.get(r.user_id)!.notes = Number(r.n);
    for (const r of tools) counts.get(r.user_id)!.tools = Number(r.n);
  }

  const users: AdminUserRow[] = pageRows.map((r) => ({
    id: String(r.id),
    email: String(r.email),
    planType: String(r.plan_type),
    subscriptionStatus: (r.subscription_status as string | null) ?? null,
    subscriptionPeriod: (r.subscription_period as string | null) ?? null,
    subscriptionEndDate: (r.subscription_end_date as string | null) ?? null,
    dailyCredits: Number(r.daily_credits),
    creditsUsedToday: Number(r.credits_used_today),
    isEarlyUser: Boolean(r.is_early_user),
    earlyUserNumber: r.early_user_number === null ? null : Number(r.early_user_number),
    adminDiscountPercent:
      r.admin_discount_percent === null ? null : Number(r.admin_discount_percent),
    adminNotes: (r.admin_notes as string | null) ?? null,
    marketingOptIn: Boolean(r.marketing_opt_in),
    appliedPromoCode: (r.applied_promo_code as string | null) ?? null,
    createdAt: String(r.created_at),
    lastActiveAt: (r.last_active as string | null) ?? null,
    suspendedAt: (r.suspended_at as string | null) ?? null,
    isAdmin: isAdminEmail(String(r.email)),
    planExpired:
      !!r.subscription_end_date &&
      new Date(String(r.subscription_end_date)).getTime() < Date.now(),
    counts: counts.get(String(r.id)) ?? { subjects: 0, notes: 0, tools: 0 },
  }));

  const s = summaryRows[0] ?? {};
  return {
    users,
    total: Number(pageRows[0]?.total ?? 0),
    page: query.page,
    pageSize: query.pageSize,
    summary: {
      total: Number(s.total ?? 0),
      free: Number(s.free ?? 0),
      pro: Number(s.pro ?? 0),
      premium: Number(s.premium ?? 0),
      suspended: Number(s.suspended ?? 0),
      marketingOptIn: Number(s.marketing_opt_in ?? 0),
    },
  };
}

/** Emails of users who opted in to marketing (for the export button). */
export async function listMarketingEmails(): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: { marketingOptIn: true, suspendedAt: null },
    select: { email: true },
    orderBy: { email: "asc" },
  });
  return rows.map((r) => r.email);
}

// -------------------------------------------------------------------- detail

export interface ActivityItem {
  kind: string;
  label: string;
  at: string;
}

export async function getUserDetail(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User");

  const [counts, activity, activeDays, payments, audit, auth, feedback, ai] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT
        (SELECT count(*)::int FROM subjects WHERE user_id = ${id}) AS subjects,
        (SELECT count(*)::int FROM notes n JOIN subjects s ON s.id = n.subject_id
           WHERE s.user_id = ${id}) AS notes,
        (SELECT count(*)::int FROM learning_tools lt
           LEFT JOIN notes ln ON ln.id = lt.note_id
           JOIN subjects s ON s.id = COALESCE(lt.subject_id, ln.subject_id)
           WHERE s.user_id = ${id}) AS tools,
        (SELECT count(*)::int FROM notes n JOIN subjects s ON s.id = n.subject_id
           WHERE s.user_id = ${id} AND n.processing_status = 'FAILED') AS failed_notes
    `),
    // Content titles are private study material, so the timeline only says what happened.
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT kind, label, ${isoSql("at")} AS at FROM (
        (SELECT 'content' AS kind, 'Created a subject' AS label, s.created_at AS at
           FROM subjects s WHERE s.user_id = ${id} ORDER BY s.created_at DESC LIMIT 15)
        UNION ALL
        (SELECT 'content', 'Created a note', n.created_at
           FROM notes n JOIN subjects s ON s.id = n.subject_id
           WHERE s.user_id = ${id} ORDER BY n.created_at DESC LIMIT 15)
        UNION ALL
        (SELECT 'content',
                CASE lt.type::text WHEN 'QUIZ' THEN 'Generated a quiz'
                                   WHEN 'FLASHCARDS' THEN 'Generated flashcards'
                                   WHEN 'SUMMARY' THEN 'Generated a summary'
                                   ELSE 'Generated organized notes' END,
                lt.created_at
           FROM learning_tools lt
           LEFT JOIN notes ln ON ln.id = lt.note_id
           JOIN subjects s ON s.id = COALESCE(lt.subject_id, ln.subject_id)
           WHERE s.user_id = ${id} ORDER BY lt.created_at DESC LIMIT 15)
        UNION ALL
        (SELECT 'account', 'Signed up', u.created_at FROM users u WHERE u.id = ${id})
        UNION ALL
        (SELECT 'payment', 'Payment ' || lower(p.status::text), p.occurred_at
           FROM payment_transactions p WHERE p.user_id = ${id}
           ORDER BY p.occurred_at DESC LIMIT 10)
        UNION ALL
        (SELECT 'admin', 'Admin: ' || a.action, a.created_at
           FROM admin_audit_logs a WHERE a.target_type = 'user' AND a.target_id = ${id}
           ORDER BY a.created_at DESC LIMIT 10)
      ) e ORDER BY e.at DESC LIMIT 30
    `),
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT count(DISTINCT (hour_start AT TIME ZONE 'UTC')::date)::int AS days
      FROM user_activity WHERE user_id = ${id}
        AND hour_start >= (now() AT TIME ZONE 'UTC') - interval '30 days'
    `),
    prisma.paymentTransaction.findMany({
      where: { userId: id },
      orderBy: { occurredAt: "desc" },
      take: 20,
    }),
    prisma.adminAuditLog.findMany({
      where: { targetType: "user", targetId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma
      .$queryRaw<Record<string, unknown>[]>(Prisma.sql`
        SELECT ${isoSql("last_sign_in_at")} AS last_sign_in_at,
               ${isoSql("email_confirmed_at")} AS email_confirmed_at,
               ${isoSql("created_at")} AS created_at,
               ${isoSql("banned_until")} AS banned_until,
               coalesce(raw_app_meta_data->>'provider', 'unknown') AS provider
        FROM auth.users WHERE id = ${id}::uuid
      `)
      .catch(() => []),
    prisma.feedback.count({ where: { userId: id } }).catch(() => 0),
    prisma
      .$queryRaw<Record<string, unknown>[]>(Prisma.sql`
        SELECT count(*)::int AS total, count(*) FILTER (WHERE NOT success)::int AS failed
        FROM ai_operation_logs WHERE user_id = ${id}
      `)
      .catch(() => []),
  ]);

  const c = counts[0] ?? {};
  const a = auth[0];
  return {
    profile: {
      id: user.id,
      email: user.email,
      isAdmin: isAdminEmail(user.email),
      createdAt: user.createdAt.toISOString(),
      lastActivityDate: user.lastActivityDate?.toISOString() ?? null,
      suspendedAt: user.suspendedAt?.toISOString() ?? null,
      suspendedReason: user.suspendedReason,
      marketingOptIn: user.marketingOptIn,
      acceptedTerms: user.acceptedTerms,
      termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
      adminNotes: user.adminNotes,
      adminDiscountPercent: user.adminDiscountPercent,
      isEarlyUser: user.isEarlyUser,
      earlyUserNumber: user.earlyUserNumber,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
    },
    subscription: {
      planType: user.planType,
      status: user.subscriptionStatus,
      period: user.subscriptionPeriod,
      startDate: user.subscriptionStartDate?.toISOString() ?? null,
      endDate: user.subscriptionEndDate?.toISOString() ?? null,
      expired: !!user.subscriptionEndDate && user.subscriptionEndDate.getTime() < Date.now(),
      appliedPromoCode: user.appliedPromoCode,
      promoStartDate: user.promoStartDate?.toISOString() ?? null,
      promoEndDate: user.promoEndDate?.toISOString() ?? null,
      promoMonthsFree: user.promoMonthsFree,
      dailyCredits: user.dailyCredits,
      creditsUsedToday: user.creditsUsedToday,
      notesLimit: user.notesLimit,
      subjectsLimit: user.subjectsLimit,
    },
    usage: {
      subjects: Number(c.subjects ?? 0),
      notes: Number(c.notes ?? 0),
      tools: Number(c.tools ?? 0),
      failedNotes: Number(c.failed_notes ?? 0),
      activeDaysLast30: Number(activeDays[0]?.days ?? 0),
      feedbackCount: feedback,
      aiOperations: Number(ai[0]?.total ?? 0),
      aiFailures: Number(ai[0]?.failed ?? 0),
    },
    auth: a
      ? {
          provider: String(a.provider),
          lastSignInAt: (a.last_sign_in_at as string | null) ?? null,
          emailConfirmedAt: (a.email_confirmed_at as string | null) ?? null,
          createdAt: (a.created_at as string | null) ?? null,
          bannedUntil: (a.banned_until as string | null) ?? null,
        }
      : null,
    activity: activity.map((r): ActivityItem => ({
      kind: String(r.kind),
      label: String(r.label),
      at: String(r.at),
    })),
    payments: payments.map((p) => ({
      id: p.externalId,
      status: p.status,
      amount: p.amount / 100,
      currency: p.currency,
      planType: p.planType,
      billingPeriod: p.billingPeriod,
      promoCode: p.promoCode,
      failureReason: p.failureReason,
      occurredAt: p.occurredAt.toISOString(),
    })),
    audit: audit.map((e) => ({
      id: e.id,
      action: e.action,
      actorEmail: e.actorEmail,
      metadata: e.metadata,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

// ---------------------------------------------------------------- suspension

/** Effectively permanent; reactivation lifts it. */
const BAN_DURATION = "876000h";

export async function setSuspended(opts: {
  userId: string;
  suspend: boolean;
  reason?: string;
  actorId: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { id: true, email: true, suspendedAt: true },
  });
  if (!user) throw new NotFoundError("User");
  if (opts.suspend && user.id === opts.actorId) {
    throw new ValidationError("You can't suspend your own account");
  }
  if (opts.suspend && isAdminEmail(user.email)) {
    throw new ValidationError("Admin accounts can't be suspended");
  }

  await prisma.user.update({
    where: { id: opts.userId },
    data: opts.suspend
      ? { suspendedAt: new Date(), suspendedReason: opts.reason ?? null }
      : { suspendedAt: null, suspendedReason: null },
  });

  // Also block sign-in at the auth layer. The API already refuses suspended
  // accounts, so a failure here only leaves existing sessions able to load pages.
  let authBanApplied = false;
  try {
    const { error } = await createAdminClient().auth.admin.updateUserById(opts.userId, {
      ban_duration: opts.suspend ? BAN_DURATION : "none",
    });
    authBanApplied = !error;
    if (error) console.error("Failed to update auth ban:", error.message);
  } catch (error) {
    console.error("Failed to update auth ban:", error);
  }

  return { email: user.email, authBanApplied };
}
