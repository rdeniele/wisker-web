import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { noteService } from '@/service/note.service';
import { validateRequest, noteQuerySchema } from '@/lib/validation';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/notes
 * Get all notes for authenticated user with pagination and filtering
 */
export async function GET(request: NextRequest) {
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

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedParams = validateRequest(noteQuerySchema, searchParams);

    // Get notes
    const result = await noteService.getUserNotes(user.id, validatedParams);

    return successResponse(result);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
