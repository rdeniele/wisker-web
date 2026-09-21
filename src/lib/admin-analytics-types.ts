/** Shape of `GET /api/admin/analytics`. Shared by the service and the UI. */
import type { Granularity, RangeKey } from "@/lib/admin-range";

/** A value with its comparison-period value. `change` is a fraction (0.25 = +25%). */
export interface Delta {
  current: number;
  previous: number;
  change: number | null;
}

/** Money is always PHP, in whole pesos (converted from centavos on the server). */
export interface SeriesPoint {
  /** Local bucket start, `YYYY-MM-DDTHH:mm:ss` (no offset: it is already in the viewer's timezone). */
  t: string;
  signups: number;
  active: number;
  subjects: number;
  notes: number;
  tools: number;
  revenue: number;
  payments: number;
  failedPayments: number;
}

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
  /** Share of the first step, 0-1. */
  ofFirst: number | null;
  hint: string;
}

export interface CohortRow {
  /** Local cohort start date (`YYYY-MM-DD`). */
  cohort: string;
  size: number;
  /** Users active in period k after the cohort period; `null` where k is in the future. */
  retained: (number | null)[];
}

export interface TopUser {
  id: string;
  email: string;
  planType: string;
  actions: number;
  activeDays: number;
  lastActiveAt: string | null;
}

export interface RecentUser {
  id: string;
  email: string;
  planType: string;
  lastActiveAt: string;
}

export interface FeatureUsage {
  key: string;
  label: string;
  count: number;
  previous: number;
}

export interface Insight {
  level: "info" | "warning" | "positive";
  title: string;
  detail: string;
}

export interface Unavailable {
  metric: string;
  reason: string;
}

export interface PaymentRow {
  id: string;
  email: string | null;
  status: "PAID" | "FAILED" | "REFUNDED";
  amount: number;
  currency: string;
  planType: string | null;
  billingPeriod: string | null;
  promoCode: string | null;
  failureReason: string | null;
  occurredAt: string;
}

export interface AnalyticsResponse {
  generatedAt: string;
  cached: boolean;
  range: {
    key: RangeKey;
    tz: string;
    from: string;
    to: string;
    fromLocal: string;
    toLocal: string;
    granularity: Granularity;
    compareFrom: string;
    compareTo: string;
    partial: boolean;
    days: number;
  };
  /** Feedback awaiting triage. */
  newFeedback: number;
  /** Metrics the current data cannot support, and why. */
  unavailable: Unavailable[];
  insights: Insight[];
  series: SeriesPoint[];

  users: {
    total: Delta;
    signups: Delta;
    active: Delta;
    returning: Delta;
    avgDau: Delta;
    wau: number;
    mau: number;
    /** DAU / MAU as a fraction. */
    stickiness: number | null;
    /** New signups as a fraction of users at the start of the range. */
    growthRate: number | null;
    engagement: { avgActiveDays: number; avgActions: number } | null;
    topUsers: TopUser[];
    recentlyActive: RecentUser[];
    /** Where accounts come from (auth provider). Null when unreadable. */
    sources: { provider: string; count: number }[] | null;
    accounts: {
      total: number;
      unverified: number;
      withoutProfile: number;
    } | null;
    /** Earliest date visit tracking has data for, `YYYY-MM-DD`. */
    trackingSince: string | null;
    cohorts: { week: CohortRow[]; month: CohortRow[] };
  };

  revenue: {
    /** Recorded revenue (net of refunds) in the range. */
    total: Delta;
    payments: Delta;
    payers: Delta;
    firstTimePayers: Delta;
    failed: Delta;
    refunded: Delta;
    refundedAmount: Delta;
    arpu: number | null;
    arppu: number | null;
    byPlan: { plan: string; revenue: number; payments: number }[];
    recent: PaymentRow[];
    /** Whether the ledger has recorded anything at all (ever). */
    ledgerStartedAt: string | null;
    mrr: number | null;
    arr: number | null;
    subscribers: {
      free: number;
      paidPlan: number;
      byPlan: { plan: string; count: number }[];
      /** Active paid plans split by what we can verify. */
      paying: number;
      promo: number;
      complimentary: number;
      expired: number;
    };
    /** Free -> paid: share of all users currently on an active paid plan. */
    conversionRate: number | null;
    subscriptionsStarted: Delta;
    subscriptionsEnded: Delta;
    churnRate: number | null;
    ltv: { value: number | null; customers: number; required: number };
  };

  product: {
    features: FeatureUsage[];
    contentActions: Delta;
    notesFailed: Delta;
    processingFailureRate: number | null;
    ai: {
      total: Delta;
      failed: Delta;
      tokens: Delta;
      credits: Delta;
      byModel: {
        model: string;
        ops: number;
        failed: number;
        tokens: number;
        credits: number;
        avgMs: number | null;
      }[];
    };
    failures: { id: string; error: string; email: string; at: string }[];
  };

  funnel: FunnelStep[];
}
