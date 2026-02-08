import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  SubjectsLimitExceededError,
  DatabaseError,
  ForbiddenError,
} from "@/lib/errors";
import {
  CreateSubjectRequest,
  UpdateSubjectRequest,
  SubjectDto,
} from "@/types/api";

export class SubjectService {
  /**
   * Get all subjects for a user with pagination and search
   */
  async getUserSubjects(
    userId: string,
    options: {
      page?: number;
      pageSize?: number;
      search?: string;
      sortBy?: "createdAt" | "updatedAt" | "title";
      sortOrder?: "asc" | "desc";
    } = {},
  ) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      const skip = (page - 1) * pageSize;

      const where = {
        userId,
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [subjects, total] = await Promise.all([
        prisma.subject.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
          include: {
            _count: {
              select: {
                notes: true,
                learningTools: true,
              },
            },
            notes: {
              select: {
                id: true,
                title: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        }),
        prisma.subject.count({ where }),
      ]);

      return {
        subjects,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      throw new DatabaseError("Failed to fetch subjects", error);
    }
  }

  /**
   * Get a single subject by ID
   */
  async getSubjectById(subjectId: string, userId: string): Promise<SubjectDto> {
    try {
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: {
          _count: {
            select: {
              notes: true,
              learningTools: true,
            },
          },
        },
      });

      if (!subject) {
        throw new NotFoundError("Subject");
      }

      // Verify ownership
      if (subject.userId !== userId) {
        throw new ForbiddenError("You do not have access to this subject");
      }

      return {
        ...subject,
        description: subject.description ?? undefined,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError("Failed to fetch subject", error);
    }
  }

  /**
   * Create a new subject
   */
  async createSubject(
    userId: string,
    data: CreateSubjectRequest,
  ): Promise<SubjectDto> {
    try {
      // Check user's subject limit
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          subjectsLimit: true,
          _count: {
            select: { subjects: true },
          },
        },
      });

      if (!user) {
        throw new NotFoundError("User");
      }

      if (user._count.subjects >= user.subjectsLimit) {
        throw new SubjectsLimitExceededError(user.subjectsLimit);
      }

      // Create subject
      const subject = await prisma.subject.create({
        data: {
          userId,
          title: data.title,
          description: data.description,
        },
        include: {
          _count: {
            select: {
              notes: true,
              learningTools: true,
            },
          },
        },
      });

      return {
        ...subject,
        description: subject.description ?? undefined,
      };
    } catch (error) {
      if (
        error instanceof SubjectsLimitExceededError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      throw new DatabaseError("Failed to create subject", error);
    }
  }

  /**
   * Update a subject
   */
  async updateSubject(
    subjectId: string,
    userId: string,
    data: UpdateSubjectRequest,
  ): Promise<SubjectDto> {
    try {
      // Verify ownership
      await this.getSubjectById(subjectId, userId);

      // Update subject
      const subject = await prisma.subject.update({
        where: { id: subjectId },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
        },
        include: {
          _count: {
            select: {
              notes: true,
              learningTools: true,
            },
          },
        },
      });

      return {
        ...subject,
        description: subject.description ?? undefined,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError("Failed to update subject", error);
    }
  }

  /**
   * Delete a subject
   */
  async deleteSubject(subjectId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      await this.getSubjectById(subjectId, userId);

      // Delete subject (cascade will delete notes and learning tools)
      await prisma.subject.delete({
        where: { id: subjectId },
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError("Failed to delete subject", error);
    }
  }

  /**
   * Get subject statistics
   */
  async getSubjectStats(subjectId: string, userId: string) {
    try {
      await this.getSubjectById(subjectId, userId);

      const [notesCount, learningToolsCount, recentActivity] =
        await Promise.all([
          prisma.note.count({ where: { subjectId } }),
          prisma.learningTool.count({ where: { subjectId } }),
          prisma.note.findMany({
            where: { subjectId },
            orderBy: { updatedAt: "desc" },
            take: 5,
            select: {
              id: true,
              title: true,
              updatedAt: true,
            },
          }),
        ]);

      return {
        notesCount,
        learningToolsCount,
        recentActivity,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError("Failed to fetch subject statistics", error);
    }
  }
}

export const subjectService = new SubjectService();
