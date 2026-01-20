import { prisma } from '../src/lib/prisma';
import {
  NotFoundError,
  AIUsageLimitExceededError,
  DatabaseError,
  ForbiddenError,
  InvalidInputError,
} from '../src/lib/errors';
import {
  GenerateLearningToolRequest,
  LearningToolDto,
} from '../src/types/api';
import { subjectService } from './subject.service';
import { noteService } from './note.service';
import { aiService } from './ai.service';
import { LearningToolType, LearningToolSource, Prisma } from '@prisma/client';

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
      sortBy?: 'createdAt';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    try {
      const {
        subjectId,
        noteId,
        type,
        source,
        page = 1,
        pageSize = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const skip = (page - 1) * pageSize;

      // Build where clause with user ownership verification
      const where: Prisma.LearningToolWhereInput = {
        OR: [
          { subject: { userId } },
          { note: { subject: { userId } } },
        ],
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
      throw new DatabaseError('Failed to fetch learning tools', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Get a single learning tool by ID
   */
  async getLearningToolById(
    learningToolId: string,
    userId: string
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
        throw new NotFoundError('Learning tool');
      }

      // Verify ownership
      const ownerUserId =
        learningTool.subject?.userId ||
        learningTool.note?.subject?.userId;

      if (ownerUserId !== userId) {
        throw new ForbiddenError('You do not have access to this learning tool');
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
      throw new DatabaseError('Failed to fetch learning tool', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Generate a new learning tool
   */
  async generateLearningTool(
    userId: string,
    data: GenerateLearningToolRequest
  ): Promise<LearningToolDto> {
    try {
      // Check AI usage limit
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          aiUsageCount: true,
          aiUsageLimit: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      if (user.aiUsageCount >= user.aiUsageLimit) {
        throw new AIUsageLimitExceededError(user.aiUsageLimit);
      }

      // Validate and fetch content based on source
      let contentToProcess: string;
      let subjectId: string | undefined;
      let noteId: string | undefined;
      let selectedNoteIds: string[] = [];

      if (data.source === 'SUBJECT') {
        if (!data.subjectId) {
          throw new InvalidInputError('Subject ID is required for SUBJECT source');
        }

        // Verify subject ownership
        const subject = await subjectService.getSubjectById(data.subjectId, userId);
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
            throw new InvalidInputError('One or more selected notes not found');
          }

          // Use knowledgeBase if available (from PDF/image uploads), otherwise use rawContent
          contentToProcess = notes.map((n) => n.knowledgeBase || n.rawContent).join('\n\n---\n\n');
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
            throw new InvalidInputError('No notes found in subject');
          }

          selectedNoteIds = notes.map((n) => n.id);
          // Use knowledgeBase if available (from PDF/image uploads), otherwise use rawContent
          contentToProcess = notes.map((n) => n.knowledgeBase || n.rawContent).join('\n\n---\n\n');
        }
      } else if (data.source === 'SINGLE_NOTE') {
        if (!data.noteId) {
          throw new InvalidInputError('Note ID is required for SINGLE_NOTE source');
        }

        // Verify note ownership and get note data
        const note = await noteService.getNoteById(data.noteId, userId);
        noteId = note.id;
        // Use knowledgeBase if available (from PDF/image uploads), otherwise use rawContent
        contentToProcess = note.knowledgeBase || note.rawContent;
      } else {
        throw new InvalidInputError('Invalid source type');
      }

      // Process with AI service based on type
      const generatedContent = await aiService.generateLearningTool(
        data.type,
        contentToProcess,
        {
          questionCount: data.questionCount,
          difficulty: data.difficulty,
          cardCount: data.cardCount,
        }
      );

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
        if (data.source === 'SUBJECT' && selectedNoteIds.length > 0) {
          await tx.learningToolNote.createMany({
            data: selectedNoteIds.map((nId) => ({
              learningToolId: learningTool.id,
              noteId: nId,
            })),
          });
        }

        // Increment AI usage
        await tx.user.update({
          where: { id: userId },
          data: { aiUsageCount: { increment: 1 } },
        });

        return learningTool;
      });

      // Fetch the complete learning tool with relations
      return this.getLearningToolById(result.id, userId);
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError ||
        error instanceof AIUsageLimitExceededError ||
        error instanceof InvalidInputError
      ) {
        throw error;
      }
      throw new DatabaseError('Failed to generate learning tool', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Delete a learning tool
   */
  async deleteLearningTool(
    learningToolId: string,
    userId: string
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
      throw new DatabaseError('Failed to delete learning tool', error instanceof Error ? error : undefined);
    }
  }
}

export const learningToolService = new LearningToolService();
