/**
 * Knowledge Base Service
 * Orchestrates the complete knowledge base creation and retrieval workflow
 * Coordinates chunking, embedding, and semantic search
 */

import { prisma } from "@/lib/prisma";
import { ChunkingService, TextChunk } from "./chunking.service";
import { embeddingService } from "./embedding.service";
import { visionExtractionService } from "./vision.service";
import { DatabaseError, AIProcessingError, NotFoundError } from "@/lib/errors";
import { Prisma } from "@prisma/client";

// Type assertion for Prisma client with new models (TS cache issue workaround)
const db = prisma as any;

export interface CreateKnowledgeBaseOptions {
  noteId: string;
  rawContent?: string; // If already extracted
  fileUrl?: string; // If needs extraction
  fileType?: string;
  extractWithVision?: boolean; // Use vision model for extraction
}

export interface RetrieveChunksOptions {
  noteIds: string[];
  queryText?: string; // For semantic search
  maxChunks?: number;
  similarityThreshold?: number;
  orderBy?: "similarity" | "chunk_index";
}

export interface KnowledgeBaseChunk {
  id: string;
  noteId: string;
  chunkIndex: number;
  content: string;
  heading?: string;
  pageNumber?: number;
  keyTerms: string[];
  similarity?: number;
}

export class KnowledgeBaseService {
  /**
   * Create knowledge base from note content
   */
  async createKnowledgeBase(
    options: CreateKnowledgeBaseOptions
  ): Promise<{
    knowledgeBaseId: string;
    totalChunks: number;
    totalTokens: number;
  }> {
    const { noteId, rawContent, fileUrl, fileType, extractWithVision } =
      options;

    try {
      // Step 1: Get or extract content
      let content = rawContent;
      let extractedConcepts: string[] = [];

      if (!content && fileUrl && extractWithVision) {
        // Use vision model for extraction
        const extraction = await visionExtractionService.extractFromImage(
          fileUrl
        );
        content = extraction.textContent;
        extractedConcepts = extraction.structuredContent.concepts;
      } else if (!content) {
        throw new AIProcessingError(
          "Either rawContent or fileUrl with extractWithVision must be provided"
        );
      }

      // Step 2: Create semantic chunks
      const chunks = ChunkingService.createChunks(content!);

      // Validate chunks
      const validChunks = chunks.filter((chunk) =>
        ChunkingService.validateChunk(chunk)
      );

      if (validChunks.length === 0) {
        throw new AIProcessingError(
          "Content is too short or invalid for chunking"
        );
      }

      // Get statistics
      const stats = ChunkingService.getChunkStats(validChunks);

      // Step 3: Generate embeddings for all chunks
      const texts = validChunks.map((chunk) => chunk.content);
      const embeddings = await embeddingService.generateDocumentEmbeddings(
        texts
      );

      if (embeddings.length !== validChunks.length) {
        throw new AIProcessingError(
          "Mismatch between chunks and generated embeddings"
        );
      }

      // Step 4: Extract concepts from chunks if not already extracted
      if (extractedConcepts.length === 0) {
        const allKeyTerms = new Set<string>();
        validChunks.forEach((chunk) => {
          chunk.metadata.keyTerms.forEach((term) => allKeyTerms.add(term));
        });
        extractedConcepts = Array.from(allKeyTerms).slice(0, 50); // Top 50
      }

      // Step 5: Store in database within a transaction
      const result = await prisma.$transaction(async (tx: any) => {
        // Create knowledge base entry
        const kb = await tx.knowledgeBase.create({
          data: {
            noteId,
            totalChunks: validChunks.length,
            totalTokens: stats.totalTokens,
            extractedConcepts,
            topicSummary: this.generateTopicSummary(content!, 200),
          },
        });

        // Store chunks with embeddings
        // Note: pgvector embeddings need to be formatted as strings
        const chunkData = validChunks.map((chunk, index) => ({
          noteId,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          heading: chunk.heading,
          embedding: `[${embeddings[index].join(",")}]`, // Format for pgvector
          pageNumber: chunk.metadata.pageNumber,
          startPosition: chunk.metadata.startPosition,
          endPosition: chunk.metadata.endPosition,
          sectionType: chunk.metadata.sectionType,
          hasImages: chunk.metadata.hasImages,
          keyTerms: chunk.metadata.keyTerms,
        }));

        // Batch insert chunks
        for (const data of chunkData) {
          await tx.$executeRaw`
            INSERT INTO note_chunks (
              id, note_id, chunk_index, content, heading, embedding,
              page_number, start_position, end_position, section_type,
              has_images, key_terms, created_at
            ) VALUES (
              gen_random_uuid()::uuid,
              ${noteId}::uuid,
              ${data.chunkIndex},
              ${data.content},
              ${data.heading},
              ${data.embedding}::vector,
              ${data.pageNumber},
              ${data.startPosition},
              ${data.endPosition},
              ${data.sectionType},
              ${data.hasImages},
              ${data.keyTerms}::text[],
              NOW()
            )
          `;
        }

        // Update note status
        await tx.note.update({
          where: { id: noteId },
          data: {
            rawContent: content,
            processingStatus: "COMPLETED",
            processingError: null,
          },
        });

        return kb;
      });

      return {
        knowledgeBaseId: result.id,
        totalChunks: validChunks.length,
        totalTokens: stats.totalTokens,
      };
    } catch (error) {
      console.error("Failed to create knowledge base:", error);

      // Update note status to failed
      await prisma.note
        .update({
          where: { id: noteId },
          data: {
            processingStatus: "FAILED",
            processingError:
              error instanceof Error ? error.message : "Unknown error",
          },
        })
        .catch((e) => console.error("Failed to update note status:", e));

      if (error instanceof AIProcessingError) {
        throw error;
      }

      throw new DatabaseError(
        "Failed to create knowledge base",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Retrieve chunks from knowledge base (all chunks for note)
   */
  async retrieveAllChunks(noteIds: string[]): Promise<KnowledgeBaseChunk[]> {
    try {
      const chunks = await db.noteChunk.findMany({
        where: {
          noteId: { in: noteIds },
        },
        orderBy: [{ noteId: "asc" }, { chunkIndex: "asc" }],
        select: {
          id: true,
          noteId: true,
          chunkIndex: true,
          content: true,
          heading: true,
          pageNumber: true,
          keyTerms: true,
        },
      });

      return chunks as KnowledgeBaseChunk[];
    } catch (error) {
      throw new DatabaseError(
        "Failed to retrieve chunks",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Semantic search across chunks
   */
  async semanticSearch(
    options: RetrieveChunksOptions
  ): Promise<KnowledgeBaseChunk[]> {
    const {
      noteIds,
      queryText,
      maxChunks = 20,
      similarityThreshold = 0.7,
    } = options;

    try {
      if (!queryText) {
        // No query, return all chunks
        return this.retrieveAllChunks(noteIds);
      }

      // Generate query embedding
      const queryEmbedding = await embeddingService.generateQueryEmbedding(
        queryText
      );
      const embeddingStr = `[${queryEmbedding.join(",")}]`;

      // Perform vector similarity search using raw SQL
      const chunks = await prisma.$queryRaw<KnowledgeBaseChunk[]>`
        SELECT 
          id::text,
          note_id::text as "noteId",
          chunk_index as "chunkIndex",
          content,
          heading,
          page_number as "pageNumber",
          key_terms as "keyTerms",
          1 - (embedding <=> ${embeddingStr}::vector) as similarity
        FROM note_chunks
        WHERE note_id = ANY(${noteIds}::uuid[])
          AND embedding IS NOT NULL
          AND 1 - (embedding <=> ${embeddingStr}::vector) > ${similarityThreshold}
        ORDER BY embedding <=> ${embeddingStr}::vector
        LIMIT ${maxChunks}
      `;

      return chunks;
    } catch (error) {
      console.error("Semantic search failed:", error);
      // Fallback to retrieving all chunks
      console.warn("Falling back to retrieving all chunks...");
      return this.retrieveAllChunks(noteIds);
    }
  }

  /**
   * Check if knowledge base exists and is ready
   */
  async isKnowledgeBaseReady(noteId: string): Promise<boolean> {
    try {
      const kb = await db.knowledgeBase.findUnique({
        where: { noteId },
        select: { id: true, totalChunks: true },
      });

      return kb !== null && kb.totalChunks > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if multiple notes have knowledge bases ready
   */
  async areKnowledgeBasesReady(noteIds: string[]): Promise<boolean> {
    try {
      const kbCount = await db.knowledgeBase.count({
        where: {
          noteId: { in: noteIds },
          totalChunks: { gt: 0 },
        },
      });

      return kbCount === noteIds.length;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get knowledge base info
   */
  async getKnowledgeBaseInfo(noteId: string) {
    const kb = await db.knowledgeBase.findUnique({
      where: { noteId },
      include: {
        note: {
          select: {
            title: true,
            fileType: true,
            processingStatus: true,
          },
        },
      },
    });

    if (!kb) {
      throw new NotFoundError("Knowledge base not found for this note");
    }

    return kb;
  }

  /**
   * Update knowledge base usage tracking
   */
  async trackUsage(noteIds: string[]): Promise<void> {
    try {
      await db.knowledgeBase.updateMany({
        where: { noteId: { in: noteIds } },
        data: {
          lastUsedAt: new Date(),
          usageCount: { increment: 1 },
        },
      });
    } catch (error) {
      console.error("Failed to track usage:", error);
      // Non-critical, don't throw
    }
  }

  /**
   * Delete knowledge base
   */
  async deleteKnowledgeBase(noteId: string): Promise<void> {
    try {
      await prisma.$transaction([
        db.noteChunk.deleteMany({ where: { noteId } }),
        db.knowledgeBase.delete({ where: { noteId } }),
      ]);
    } catch (error) {
      throw new DatabaseError(
        "Failed to delete knowledge base",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Regenerate knowledge base (after note update)
   */
  async regenerateKnowledgeBase(noteId: string): Promise<void> {
    try {
      // Get note content
      const note = await prisma.note.findUnique({
        where: { id: noteId },
        select: { rawContent: true, fileUrl: true, fileType: true },
      });

      if (!note) {
        throw new NotFoundError("Note not found");
      }

      // Delete existing knowledge base
      await this.deleteKnowledgeBase(noteId);

      // Create new knowledge base
      await this.createKnowledgeBase({
        noteId,
        rawContent: note.rawContent,
        fileUrl: note.fileUrl || undefined,
        fileType: note.fileType || undefined,
      });
    } catch (error) {
      throw new DatabaseError(
        "Failed to regenerate knowledge base",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generate a brief topic summary (helper method)
   */
  private generateTopicSummary(content: string, maxLength: number): string {
    // Extract first few sentences or paragraphs
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    let summary = "";

    for (const sentence of sentences) {
      if (summary.length + sentence.length > maxLength) {
        break;
      }
      summary += sentence.trim() + ". ";
    }

    return summary.trim() || content.substring(0, maxLength);
  }

  /**
   * Get statistics for multiple knowledge bases
   */
  async getStats(noteIds: string[]) {
    try {
      const stats = await db.knowledgeBase.aggregate({
        where: { noteId: { in: noteIds } },
        _sum: {
          totalChunks: true,
          totalTokens: true,
          usageCount: true,
        },
        _avg: {
          totalChunks: true,
          totalTokens: true,
        },
        _count: true,
      });

      return stats;
    } catch (error) {
      throw new DatabaseError(
        "Failed to get knowledge base stats",
        error instanceof Error ? error : undefined
      );
    }
  }
}

// Export singleton instance
export const knowledgeBaseService = new KnowledgeBaseService();
