import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { noteService } from '@/service/note.service';
import { validateRequest, createNoteSchema } from '@/lib/validation';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/notes/create
 * Create a new note
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
    const validatedData = validateRequest(createNoteSchema, body);

    // Create note
    const note = await noteService.createNote(user.id, validatedData);

    return successResponse(note, 201);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
