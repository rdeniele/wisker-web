/**
 * Plans API Route - GET
 * Fetches all active subscription plans
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("[API] Fetching plans...");

    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        planType: true,
        displayName: true,
        description: true,
        monthlyPrice: true,
        yearlyPrice: true,
        dailyCredits: true,
        notesLimit: true,
        subjectsLimit: true,
        features: true,
        isMostPopular: true,
        discountPercent: true,
        discountLabel: true,
      },
    });

    console.log(`[API] Found ${plans.length} plans`);

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("[API] Error fetching plans:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch plans",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
