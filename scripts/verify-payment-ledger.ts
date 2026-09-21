/**
 * Exercises the payment ledger and the revenue analytics with synthetic
 * PayMongo payloads, then removes every row it created.
 *   npx tsx scripts/verify-payment-ledger.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { resolveRange } from "@/lib/admin-range";
import { getAnalytics } from "@/service/analytics.service";
import {
  recordFailedPayment,
  recordPaidCheckoutSession,
  recordRefund,
} from "@/service/payment-ledger.service";

const PREFIX = "pay_test_verify_";
let failures = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: got=${JSON.stringify(actual)} want=${JSON.stringify(expected)}`);
};

const now = Math.floor(Date.now() / 1000);
const session = (n: number, amount: number, plan: string, period: string) => ({
  id: `cs_test_verify_${n}`,
  type: "checkout_session",
  attributes: {
    metadata: { planName: plan, billingPeriod: period },
    payments: [
      { id: `${PREFIX}${n}`, type: "payment", attributes: { amount, currency: "PHP", paid_at: now, billing: { email: "nobody@example.invalid" } } },
    ],
  },
});

async function main() {
  const before = await prisma.paymentTransaction.count();
  try {
    await recordPaidCheckoutSession(session(1, 8000, "PRO", "monthly"));
    await recordPaidCheckoutSession(session(1, 8000, "PRO", "monthly")); // duplicate report (webhook + verify)
    await recordPaidCheckoutSession(session(2, 48000, "PRO", "yearly"));
    await recordPaidCheckoutSession(session(3, 12000, "PREMIUM", "monthly"));
    await recordFailedPayment({ id: `${PREFIX}4`, attributes: { amount: 8000, currency: "PHP", failed_message: "Card declined", created_at: now, billing: { email: "nobody@example.invalid" } } });
    await recordRefund(`${PREFIX}3`);

    const rows = await prisma.paymentTransaction.findMany({ where: { externalId: { startsWith: PREFIX } }, orderBy: { externalId: "asc" } });
    check("idempotent: 4 rows for 5 reports", rows.length, 4);
    check("statuses", rows.map((r) => r.status), ["PAID", "PAID", "REFUNDED", "FAILED"]);
    check("amounts (centavos)", rows.map((r) => r.amount), [8000, 48000, 12000, 8000]);
    check("plan/period captured", [rows[1].planType, rows[1].billingPeriod], ["PRO", "yearly"]);

    const a = await getAnalytics(resolveRange({ range: "30d", tz: "Asia/Manila" }), { refresh: true });
    const r = a.revenue;
    check("revenue.total (PAID only, pesos)", r.total.current, 560); // 80 + 480; refunded 120 excluded
    check("revenue.payments", r.payments.current, 2);
    check("revenue.failed", r.failed.current, 1);
    check("revenue.refunded", [r.refunded.current, r.refundedAmount.current], [1, 120]);
    check("revenue.byPlan", r.byPlan, [{ plan: "PRO", revenue: 560, payments: 2 }]);
    check("ledgerStartedAt set", r.ledgerStartedAt !== null, true);
    check("series revenue sums to total", a.series.reduce((s, p) => s + p.revenue, 0), 560);
    check("series failed payments", a.series.reduce((s, p) => s + p.failedPayments, 0), 1);
    check("recent lists 4 rows", r.recent.length >= 4, true);
    check("arppu = revenue / payers (payers=0 as user unknown)", r.arppu, null);
    check("ltv gated (<10 customers)", r.ltv.value, null);
  } finally {
    const del = await prisma.paymentTransaction.deleteMany({ where: { externalId: { startsWith: PREFIX } } });
    console.log(`cleanup: removed ${del.count} test rows`);
    check("ledger restored", await prisma.paymentTransaction.count(), before);
    await prisma.$disconnect();
  }
  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
