import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * GET /api/knowledge-base/stats
 * Get comprehensive statistics about knowledge base usage and efficiency
 * Includes user-specific metrics, cost savings, and system performance
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user (auto-syncs to Prisma if needed)
    const user = await getAuthenticatedUser();

    // Get user's notes with knowledge bases
    const notes = await prisma.note.findMany({
      where: {
        subject: {
          userId: user.id,
        },
      },
      include: {
        knowledgeBaseData: {
          include: {
            chunks: {
              select: {
                tokens: true,
              },
            },
            aiOperations: {
              select: {
                operationType: true,
                status: true,
                tokensUsed: true,
                cost: true,
                responseTime: true,
              },
            },
          },
        },
      },
    } as any); // Type assertion to work around Prisma type generation delay

    // Calculate statistics
    const totalNotes = notes.length;
    const notesWithKB = notes.filter((n: any) => n.knowledgeBaseData).length;
    const kbAdoptionRate = totalNotes > 0 ? (notesWithKB / totalNotes) * 100 : 0;

    const totalChunks = notes.reduce((sum: number, note: any) => 
      sum + (note.knowledgeBaseData?.chunks?.length || 0), 0
    );

    const totalTokens = notes.reduce((sum: number, note: any) => 
      sum + (note.knowledgeBaseData?.chunks?.reduce((chunkSum: number, chunk: any) => 
        chunkSum + (chunk.tokens || 0), 0) || 0), 0
    );

    // AI Operations statistics
    const allOperations = notes.flatMap((note: any) => 
      note.knowledgeBaseData?.aiOperations || []
    );

    const operationsByType = allOperations.reduce((acc: any, op: any) => {
      acc[op.operationType] = (acc[op.operationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const operationsByStatus = allOperations.reduce((acc: any, op: any) => {
      acc[op.status] = (acc[op.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalCost = allOperations.reduce((sum: number, op: any) => 
      sum + (op.cost || 0), 0
    );

    const totalTokensUsed = allOperations.reduce((sum: number, op: any) => 
      sum + (op.tokensUsed || 0), 0
    );

    const avgResponseTime = allOperations.length > 0
      ? allOperations.reduce((sum: number, op: any) => sum + (op.responseTime || 0), 0) / allOperations.length
      : 0;

    // Calculate cost savings (KB-based generation is ~30% cheaper)
    const kbOperationsCount = allOperations.filter((op: any) => 
      ['GENERATE_QUIZ', 'GENERATE_FLASHCARDS', 'GENERATE_SUMMARY'].includes(op.operationType)
    ).length;
    
    const estimatedSavings = kbOperationsCount * 0.3 * 10; // Assuming ~10 credits base cost

    // Most active knowledge bases
    const kbActivity = notes
      .filter((n: any) => n.knowledgeBaseData)
      .map((n: any) => ({
        noteId: n.id,
        noteTitle: n.title,
        chunkCount: n.knowledgeBaseData!.chunks.length,
        operationCount: n.knowledgeBaseData!.aiOperations.length,
        totalCost: n.knowledgeBaseData!.aiOperations.reduce((sum: number, op: any) => sum + (op.cost || 0), 0),
      }))
      .sort((a, b) => b.operationCount - a.operationCount)
      .slice(0, 5);

    // Processing status distribution
    const statusDistribution = notes.reduce((acc: any, note: any) => {
      const status = note.processingStatus || 'PENDING';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return successResponse({
      overview: {
        totalNotes,
        notesWithKnowledgeBase: notesWithKB,
        kbAdoptionRate: Math.round(kbAdoptionRate * 100) / 100,
        totalChunks,
        totalTokens,
        avgChunksPerNote: notesWithKB > 0 ? Math.round(totalChunks / notesWithKB) : 0,
        avgTokensPerChunk: totalChunks > 0 ? Math.round(totalTokens / totalChunks) : 0,
      },
      aiOperations: {
        total: allOperations.length,
        byType: operationsByType,
        byStatus: operationsByStatus,
        totalCost: Math.round(totalCost * 100) / 100,
        totalTokensUsed,
        avgResponseTime: Math.round(avgResponseTime),
        estimatedSavings: Math.round(estimatedSavings),
      },
      processingStatus: statusDistribution,
      topKnowledgeBases: kbActivity,
      efficiency: {
        successRate: allOperations.length > 0
          ? Math.round((operationsByStatus['SUCCESS'] || 0) / allOperations.length * 10000) / 100
          : 0,
        averageCostPerOperation: allOperations.length > 0
          ? Math.round((totalCost / allOperations.length) * 100) / 100
          : 0,
        tokenEfficiency: totalTokensUsed > 0
          ? Math.round((totalCost / totalTokensUsed) * 1000000) / 1000000
          : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching KB stats:", error);
    return errorResponse(error as Error);
  }
}
