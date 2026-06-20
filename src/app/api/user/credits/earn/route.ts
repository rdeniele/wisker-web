import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserSubscription, grantCredits } from "@/service/subscription.service";
import { AD_REWARD } from "@/lib/credits";

export const dynamic = "force-dynamic";

/**
 * POST /api/user/credits/earn
 * Grants AD_REWARD credits after a completed rewarded ad. The grant is capped
 * at the user's daily allowance (handled in grantCredits), so it can never push
 * the balance above maxCredits.
 *
 * NOTE: For production this should be driven by AdMob Server-Side Verification
 * (SSV) rather than trusting a direct client call. See the mobile services/api.ts
 * comment for the contract.
 */
export async function POST() {
  try {
    const user = await getAuthenticatedUser();

    const before = await getUserSubscription(user.id);

    // Only grant when below the cap.
    if (before.creditsRemaining < before.dailyCredits) {
      await grantCredits(user.id, AD_REWARD);
    }

    const after = await getUserSubscription(user.id);

    return successResponse({
      balance: after.creditsRemaining,
      maxCredits: after.dailyCredits,
      perAdReward: AD_REWARD,
      canEarnFromAds: after.creditsRemaining < after.dailyCredits,
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
