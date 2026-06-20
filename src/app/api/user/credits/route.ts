import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserSubscription } from "@/service/subscription.service";
import { AD_REWARD } from "@/lib/credits";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/credits
 * Returns the user's current credit balance for the mobile ad-reward UI.
 * Applies the daily replenish (handled inside getUserSubscription) on read.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const sub = await getUserSubscription(user.id);

    return successResponse({
      balance: sub.creditsRemaining,
      maxCredits: sub.dailyCredits,
      perAdReward: AD_REWARD,
      canEarnFromAds: sub.creditsRemaining < sub.dailyCredits,
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
