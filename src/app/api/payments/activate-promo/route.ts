import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { validatePromoCode, applyPromoCodeByCode } from "@/service/promo.service";
import { activatePromoSubscription } from "@/service/subscription.service";
import { PlanType } from "@prisma/client";

/**
 * POST /api/payments/activate-promo
 * Activate a subscription with a MONTHS_FREE promo code (no payment required)
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();

    const body = await request.json();
    const { planName, billingPeriod, promoCode, monthsFree } = body;

    if (!planName || !promoCode || !monthsFree) {
      return NextResponse.json(
        { error: "Missing required fields: planName, promoCode, monthsFree" },
        { status: 400 },
      );
    }

    // Map plan name to PlanType enum
    const planNameUpper = planName.toString().toUpperCase();
    const planType: PlanType =
      planNameUpper === "PRO" ? "PRO" : planNameUpper === "PREMIUM" ? "PREMIUM" : "FREE";

    if (planType === "FREE") {
      return NextResponse.json(
        { error: "Cannot activate promo for FREE plan" },
        { status: 400 },
      );
    }

    // Validate promo code again
    const validation = await validatePromoCode(promoCode, planType);

    if (!validation.valid || !validation.promoCode) {
      return NextResponse.json(
        { error: validation.error || "Invalid promo code" },
        { status: 400 },
      );
    }

    // Verify it's a MONTHS_FREE promo
    if (validation.promoCode.discountType !== "MONTHS_FREE") {
      return NextResponse.json(
        { error: "This promo code requires payment" },
        { status: 400 },
      );
    }

    // Activate subscription with promo
    await activatePromoSubscription(
      user.id,
      planType,
      billingPeriod || "monthly",
      promoCode,
      monthsFree,
    );

    // Apply promo code usage
    await applyPromoCodeByCode(promoCode);

    return NextResponse.json({
      success: true,
      message: `Successfully activated ${planName} plan with ${monthsFree} months free!`,
    });
  } catch (error: unknown) {
    console.error("Promo activation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to activate promo",
      },
      { status: 500 },
    );
  }
}
