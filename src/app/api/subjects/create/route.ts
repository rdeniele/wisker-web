import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { subjectService } from "@/service/subject.service";
import { validateRequest, createSubjectSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/subjects/create
 * Create a new subject
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateRequest(createSubjectSchema, body);

    // Create subject
    const subject = await subjectService.createSubject(user.id, validatedData);

    return successResponse(subject, 201);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
