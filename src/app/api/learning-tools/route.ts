import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { learningToolService } from "@/service/learningtool.service";
import { validateRequest, learningToolQuerySchema } from "@/lib/validation";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * GET /api/learning-tools
 * Get all learning tools for authenticated user with filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user (supports both web cookies and mobile Bearer token)
    const user = await getAuthenticatedUser();

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedParams = validateRequest(
      learningToolQuerySchema,
      searchParams,
    );

    // Get learning tools
    const result = await learningToolService.getUserLearningTools(
      user.id,
      validatedParams,
    );

    return successResponse(result);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
