/**
 * Credit Error Responses
 * Standardized error messages for insufficient credits
 */

import { NextResponse } from "next/server";

export function insufficientCreditsResponse(creditsNeeded: number) {
  return NextResponse.json(
    {
      success: false,
      error: "Insufficient credits",
      message: `This operation requires ${creditsNeeded} credit${creditsNeeded > 1 ? "s" : ""}. Upgrade your plan for more daily credits.`,
      code: "INSUFFICIENT_CREDITS",
      details: {
        creditsNeeded,
        upgradeUrl: "/upgrade",
      },
    },
    { status: 402 },
  );
}

export function planLimitReachedResponse(
  limitType: "notes" | "subjects",
  current: number,
  limit: number,
) {
  const limitName = limitType === "notes" ? "Notes" : "Subjects";

  return NextResponse.json(
    {
      success: false,
      error: "Plan limit reached",
      message: `You've reached your ${limitName.toLowerCase()} limit (${limit}). Upgrade your plan for more.`,
      code: "PLAN_LIMIT_REACHED",
      details: {
        limitType,
        current,
        limit,
        upgradeUrl: "/upgrade",
      },
    },
    { status: 403 },
  );
}
