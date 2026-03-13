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
 * POST /api/notes/[id]/process-kb
 * Process a note with AI and create a knowledge base for reusable learning
 * Uses advanced chunking, embeddings, and vector similarity for efficient content generation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get authenticated user (auto-syncs to Prisma if needed)
    const user = await getAuthenticatedUser();

    // Check if user has enough credits (KB processing costs more than simple processing)
    const creditCost = getOperationCost("process_note") * 1.5; // 1.5x cost for KB processing
    const hasCredits = await checkCredits(user.id, creditCost);
    if (!hasCredits) {
      return insufficientCreditsResponse(creditCost);
    }

    // Process note with knowledge base creation
    const note = await noteService.processNoteWithKnowledgeBase(id, user.id);

    // Consume credits after successful processing
    await consumeCredits(user.id, creditCost);

    return successResponse({
      note,
      message: "Knowledge base created successfully. You can now generate learning tools more efficiently.",
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
