import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { userService } from "@/service/user.service";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * GET /api/user/usage
 * Get authenticated user's usage statistics
 */
export async function GET(_request: NextRequest) {
  try {
    // Get authenticated user (supports both web cookies and mobile Bearer token)
    const user = await getAuthenticatedUser();

    // Get usage stats
    const stats = await userService.getUserUsageStats(user.id);

    return successResponse(stats);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
