import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { learningToolService } from '@/service/learningtool.service';
import { validateRequest, generateLearningToolSchema } from '@/lib/validation';
import { createClient } from '@/lib/supabase/server';

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
      return errorResponse(new Error('Unauthorized'), 401);
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateRequest(generateLearningToolSchema, body);

    // Generate learning tool
    const learningTool = await learningToolService.generateLearningTool(
      user.id,
      validatedData
    );

    return successResponse(learningTool, 201);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
