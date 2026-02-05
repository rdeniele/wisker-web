import { NextRequest, NextResponse } from "next/server";
import { validatePromoCode } from "@/service/promo.service";

export async function POST(request: NextRequest) {
  try {
    const { code, planType } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    const result = await validatePromoCode(code, planType);

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      promoCode: result.promoCode,
    });
  } catch (error) {
    console.error("Error validating promo code:", error);
    return NextResponse.json(
      { error: "Failed to validate promo code" },
      { status: 500 }
    );
  }
}
