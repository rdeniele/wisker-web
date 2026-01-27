import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { learningToolService } from "@/service/learningtool.service";
import { validateRequest, generateLearningToolSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";
import {
  checkCredits,
  consumeCredits,
  getOperationCost,
} from "@/service/subscription.service";
import { insufficientCreditsResponse } from "@/lib/credit-errors";
import { recordActivity } from "@/service/streak.service";

/**
 * POST /api/learning-tools/generate
 * Generate a new learning tool (quiz, flashcards, or summary)
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
    const validatedData = validateRequest(generateLearningToolSchema, body);

    // Determine operation type and cost
    const operationType =
      validatedData.type === "QUIZ"
        ? "generate_quiz"
        : validatedData.type === "FLASHCARDS"
          ? "generate_flashcards"
          : validatedData.type === "SUMMARY"
            ? "generate_summary"
            : "generate_concept_map";
    const creditCost = getOperationCost(operationType);

    // Check if user has enough credits
    const hasCredits = await checkCredits(user.id, creditCost);
    if (!hasCredits) {
      return insufficientCreditsResponse(creditCost);
    }

    // Generate learning tool
    const learningTool = await learningToolService.generateLearningTool(
      user.id,
      validatedData,
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

    return successResponse(learningTool, 201);
  } catch (error) {
    console.error("Error generating learning tool:", error);
    return errorResponse(error as Error);
  }
}
