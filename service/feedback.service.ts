import { prisma } from "@/lib/prisma";
import { AppError, DatabaseError, NotFoundError } from "@/lib/errors";
import { ErrorCode } from "@/types/api";
import {
  FeedbackCategory,
  FeedbackStatus,
  Prisma,
} from "@prisma/client";

// Simple abuse guard: a user can send this many feedback entries per window.
const MAX_FEEDBACK_PER_HOUR = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

export interface CreateFeedbackInput {
  category: FeedbackCategory;
  rating?: number;
  message: string;
}

export interface FeedbackListFilters {
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  search?: string;
  page: number;
  pageSize: number;
}

export interface FeedbackStats {
  total: number;
  byStatus: Record<FeedbackStatus, number>;
  byCategory: Record<FeedbackCategory, number>;
  averageRating: number | null;
  ratedCount: number;
}

export class FeedbackService {
  /**
   * Store feedback from an authenticated user so it shows up in the admin inbox.
   */
  async createFeedback(
    user: { id: string; email: string },
    input: CreateFeedbackInput,
    userAgent?: string | null,
  ) {
    try {
      const recent = await prisma.feedback.count({
        where: {
          userId: user.id,
          createdAt: { gte: new Date(Date.now() - RATE_WINDOW_MS) },
        },
      });

      if (recent >= MAX_FEEDBACK_PER_HOUR) {
        throw new AppError(
          ErrorCode.LIMIT_EXCEEDED,
          "You've sent a lot of feedback in a short time. Please try again later.",
          429,
        );
      }

      return await prisma.feedback.create({
        data: {
          userId: user.id,
          email: user.email,
          category: input.category,
          rating: input.rating ?? null,
          message: input.message,
          userAgent: userAgent ? userAgent.slice(0, 300) : null,
        },
        select: { id: true, createdAt: true },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new DatabaseError("Failed to save feedback", error);
    }
  }

  /**
   * Paginated admin inbox, newest first, with optional filters.
   */
  async listFeedback(filters: FeedbackListFilters) {
    const { status, category, search, page, pageSize } = filters;

    const where: Prisma.FeedbackWhereInput = {
      ...(status && { status }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { message: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { adminNotes: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    try {
      const [items, total] = await Promise.all([
        prisma.feedback.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.feedback.count({ where }),
      ]);

      return { items, total, page, pageSize };
    } catch (error) {
      throw new DatabaseError("Failed to load feedback", error);
    }
  }

  /**
   * Counts for the admin dashboard and inbox header (not affected by filters).
   */
  async getStats(): Promise<FeedbackStats> {
    try {
      const [byStatusRows, byCategoryRows, ratingAgg] = await Promise.all([
        prisma.feedback.groupBy({ by: ["status"], _count: true }),
        prisma.feedback.groupBy({ by: ["category"], _count: true }),
        prisma.feedback.aggregate({
          where: { rating: { not: null } },
          _avg: { rating: true },
          _count: { rating: true },
        }),
      ]);

      const byStatus = {
        NEW: 0,
        REVIEWED: 0,
        PLANNED: 0,
        DONE: 0,
        DISMISSED: 0,
      } satisfies Record<FeedbackStatus, number>;
      for (const row of byStatusRows) byStatus[row.status] = row._count;

      const byCategory = {
        BUG: 0,
        FEATURE_REQUEST: 0,
        IMPROVEMENT: 0,
        PRAISE: 0,
        OTHER: 0,
      } satisfies Record<FeedbackCategory, number>;
      for (const row of byCategoryRows) byCategory[row.category] = row._count;

      const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

      return {
        total,
        byStatus,
        byCategory,
        averageRating: ratingAgg._avg.rating,
        ratedCount: ratingAgg._count.rating,
      };
    } catch (error) {
      throw new DatabaseError("Failed to load feedback stats", error);
    }
  }

  /**
   * Admin triage: change status and/or attach internal notes.
   */
  async updateFeedback(
    id: string,
    data: { status?: FeedbackStatus; adminNotes?: string | null },
  ) {
    try {
      return await prisma.feedback.update({
        where: { id },
        data: {
          ...(data.status !== undefined && { status: data.status }),
          ...(data.adminNotes !== undefined && {
            adminNotes: data.adminNotes?.trim() || null,
          }),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundError("Feedback");
      }
      throw new DatabaseError("Failed to update feedback", error);
    }
  }

  async deleteFeedback(id: string) {
    try {
      await prisma.feedback.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundError("Feedback");
      }
      throw new DatabaseError("Failed to delete feedback", error);
    }
  }
}

export const feedbackService = new FeedbackService();
