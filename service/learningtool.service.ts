import { prisma } from "../src/lib/prisma";
import {
  NotFoundError,
  AIUsageLimitExceededError,
  DatabaseError,
  ForbiddenError,
  InvalidInputError,
  AIProcessingError,
} from "../src/lib/errors";
import {GenerateLearningToolRequest, LearningToolDto } from "../src/types/api";
import { subjectService } from "./subject.service";
import { noteService } from "./note.service";
import { aiService } from "./ai.service";
import { knowledgeBaseService } from "./knowledgebase.service";
import { kimiService } from "./kimi.service";
import { LearningToolType, LearningToolSource, Prisma } from "@prisma/client";

export class LearningToolService {
  /**
   * Get learning tools for a user with filtering
   */
  async getUserLearningTools(
    userId: string,
    options: {
      subjectId?: string;
      noteId?: string;
      type?: LearningToolType;
      source?: LearningToolSource;
      page?: number;
      pageSize?: number;
      sortBy?: "createdAt";
      sortOrder?: "asc" | "desc";
    } = {},
  ) {
    try {
      const {
        subjectId,
        noteId,
        type,
        source,
        page = 1,
        pageSize = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      const skip = (page - 1) * pageSize;

      // Build where clause with user ownership verification
      const where: Prisma.LearningToolWhereInput = {
        OR: [{ subject: { userId } }, { note: { subject: { userId } } }],
        ...(subjectId && { subjectId }),
        ...(noteId && { noteId }),
        ...(type && { type }),
        ...(source && { source }),
      };

      const [learningTools, total] = await Promise.all([
        prisma.learningTool.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
          include: {
            subject: {
              select: {
                id: true,
                title: true,
              },
            },
            note: {
              select: {
                id: true,
                title: true,
              },
            },
            notes: {
              select: {
                note: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        }),
        prisma.learningTool.count({ where }),
      ]);

      // Transform notes junction table data
      const transformedTools = learningTools.map((tool) => ({
        ...tool,
        notes: tool.notes.map((n) => n.note),
      }));

      return {
        learningTools: transformedTools,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      throw new DatabaseError(
        "Failed to fetch learning tools",
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Get a single learning tool by ID
   */
  async getLearningToolById(
    learningToolId: string,
    userId: string,
  ): Promise<LearningToolDto> {
    try {
      const learningTool = await prisma.learningTool.findUnique({
        where: { id: learningToolId },
        include: {
          subject: true,
          note: {
            include: {
              subject: true,
            },
          },
          notes: {
            select: {
              note: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      });

      if (!learningTool) {
        throw new NotFoundError("Learning tool");
      }

      // Verify ownership
      const ownerUserId =
        learningTool.subject?.userId || learningTool.note?.subject?.userId;

      if (ownerUserId !== userId) {
        throw new ForbiddenError(
          "You do not have access to this learning tool",
        );
      }

      return {
        ...learningTool,
        subjectId: learningTool.subjectId ?? undefined,
        noteId: learningTool.noteId ?? undefined,
        notes: learningTool.notes.map((n) => n.note),
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError(
        "Failed to fetch learning tool",
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Generate a new learning tool
   */
  async generateLearningTool(
    userId: string,
    data: GenerateLearningToolRequest,
  ): Promise<LearningToolDto> {
    try {
      // Validate and fetch content based on source
      let contentToProcess: string;
      let subjectId: string | undefined;
      let noteId: string | undefined;
      let selectedNoteIds: string[] = [];

      if (data.source === "SUBJECT") {
        if (!data.subjectId) {
          throw new InvalidInputError(
            "Subject ID is required for SUBJECT source",
          );
        }

        // Verify subject ownership
        const subject = await subjectService.getSubjectById(
          data.subjectId,
          userId,
        );
        subjectId = subject.id;

        // Get notes to process
        if (data.noteIds && data.noteIds.length > 0) {
          // Use selected notes
          selectedNoteIds = data.noteIds;
          const notes = await prisma.note.findMany({
            where: {
              id: { in: data.noteIds },
              subjectId: data.subjectId,
            },
            select: {
              id: true,
              rawContent: true,
              knowledgeBase: true,
            },
          });

          if (notes.length !== data.noteIds.length) {
            throw new InvalidInputError("One or more selected notes not found");
          }

          // Use knowledgeBase if available (from PDF/image uploads), otherwise use rawContent
          contentToProcess = notes
            .map((n) => n.knowledgeBase || n.rawContent)
            .join("\n\n---\n\n");
        } else {
          // Use all notes in subject
          const notes = await prisma.note.findMany({
            where: { subjectId: data.subjectId },
            select: {
              id: true,
              rawContent: true,
              knowledgeBase: true,
            },
          });

          if (notes.length === 0) {
            throw new InvalidInputError("No notes found in subject");
          }

          selectedNoteIds = notes.map((n) => n.id);
          // Use knowledgeBase if available (from PDF/image uploads), otherwise use rawContent
          contentToProcess = notes
            .map((n) => n.knowledgeBase || n.rawContent)
            .join("\n\n---\n\n");
        }
      } else if (data.source === "SINGLE_NOTE") {
        if (!data.noteId) {
          throw new InvalidInputError(
            "Note ID is required for SINGLE_NOTE source",
          );
        }

        // Verify note ownership and get note data
        const note = await noteService.getNoteById(data.noteId, userId);
        noteId = note.id;
        // Use knowledgeBase if available (from PDF/image uploads), otherwise use rawContent
        contentToProcess = note.knowledgeBase || note.rawContent;
      } else {
        throw new InvalidInputError("Invalid source type");
      }

      // Validate that we have content to process
      if (!contentToProcess || contentToProcess.trim().length === 0) {
        throw new InvalidInputError(
          "No content available to generate learning tool. Please ensure your notes have content.",
        );
      }

      // Process with AI service based on type
      let generatedContent: string;
      try {
        generatedContent = await aiService.generateLearningTool(
          data.type,
          contentToProcess,
          {
            questionCount: data.questionCount,
            difficulty: data.difficulty,
            cardCount: data.cardCount,
            summaryLength: data.summaryLength,
            summaryType: data.summaryType,
          },
        );
      } catch (aiError) {
        console.error("AI Service Error:", aiError);
        // Re-throw AI errors immediately to preserve the error message
        throw aiError;
      }

      // Create learning tool and increment AI usage in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const learningTool = await tx.learningTool.create({
          data: {
            type: data.type,
            source: data.source,
            subjectId,
            noteId,
            generatedContent,
          },
        });

        // If subject-level with multiple notes, create junction records
        if (data.source === "SUBJECT" && selectedNoteIds.length > 0) {
          await tx.learningToolNote.createMany({
            data: selectedNoteIds.map((nId) => ({
              learningToolId: learningTool.id,
              noteId: nId,
            })),
          });
        }

        return learningTool;
      });

      // Fetch the complete learning tool with relations
      return this.getLearningToolById(result.id, userId);
    } catch (error) {
      console.error("Learning tool service error:", error instanceof Error ? error.message : String(error));

      // Re-throw known error types to preserve error messages
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError ||
        error instanceof AIUsageLimitExceededError ||
        error instanceof InvalidInputError ||
        error instanceof AIProcessingError
      ) {
        throw error;
      }

      // Check if it's an error with AI_PROCESSING_ERROR code (in case instanceof doesn't work)
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "AI_PROCESSING_ERROR"
      ) {
        throw error;
      }

      // For other errors, preserve the original error message
      if (error instanceof Error) {
        throw new DatabaseError(
          error.message || "Failed to generate learning tool",
          error,
        );
      }

      // For unknown error types
      throw new DatabaseError("Failed to generate learning tool", error);
    }
  }

  /**
   * Delete a learning tool
   */
  async deleteLearningTool(
    learningToolId: string,
    userId: string,
  ): Promise<void> {
    try {
      // Verify ownership
      await this.getLearningToolById(learningToolId, userId);

      // Delete learning tool
      await prisma.learningTool.delete({
        where: { id: learningToolId },
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError(
        "Failed to delete learning tool",
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Generate learning tool using knowledge base (new workflow)
   * Uses knowledge base chunks and Kimi K2.5 for generation
   */
  async generateLearningToolWithKB(
    userId: string,
    data: GenerateLearningToolRequest,
  ): Promise<LearningToolDto> {
    try {
      let noteIds: string[] = [];
      let subjectId: string | undefined;
      let noteId: string | undefined;

      // Step 1: Determine which notes to use
      if (data.source === "SUBJECT") {
        if (!data.subjectId) {
          throw new InvalidInputError(
            "Subject ID is required for SUBJECT source"
          );
        }

        // Verify subject ownership
        const subject = await subjectService.getSubjectById(
          data.subjectId,
          userId
        );
        subjectId = subject.id;

        // Get notes
        if (data.noteIds && data.noteIds.length > 0) {
          noteIds = data.noteIds;
        } else {
          // Use all notes in subject
          const notes = await prisma.note.findMany({
            where: { subjectId: data.subjectId },
            select: { id: true },
          });
          noteIds = notes.map((n) => n.id);
        }

        if (noteIds.length === 0) {
          throw new InvalidInputError("No notes found in subject");
        }
      } else if (data.source === "SINGLE_NOTE") {
        if (!data.noteId) {
          throw new InvalidInputError(
            "Note ID is required for SINGLE_NOTE source"
          );
        }

        // Verify note ownership
        const note = await noteService.getNoteById(data.noteId, userId);
        noteId = note.id;
        noteIds = [note.id];
      } else {
        throw new InvalidInputError("Invalid source type");
      }

      // Step 2: Check if knowledge bases exist
      const kbReady = await knowledgeBaseService.areKnowledgeBasesReady(
        noteIds
      );

      if (!kbReady) {
        throw new AIProcessingError(
          "Notes must be processed first. Please wait for processing to complete."
        );
      }

      // Step 3: Retrieve chunks from knowledge base

      // Define query context based on learning tool type
      const queryContextMap = {
        QUIZ: "questions, problems, concepts to test understanding",
        FLASHCARDS: "key concepts, definitions, important facts for memorization",
        SUMMARY: "main topics, key points, essential information",
        ORGANIZED_NOTE: "all content, structure, relationships between concepts",
      };

      const queryContext = queryContextMap[data.type];
      const useSemanticSearch = data.type !== "ORGANIZED_NOTE"; // Use all chunks for organized notes

      let chunks;
      if (useSemanticSearch && queryContext) {
        // Semantic search for targeted retrieval
        chunks = await knowledgeBaseService.semanticSearch({
          noteIds,
          queryText: queryContext,
          maxChunks: 30,
          similarityThreshold: 0.6,
        });
      } else {
        // Get all chunks for comprehensive processing
        chunks = await knowledgeBaseService.retrieveAllChunks(noteIds);
      }

      if (chunks.length === 0) {
        throw new InvalidInputError(
          "No content available in knowledge base. Please ensure notes are processed."
        );
      }

      // Step 4: Format chunks for AI generation
      const aggregatedContent = chunks
        .map((chunk) => {
          const header = chunk.heading
            ? `## ${chunk.heading}\n\n`
            : chunk.pageNumber
            ? `[Page ${chunk.pageNumber}]\n\n`
            : "";
          return header + chunk.content;
        })
        .join("\n\n---\n\n");

      // Step 5: Generate content with Kimi K2.5 (if configured) or fallback to existing AI
      let generatedContent: string;

      try {
        if (kimiService.isConfigured()) {
          // Use Kimi K2.5 for generation
          let result;

          switch (data.type) {
            case "ORGANIZED_NOTE":
              result = await kimiService.generateStructuredNotes(
                aggregatedContent,
                { subject: subjectId }
              );
              generatedContent = JSON.stringify(result);
              break;

            case "QUIZ":
              result = await kimiService.generateQuiz(aggregatedContent, {
                questionCount: data.questionCount,
                difficulty: data.difficulty,
              });
              generatedContent = JSON.stringify(result);
              break;

            case "FLASHCARDS":
              result = await kimiService.generateFlashcards(aggregatedContent, {
                count: data.cardCount,
                difficulty: data.difficulty,
              });
              generatedContent = JSON.stringify(result);
              break;

            case "SUMMARY":
              // Map summaryType to valid values for Kimi service
              const validSummaryType = 
                data.summaryType === "paragraph" || data.summaryType === "keypoints" 
                  ? "comprehensive" 
                  : (data.summaryType || "comprehensive");
              result = await kimiService.generateSummary(
                aggregatedContent,
                validSummaryType as "brief" | "comprehensive" | "bullet"
              );
              generatedContent = JSON.stringify(result);
              break;

            default:
              throw new InvalidInputError(`Unsupported learning tool type: ${data.type}`);
          }
        } else {
          // Fallback to existing AI service
          generatedContent = await aiService.generateLearningTool(
            data.type,
            aggregatedContent,
            {
              questionCount: data.questionCount,
              difficulty: data.difficulty,
              cardCount: data.cardCount,
              summaryLength: data.summaryLength,
              summaryType: data.summaryType,
            }
          );
        }
      } catch (aiError) {
        console.error("AI Generation Error:", aiError);
        throw aiError;
      }

      // Step 6: Track knowledge base usage
      await knowledgeBaseService.trackUsage(noteIds);

      // Step 7: Store learning tool
      const result = await prisma.$transaction(async (tx) => {
        const learningTool = await tx.learningTool.create({
          data: {
            type: data.type,
            source: data.source,
            subjectId,
            noteId,
            generatedContent,
          },
        });

        // Create junction records for multiple notes
        if (noteIds.length > 1) {
          await tx.learningToolNote.createMany({
            data: noteIds.map((nId) => ({
              learningToolId: learningTool.id,
              noteId: nId,
            })),
          });
        }

        return learningTool;
      });

      // Return complete learning tool
      return this.getLearningToolById(result.id, userId);
    } catch (error) {
      console.error("Learning tool generation error:", error);

      // Re-throw known error types
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError ||
        error instanceof AIUsageLimitExceededError ||
        error instanceof InvalidInputError ||
        error instanceof AIProcessingError
      ) {
        throw error;
      }

      // Preserve error message
      if (error instanceof Error) {
        throw new DatabaseError(
          error.message || "Failed to generate learning tool",
          error
        );
      }

      throw new DatabaseError("Failed to generate learning tool", error);
    }
  }
}

export const learningToolService = new LearningToolService();
