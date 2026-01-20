import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { noteService } from "@/service/note.service";
import { validateRequest, noteQuerySchema } from "@/lib/validation";
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
