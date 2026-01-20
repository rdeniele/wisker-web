import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { subjectService } from "@/service/subject.service";
import { validateRequest, updateSubjectSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";

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

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(new Error("Unauthorized"), 401);
    }

    // Get subject
    const subject = await subjectService.getSubjectById(id, user.id);

    return successResponse(subject);
  } catch (error) {
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

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(new Error("Unauthorized"), 401);
    }

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

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(new Error("Unauthorized"), 401);
    }

    // Delete subject
    await subjectService.deleteSubject(id, user.id);

    return successResponse({ message: "Subject deleted successfully" });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
