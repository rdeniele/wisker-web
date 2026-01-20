import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { subjectService } from "@/service/subject.service";
import { validateRequest, subjectQuerySchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/subjects
 * Get all subjects for authenticated user with pagination and search
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

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedParams = validateRequest(subjectQuerySchema, searchParams);

    // Get subjects
    const result = await subjectService.getUserSubjects(
      user.id,
      validatedParams,
    );

    return successResponse(result);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
