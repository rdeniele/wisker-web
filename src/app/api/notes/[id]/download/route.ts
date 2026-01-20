import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { StorageService } from "@/service/storage.service";
import { apiResponse, errorResponse } from "@/lib/api-response";
import { UnauthorizedError, NotFoundError, AppError } from "@/lib/errors";
import { ErrorCode } from "@/types/api";
import prisma from "@/lib/prisma";

/**
 * GET /api/notes/[id]/download
 * Download the original file (PDF/image) for a note
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Get authenticated user (auto-syncs to Prisma if needed)
    const user = await getAuthenticatedUser();

    // Get note and verify ownership
    const note = await prisma.note.findFirst({
      where: {
        id,
        subject: {
          userId: user.id,
        },
      },
      select: {
        fileUrl: true,
        fileName: true,
        fileType: true,
      },
    });

    if (!note) {
      throw new NotFoundError("Note");
    }

    if (!note.fileUrl) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "This note does not have an attached file",
        404,
      );
    }

    // Extract storage path from URL
    const urlParts = note.fileUrl.split("/");
    const bucketIndex = urlParts.findIndex(
      (part: string) => part === "wisker-files",
    );
    const filePath = urlParts.slice(bucketIndex + 1).join("/");

    // Get signed download URL (valid for 1 hour)
    const downloadUrl = await StorageService.getDownloadUrl(filePath, 3600);

    return apiResponse({
      downloadUrl,
      fileName: note.fileName,
      fileType: note.fileType,
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error : new Error("Failed to get download URL"),
    );
  }
}
