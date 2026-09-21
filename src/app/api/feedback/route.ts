import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { validateRequest, createFeedbackSchema } from "@/lib/validation";
import { getAuthenticatedUser } from "@/lib/auth";
import { feedbackService } from "@/service/feedback.service";

/**
 * POST /api/feedback
 * Submit feedback as the authenticated user. It lands in the admin inbox
 * (/admin/feedback) with status NEW.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const body = await request.json().catch(() => null);
    const input = validateRequest(createFeedbackSchema, body);

    const feedback = await feedbackService.createFeedback(
      { id: user.id, email: user.email || user.id },
      input,
      request.headers.get("user-agent"),
    );

    return successResponse({ id: feedback.id }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
