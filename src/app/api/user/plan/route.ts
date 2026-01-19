import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { userService } from '@/service/user.service';
import { validateRequest, updateUserPlanSchema } from '@/lib/validation';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/user/plan
 * Update authenticated user's plan
 */
export async function PATCH(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateRequest(updateUserPlanSchema, body);

    // Update user plan
    const updatedUser = await userService.updateUserPlan(user.id, validatedData.planType);

    return successResponse(updatedUser);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
