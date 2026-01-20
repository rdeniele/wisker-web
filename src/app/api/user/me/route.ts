import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { userService } from "@/service/user.service";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/user/me
 * Get authenticated user's profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(new Error("Unauthorized"), 401);
    }

    // Get user profile
    const userProfile = await userService.getUserById(user.id);

    return successResponse(userProfile);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
