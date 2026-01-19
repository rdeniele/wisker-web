import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { noteService } from '@/service/note.service';
import { createClient } from '@/lib/supabase/server';

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
    
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(new Error('Unauthorized'), 401);
    }

    // Process note
    const note = await noteService.processNote(id, user.id);

    return successResponse(note);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
