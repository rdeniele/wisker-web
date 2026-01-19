import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { subjectService } from '@/service/subject.service';
import { createClient } from '@/lib/supabase/server';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/subjects/[id]/stats
 * Get statistics for a specific subject
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

    // Get subject stats
    const stats = await subjectService.getSubjectStats(id, user.id);

    return successResponse(stats);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
