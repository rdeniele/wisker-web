/**
 * Admin Feedback API Route
 * Inbox for user feedback: list, triage (status + notes) and delete.
 */

import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getAdminUser } from "@/lib/admin-auth";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import {
  validateRequest,
  feedbackQuerySchema,
  updateFeedbackSchema,
} from "@/lib/validation";
import { feedbackService } from "@/service/feedback.service";

async function assertAdmin() {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) {
    throw new ForbiddenError("Admin access required");
  }
}

// GET - Paginated feedback plus overall stats
export async function GET(request: NextRequest) {
  try {
    await assertAdmin();

    const params = validateRequest(
      feedbackQuerySchema,
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const [list, stats] = await Promise.all([
      feedbackService.listFeedback(params),
      feedbackService.getStats(),
    ]);

    return successResponse({ ...list, stats });
  } catch (error) {
    return errorResponse(error);
  }
}

// PATCH - Update status and/or admin notes
export async function PATCH(request: NextRequest) {
  try {
    await assertAdmin();

    const body = await request.json().catch(() => null);
    const { id, ...data } = validateRequest(updateFeedbackSchema, body);

    const feedback = await feedbackService.updateFeedback(id, data);
    return successResponse({ feedback });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE - Remove a feedback entry (?id=...)
export async function DELETE(request: NextRequest) {
  try {
    await assertAdmin();

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      throw new ValidationError("Feedback ID is required");
    }

    await feedbackService.deleteFeedback(id);
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
