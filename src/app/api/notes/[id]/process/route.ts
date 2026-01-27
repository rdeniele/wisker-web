import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { noteService } from "@/service/note.service";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  checkCredits,
  consumeCredits,
  getOperationCost,
} from "@/service/subscription.service";
import { insufficientCreditsResponse } from "@/lib/credit-errors";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * POST /api/notes/[id]/process
 * Process a note with AI to generate organized content
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get authenticated user (auto-syncs to Prisma if needed)
    const user = await getAuthenticatedUser();

    // Check if user has enough credits
    const creditCost = getOperationCost("process_note");
    const hasCredits = await checkCredits(user.id, creditCost);
    if (!hasCredits) {
      return insufficientCreditsResponse(creditCost);
    }

    // Process note
    const note = await noteService.processNote(id, user.id);

    // Consume credits after successful processing
    await consumeCredits(user.id, creditCost);

    return successResponse(note);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
