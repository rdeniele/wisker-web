import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { subjectService } from "@/service/subject.service";
import { getAuthenticatedUser } from "@/lib/auth";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/subjects/[id]/stats
 * Get statistics for a specific subject
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get authenticated user (auto-syncs to Prisma if needed)
    const user = await getAuthenticatedUser();

    // Get subject stats
    const stats = await subjectService.getSubjectStats(id, user.id);

    return successResponse(stats);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
