import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { userService } from "@/service/user.service";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * GET /api/user/me
 * Get authenticated user's profile
 */
export async function GET(_request: NextRequest) {
  try {
    // Get authenticated user (supports both web cookies and mobile Bearer token)
    const user = await getAuthenticatedUser();

    // Get user profile
    const userProfile = await userService.getUserById(user.id);

    return successResponse(userProfile);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
