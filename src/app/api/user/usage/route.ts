import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { userService } from '@/service/user.service';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/user/usage
 * Get authenticated user's usage statistics
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
      return errorResponse(new Error('Unauthorized'), 401);
    }

    // Get usage stats
    const stats = await userService.getUserUsageStats(user.id);

    return successResponse(stats);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
