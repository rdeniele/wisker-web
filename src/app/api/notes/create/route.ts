import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { noteService } from "@/service/note.service";
import { validateRequest, createNoteSchema } from "@/lib/validation";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  checkCredits,
  consumeCredits,
  getOperationCost,
} from "@/service/subscription.service";
import { insufficientCreditsResponse } from "@/lib/credit-errors";
import { recordActivity } from "@/service/streak.service";

/**
 * POST /api/notes/create
 * Create a new note
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (auto-syncs to Prisma if needed)
    const user = await getAuthenticatedUser();
    console.error("[CREATE_NOTE] User authenticated:", user.id);

    // Parse and validate request body
    const body = await request.json();
    console.error("[CREATE_NOTE] Request body parsed, has pdfText:", !!body.pdfText, "length:", body.pdfText?.length);
    // Processing note creation request

    const validatedData = validateRequest(createNoteSchema, body);

    // Ensure rawContent has a default value
    const noteData = {
      ...validatedData,
      rawContent: validatedData.rawContent || "",
    };

    // Check if this note requires AI processing (PDF or image upload)
    const requiresAI =
      validatedData.pdfText ||
      validatedData.pdfBase64 ||
      validatedData.imageBase64 ||
      validatedData.pptBase64;

    if (requiresAI) {
      console.error("[CREATE_NOTE] Checking credits for AI processing");
      const creditCost = getOperationCost("analyze_document");
      const hasCredits = await checkCredits(user.id, creditCost);
      if (!hasCredits) {
        return insufficientCreditsResponse(creditCost);
      }
      console.error("[CREATE_NOTE] Credits verified, proceeding with AI processing");
    }

    // Create note
    console.error("[CREATE_NOTE] Calling noteService.createNote");
    const note = await noteService.createNote(user.id, noteData);
    console.error("[CREATE_NOTE] Note created successfully:", note.id);

    // Consume credits after successful document processing
    if (requiresAI) {
      await consumeCredits(user.id, getOperationCost("analyze_document"));
    }

    // Record activity for streak tracking
    try {
      await recordActivity(user.id);
    } catch (error) {
      // Don't fail the request if streak update fails
      console.error("Failed to update streak:", error);
    }

    return successResponse(note, 201);
  } catch (error) {
    console.error("Create note error:", error);
    return errorResponse(error as Error);
  }
}
