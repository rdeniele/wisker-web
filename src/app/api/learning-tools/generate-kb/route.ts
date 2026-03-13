import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { learningToolService } from "@/service/learningtool.service";
import { createClient } from "@/lib/supabase/server";
import {
  checkCredits,
  consumeCredits,
  getOperationCost,
} from "@/service/subscription.service";
import { insufficientCreditsResponse } from "@/lib/credit-errors";
import { recordActivity } from "@/service/streak.service";
import { z } from "zod";
import { validateRequest } from "@/lib/validation";

// Schema for KB-based learning tool generation
const generateLearningToolKBSchema = z.object({
  noteIds: z.array(z.string()).min(1, "At least one note ID is required").optional(),
  noteId: z.string().optional(),
  subjectId: z.string().optional(),
  type: z.enum(["QUIZ", "FLASHCARDS", "SUMMARY", "ORGANIZED_NOTE"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  questionCount: z.number().min(1).max(50).optional(),
}).refine(data => data.noteIds || data.noteId || data.subjectId, {
  message: "Either noteIds, noteId, or subjectId must be provided",
});

/**
 * POST /api/learning-tools/generate-kb
 * Generate learning tools using knowledge base for more efficient and accurate results
 * Uses semantic search to find relevant chunks across multiple notes
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
    const validatedData = validateRequest(generateLearningToolKBSchema, body);

    // Determine operation type and cost (KB generation is more efficient, ~30% cheaper)
    const operationType =
      validatedData.type === "QUIZ"
        ? "generate_quiz"
        : validatedData.type === "FLASHCARDS"
          ? "generate_flashcards"
          : validatedData.type === "SUMMARY"
            ? "generate_summary"
            : "generate_concept_map";
    const baseCost = getOperationCost(operationType);
    const creditCost = Math.ceil(baseCost * 0.7); // 30% discount for KB-based generation

    // Check if user has enough credits
    const hasCredits = await checkCredits(user.id, creditCost);
    if (!hasCredits) {
      return insufficientCreditsResponse(creditCost);
    }

    // Determine source based on what's provided
    let source: "SUBJECT" | "SINGLE_NOTE";
    if (validatedData.noteId) {
      source = "SINGLE_NOTE";
    } else {
      source = "SUBJECT";
    }

    // Generate learning tool using knowledge base
    const learningTool = await learningToolService.generateLearningToolWithKB(
      user.id,
      {
        type: validatedData.type as any,
        source,
        subjectId: validatedData.subjectId,
        noteId: validatedData.noteId,
        noteIds: validatedData.noteIds,
        difficulty: validatedData.difficulty?.toLowerCase() as "easy" | "medium" | "hard" | undefined,
        questionCount: validatedData.questionCount,
      }
    );

    // Consume credits after successful generation
    await consumeCredits(user.id, creditCost);

    // Record activity for streak tracking
    try {
      await recordActivity(user.id);
    } catch (error) {
      // Don't fail the request if streak update fails
      console.error("Failed to update streak:", error);
    }

    return successResponse({
      ...learningTool,
      usedKnowledgeBase: true,
      creditsUsed: creditCost,
      savings: baseCost - creditCost,
    }, 201);
  } catch (error) {
    console.error("Error generating KB-based learning tool:", error instanceof Error ? error.message : String(error));
    return errorResponse(error as Error);
  }
}
