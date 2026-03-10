import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/service/payment.service";
import { updateSubscriptionPlan } from "@/service/subscription.service";
import { applyPromoCodeByCode } from "@/service/promo.service";
import { PlanType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface PayMongoEvent {
  data: {
    attributes: {
      type: string;
      data: {
        id: string;
        type: string;
        attributes: {
          status?: string;
          metadata?: {
            userId?: string;
            planName?: string;
            billingPeriod?: string;
            promoCode?: string;
          };
        };
      };
    };
  };
}

/**
 * POST /api/payments/webhook
 * Handle PayMongo webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("paymongo-signature");

    // Verify webhook signature
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    }

    const event = JSON.parse(body);
    const eventType = event.data.attributes.type;

    // Process webhook event

    // Handle different event types
    switch (eventType) {
      case "payment.paid":
        await handlePaymentPaid(event);
        break;
      case "payment.failed":
        await handlePaymentFailed(event);
        break;
      case "checkout_session.payment.paid":
        await handleCheckoutSessionPaid(event);
        break;
      case "qrph.expired":
        await handleQrphExpired(event);
        break;
      default:
        // Unhandled webhook event type
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 },
    );
  }
}

async function handlePaymentPaid(event: unknown) {
  const paymongoEvent = event as PayMongoEvent;
  const data = paymongoEvent.data.attributes.data;
  // Payment processed successfully
  // Implement your business logic here
}

async function handlePaymentFailed(event: unknown) {
  const paymongoEvent = event as PayMongoEvent;
  const data = paymongoEvent.data.attributes.data;
  // Payment failed
  // Implement your business logic here
}

async function handleCheckoutSessionPaid(event: unknown) {
  const paymongoEvent = event as PayMongoEvent;
  const data = paymongoEvent.data.attributes.data;
  const metadata = data.attributes.metadata;

  // Process checkout session payment

  if (metadata && metadata.userId) {
    // Map plan name to PlanType enum
    const planName = metadata.planName?.toString().toUpperCase();
    const planType: PlanType =
      planName === "PRO" ? "PRO" : planName === "PREMIUM" ? "PREMIUM" : "FREE";
    const billingPeriod =
      metadata.billingPeriod?.toString() === "yearly" ? "yearly" : "monthly";

    // Update user subscription using the subscription service
    await updateSubscriptionPlan(
      metadata.userId.toString(),
      planType,
      billingPeriod,
      true,
    );

    // Apply promo code usage and store promo info if provided
    if (metadata.promoCode) {
      try {
        const promoCodeStr = metadata.promoCode.toString().toUpperCase();
        await applyPromoCodeByCode(promoCodeStr);
        
        // Store promo code in user record for tracking
        await prisma.user.update({
          where: { id: metadata.userId.toString() },
          data: {
            appliedPromoCode: promoCodeStr,
          },
        });
        
        // Promo code applied successfully
      } catch (error) {
        console.error("Failed to apply promo code usage");
        // Don't fail the webhook if promo code tracking fails
      }
    }
  }
}

async function handleQrphExpired(event: unknown) {
  const paymongoEvent = event as PayMongoEvent;
  const data = paymongoEvent.data.attributes.data;
  // QR Ph code expired - payment intent will revert to awaiting_payment_method
  // User can retry the payment if needed
}
