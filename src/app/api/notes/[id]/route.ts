import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { noteService } from '@/service/note.service';
import { validateRequest, updateNoteSchema } from '@/lib/validation';
import { createClient } from '@/lib/supabase/server';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/notes/[id]
 * Get a specific note by ID
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

    // Get note
    const note = await noteService.getNoteById(id, user.id);

    return successResponse(note);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

/**
 * PATCH /api/notes/[id]
 * Update a specific note
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateRequest(updateNoteSchema, body);

    // Update note
    const note = await noteService.updateNote(id, user.id, validatedData);

    return successResponse(note);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

/**
 * DELETE /api/notes/[id]
 * Delete a specific note
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

    // Delete note
    await noteService.deleteNote(id, user.id);

    return successResponse({ message: 'Note deleted successfully' });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
