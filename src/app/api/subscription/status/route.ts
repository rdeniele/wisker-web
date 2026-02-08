import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserSubscription } from "@/service/subscription.service";

/**
 * GET /api/subscription/status
 * Get current user's subscription information
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const subscription = await getUserSubscription(user.id);

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error: unknown) {
    console.error("Subscription status error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get subscription status",
      },
      { status: 500 },
    );
  }
}
