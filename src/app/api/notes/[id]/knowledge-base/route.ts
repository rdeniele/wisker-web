import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/notes/[id]/knowledge-base
 * Get knowledge base information for a note
 * Returns KB status, chunk count, processing info, and readiness state
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get authenticated user (auto-syncs to Prisma if needed)
    const user = await getAuthenticatedUser();

    // Get note with knowledge base and chunks
    const note = await prisma.note.findFirst({
      where: {
        id,
        subject: {
          userId: user.id,
        },
      },
      include: {
        knowledgeBaseData: {
          include: {
            chunks: {
              select: {
                id: true,
                content: true,
                metadata: true,
                tokens: true,
                createdAt: true,
              },
              orderBy: {
                position: "asc",
              },
            },
            aiOperations: {
              select: {
                id: true,
                operationType: true,
                status: true,
                tokensUsed: true,
                cost: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 10, // Last 10 operations
            },
          },
        },
      },
    } as any); // Type assertion to work around Prisma type generation delay

    if (!note) {
      return errorResponse(new Error("Note not found"), 404);
    }

    // Type assertion for note to access knowledgeBaseData
    const noteWithKB = note as any;

    // Calculate statistics
    const hasKnowledgeBase = !!noteWithKB.knowledgeBaseData;
    const chunkCount = noteWithKB.knowledgeBaseData?.chunks?.length || 0;
    const totalTokens = noteWithKB.knowledgeBaseData?.chunks?.reduce((sum: number, chunk: any) => sum + (chunk.tokens || 0), 0) || 0;
    const isReady = noteWithKB.processingStatus === "COMPLETED" && hasKnowledgeBase && chunkCount > 0;

    return successResponse({
      noteId: noteWithKB.id,
      noteTitle: noteWithKB.title,
      processingStatus: noteWithKB.processingStatus,
      hasKnowledgeBase,
      knowledgeBase: noteWithKB.knowledgeBaseData
        ? {
            id: noteWithKB.knowledgeBaseData.id,
            totalChunks: noteWithKB.knowledgeBaseData.totalChunks,
            embeddingModel: noteWithKB.knowledgeBaseData.embeddingModel,
            chunkingStrategy: noteWithKB.knowledgeBaseData.chunkingStrategy,
            createdAt: noteWithKB.knowledgeBaseData.createdAt,
            updatedAt: noteWithKB.knowledgeBaseData.updatedAt,
          }
        : null,
      statistics: {
        chunkCount,
        totalTokens,
        avgTokensPerChunk: chunkCount > 0 ? Math.round(totalTokens / chunkCount) : 0,
      },
      isReady,
      chunks: noteWithKB.knowledgeBaseData?.chunks || [],
      recentOperations: noteWithKB.knowledgeBaseData?.aiOperations || [],
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
