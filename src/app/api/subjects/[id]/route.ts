import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { subjectService } from "@/service/subject.service";
import { validateRequest, updateSubjectSchema } from "@/lib/validation";
import { getAuthenticatedUser } from "@/lib/auth";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/subjects/[id]
 * Get a specific subject by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log(`[API /api/subjects/${id}] Fetching subject`);

    // Get authenticated user (auto-syncs to Prisma if needed)
    const user = await getAuthenticatedUser();
    console.log(`[API /api/subjects/${id}] User authenticated:`, user.id);

    // Get subject
    const subject = await subjectService.getSubjectById(id, user.id);
    console.log(`[API /api/subjects/${id}] Subject found`);

    return successResponse(subject);
  } catch (error) {
    console.error(`[API /api/subjects/${id}] Error:`, {
      type: error?.constructor?.name,
      message: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error as Error);
  }
}

/**
 * PATCH /api/subjects/[id]
 * Update a specific subject
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get authenticated user (auto-syncs to Prisma if needed)
    const user = await getAuthenticatedUser();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateRequest(updateSubjectSchema, body);

    // Update subject
    const subject = await subjectService.updateSubject(
      id,
      user.id,
      validatedData,
    );

    return successResponse(subject);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

/**
 * DELETE /api/subjects/[id]
 * Delete a specific subject
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get authenticated user (auto-syncs to Prisma if needed)
    const user = await getAuthenticatedUser();

    // Delete subject
    await subjectService.deleteSubject(id, user.id);

    return successResponse({ message: "Subject deleted successfully" });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
