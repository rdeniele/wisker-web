import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StorageService } from '@/service/storage.service';
import { apiResponse, errorResponse } from '@/lib/api-response';
import { UnauthorizedError } from '@/lib/errors';

/**
 * GET /api/notes/[id]/download
 * Download the original file (PDF/image) for a note
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new UnauthorizedError();
    }

    // Get note and verify ownership
    const { default: prisma } = await import('@/lib/prisma');
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
      return errorResponse({
        code: 'NOT_FOUND',
        message: 'Note not found',
        statusCode: 404,
      });
    }

    if (!note.fileUrl) {
      return errorResponse({
        code: 'NO_FILE',
        message: 'This note does not have an attached file',
        statusCode: 404,
      });
    }

    // Extract storage path from URL
    const urlParts = note.fileUrl.split('/');
    const bucketIndex = urlParts.findIndex((part) => part === 'wisker-files');
    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    // Get signed download URL (valid for 1 hour)
    const downloadUrl = await StorageService.getDownloadUrl(filePath, 3600);

    return apiResponse({
      downloadUrl,
      fileName: note.fileName,
      fileType: note.fileType,
    });
  } catch (error) {
    return errorResponse({
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Failed to get download URL',
      statusCode: 500,
    });
  }
}
