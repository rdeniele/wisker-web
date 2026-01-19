import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { learningToolService } from '@/../service/learningtool.service';
import { createClient } from '@/lib/supabase/server';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/learning-tools/[id]
 * Get a specific learning tool by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(new Error('Unauthorized'), 401);
    }

    // Get learning tool
    const learningTool = await learningToolService.getLearningToolById(id, user.id);

    return successResponse(learningTool);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

/**
 * DELETE /api/learning-tools/[id]
 * Delete a specific learning tool
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(new Error('Unauthorized'), 401);
    }

    // Delete learning tool
    await learningToolService.deleteLearningTool(id, user.id);

    return successResponse({ message: 'Learning tool deleted successfully' });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
