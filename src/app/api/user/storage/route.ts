import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { StorageService } from "@/service/storage.service";
import { apiResponse, errorResponse } from "@/lib/api-response";
import { UnauthorizedError } from "@/lib/errors";
import prisma from "@/lib/prisma";

/**
 * GET /api/user/storage
 * Get storage statistics for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new UnauthorizedError();
    }

    // Get storage stats
    const stats = await StorageService.getUserStorageStats(user.id);

    // Get note count with files
    const notesWithFiles = await prisma.note.count({
      where: {
        subject: {
          userId: user.id,
        },
        fileUrl: {
          not: null,
        },
      },
    });

    return apiResponse({
      totalFiles: stats.totalFiles,
      totalSize: stats.totalSize,
      totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
      notesWithFiles,
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error : new Error("Failed to get storage stats"),
    );
  }
}

/**
 * DELETE /api/user/storage
 * Delete all files for the authenticated user
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new UnauthorizedError();
    }

    // Delete all user files from storage
    await StorageService.deleteUserFiles(user.id);

    // Update database to remove file references
    await prisma.note.updateMany({
      where: {
        subject: {
          userId: user.id,
        },
      },
      data: {
        fileUrl: null,
        fileName: null,
        fileSize: null,
        fileType: null,
      },
    });

    return apiResponse({
      message: "All files deleted successfully",
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error : new Error("Failed to delete files"),
    );
  }
}
