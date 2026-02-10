import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { noteService } from "@/service/note.service";
import { validateRequest, noteQuerySchema, createNoteSchema } from "@/lib/validation";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * GET /api/notes
 * Get all notes for authenticated user with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user (auto-syncs to Prisma if needed)
    const user = await getAuthenticatedUser();

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

/**
 * POST /api/notes
 * Create a new note (with or without subject)
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateRequest(createNoteSchema, body);

    // Create note
    const note = await noteService.createNote(user.id, validatedData);

    return successResponse(
      { note },
      { message: "Note created successfully", statusCode: 201 }
    );
  } catch (error) {
    return errorResponse(error as Error);
  }
}
