import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { noteService } from "@/service/note.service";
import { validateRequest, createNoteSchema } from "@/lib/validation";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkCredits, consumeCredits, getOperationCost } from "@/service/subscription.service";
import { insufficientCreditsResponse } from "@/lib/credit-errors";

/**
 * POST /api/notes/create
 * Create a new note
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (auto-syncs to Prisma if needed)
    const user = await getAuthenticatedUser();

    // Parse and validate request body
    const body = await request.json();
    console.log("Create note request body:", {
      ...body,
      pdfText: body.pdfText
        ? `[PDF TEXT: ${body.pdfText.length} chars]`
        : undefined,
      pdfBase64: body.pdfBase64 ? "[PDF DATA]" : undefined,
      imageBase64: body.imageBase64 ? "[IMAGE DATA]" : undefined,
    });

    const validatedData = validateRequest(createNoteSchema, body);

    // Ensure rawContent has a default value
    const noteData = {
      ...validatedData,
      rawContent: validatedData.rawContent || "",
    };

    // Check if this note requires AI processing (PDF or image upload)
    const requiresAI = validatedData.pdfText || validatedData.pdfBase64 || validatedData.imageBase64;
    
    if (requiresAI) {
      const creditCost = getOperationCost('analyze_document');
      const hasCredits = await checkCredits(user.id, creditCost);
      if (!hasCredits) {
        return insufficientCreditsResponse(creditCost);
      }
    }

    // Create note
    const note = await noteService.createNote(user.id, noteData);

    // Consume credits after successful document processing
    if (requiresAI) {
      await consumeCredits(user.id, getOperationCost('analyze_document'));
    }

    return successResponse(note, 201);
  } catch (error) {
    console.error("Create note error:", error);
    return errorResponse(error as Error);
  }
}
