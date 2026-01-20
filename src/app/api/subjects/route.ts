import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { subjectService } from "@/service/subject.service";
import { validateRequest, subjectQuerySchema } from "@/lib/validation";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * GET /api/subjects
 * Get all subjects for authenticated user with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user (auto-syncs to Prisma if needed)
    const user = await getAuthenticatedUser();

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
