/**
 * Payment ledger
 *
 * Records real payment events reported by PayMongo (webhook + checkout
 * verification) in `payment_transactions`. The admin dashboard derives
 * revenue, failed payments and refunds only from this table.
 *
 * Every write is idempotent on `externalId`, because the webhook and the
 * success-page verification can both report the same payment.
 */
import { PlanType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Json = Record<string, unknown>;

const asRecord = (v: unknown): Json | null =>
  v && typeof v === "object" ? (v as Json) : null;
const asString = (v: unknown): string | null =>
  typeof v === "string" && v ? v : null;
const asNumber = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/** PayMongo timestamps are unix seconds. */
function toDate(v: unknown): Date {
  const n = asNumber(v);
  return n ? new Date(n * 1000) : new Date();
}

function toPlanType(v: unknown): PlanType | null {
  const s = asString(v)?.toUpperCase();
  return s === "PRO" || s === "PREMIUM" || s === "FREE" ? s : null;
}

async function resolveUser(
  userId: string | null,
  email: string | null,
): Promise<{ id: string | null; email: string | null }> {
  if (userId) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (u) return { id: u.id, email: u.email };
  }
  if (email) {
    const u = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
    if (u) return { id: u.id, email: u.email };
  }
  return { id: null, email };
}

/**
 * Record a paid checkout session (a resource returned by PayMongo's
 * `checkout_session.payment.paid` webhook or by retrieving the session).
 */
export async function recordPaidCheckoutSession(
  session: unknown,
  fallbackUserId?: string,
): Promise<void> {
  try {
    const resource = asRecord(session);
    const attrs = asRecord(resource?.attributes);
    if (!resource || !attrs) return;

    const checkoutId = asString(resource.id);
    const metadata = asRecord(attrs.metadata) ?? {};
    const payments = Array.isArray(attrs.payments) ? attrs.payments : [];
    const payment = asRecord(payments[0]);
    const paymentAttrs = asRecord(payment?.attributes);

    // Prefer the payment's own amount; fall back to the line items.
    let amount = asNumber(paymentAttrs?.amount);
    if (amount === null && Array.isArray(attrs.line_items)) {
      amount = attrs.line_items.reduce((sum: number, li) => {
        const item = asRecord(li);
        return (
          sum + (asNumber(item?.amount) ?? 0) * (asNumber(item?.quantity) ?? 1)
        );
      }, 0);
    }
    const externalId = asString(payment?.id) ?? checkoutId;
    if (!externalId || amount === null) return;

    const billing = asRecord(paymentAttrs?.billing);
    const user = await resolveUser(
      asString(metadata.userId) ?? fallbackUserId ?? null,
      asString(billing?.email),
    );

    await prisma.paymentTransaction.createMany({
      data: [
        {
          userId: user.id,
          email: user.email,
          externalId,
          checkoutId,
          status: "PAID",
          amount,
          currency: asString(paymentAttrs?.currency) ?? "PHP",
          planType: toPlanType(metadata.planName),
          billingPeriod:
            asString(metadata.billingPeriod) === "yearly" ? "yearly" : "monthly",
          promoCode: asString(metadata.promoCode),
          occurredAt: toDate(paymentAttrs?.paid_at ?? attrs.paid_at),
        },
      ],
      skipDuplicates: true,
    });
  } catch (error) {
    // The ledger must never break the payment flow that called it.
    console.error("Failed to record paid checkout session:", error);
  }
}

/** Record a `payment.failed` event. */
export async function recordFailedPayment(payment: unknown): Promise<void> {
  try {
    const resource = asRecord(payment);
    const attrs = asRecord(resource?.attributes);
    const externalId = asString(resource?.id);
    if (!resource || !attrs || !externalId) return;

    const metadata = asRecord(attrs.metadata) ?? {};
    const billing = asRecord(attrs.billing);
    const user = await resolveUser(
      asString(metadata.userId),
      asString(billing?.email),
    );

    await prisma.paymentTransaction.createMany({
      data: [
        {
          userId: user.id,
          email: user.email,
          externalId,
          status: "FAILED",
          amount: asNumber(attrs.amount) ?? 0,
          currency: asString(attrs.currency) ?? "PHP",
          planType: toPlanType(metadata.planName),
          billingPeriod: asString(metadata.billingPeriod),
          failureReason:
            asString(attrs.failed_message) ?? asString(attrs.failed_code),
          occurredAt: toDate(attrs.created_at),
        },
      ],
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("Failed to record failed payment:", error);
  }
}

/** Mark a previously recorded payment as refunded (no-op if it isn't in the ledger). */
export async function recordRefund(paymentId: string | null): Promise<void> {
  if (!paymentId) return;
  try {
    await prisma.paymentTransaction.updateMany({
      where: { externalId: paymentId, status: "PAID" },
      data: { status: "REFUNDED" },
    });
  } catch (error) {
    console.error("Failed to record refund:", error);
  }
}
