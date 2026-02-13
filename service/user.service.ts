import { prisma } from "@/lib/prisma";
import { NotFoundError, DatabaseError } from "@/lib/errors";
import { UserDto, UsageStats } from "@/types/api";
import { PlanType } from "@prisma/client";

const PLAN_LIMITS = {
  FREE: {
    notesLimit: 25,
    subjectsLimit: 5,
    dailyCredits: 10, // 10 daily credits (fur real)
  },
  PRO: {
    notesLimit: 300,
    subjectsLimit: 30,
    dailyCredits: 300, // 300 daily credits (no cap)
  },
  PREMIUM: {
    notesLimit: -1, // Unlimited
    subjectsLimit: -1, // Unlimited
    dailyCredits: 1500, // 1500 daily credits (max catitude)
  },
};

export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserDto> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError("User");
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("Failed to fetch user", error);
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserDto | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      return user;
    } catch (error) {
      throw new DatabaseError("Failed to fetch user", error);
    }
  }

  /**
   * Create a new user
   */
  async createUser(
    email: string,
    planType: PlanType = "FREE",
    userId?: string,
    acceptedTerms?: boolean,
    acceptedPrivacy?: boolean,
  ): Promise<UserDto> {
    try {
      const limits = PLAN_LIMITS[planType];
      const now = new Date();

      const user = await prisma.user.create({
        data: {
          ...(userId && { id: userId }), // Use provided ID if available (for Supabase sync)
          email,
          planType,
          notesLimit: limits.notesLimit,
          subjectsLimit: limits.subjectsLimit,
          dailyCredits: limits.dailyCredits,
          ...(acceptedTerms !== undefined && {
            acceptedTerms,
            termsAcceptedAt: acceptedTerms ? now : null,
          }),
          ...(acceptedPrivacy !== undefined && {
            acceptedPrivacy,
            privacyAcceptedAt: acceptedPrivacy ? now : null,
          }),
        },
      });

      return user;
    } catch (error) {
      throw new DatabaseError("Failed to create user", error);
    }
  }

  /**
   * Update user's plan
   */
  async updateUserPlan(userId: string, planType: PlanType): Promise<UserDto> {
    try {
      const user = await this.getUserById(userId);
      const limits = PLAN_LIMITS[planType];

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          planType,
          notesLimit: limits.notesLimit,
          subjectsLimit: limits.subjectsLimit,
          dailyCredits: limits.dailyCredits,
          // Optionally reset AI usage count when upgrading
          ...(planType !== user.planType && { creditsUsedToday: 0 }),
        },
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("Failed to update user plan", error);
    }
  }

  /**
   * Get user usage statistics
   */
  async getUserUsageStats(userId: string): Promise<UsageStats> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          notesLimit: true,
          subjectsLimit: true,
          dailyCredits: true,
          creditsUsedToday: true,
          _count: {
            select: {
              subjects: true,
            },
          },
          subjects: {
            select: {
              _count: {
                select: {
                  notes: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError("User");
      }

      const totalNotes = user.subjects.reduce(
        (sum: number, subject: { _count: { notes: number } }) => sum + subject._count.notes,
        0,
      );

      return {
        notesUsed: totalNotes,
        notesLimit: user.notesLimit,
        subjectsUsed: user._count.subjects,
        subjectsLimit: user.subjectsLimit,
        aiUsageCount: user.creditsUsedToday,
        aiUsageLimit: user.dailyCredits,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("Failed to fetch user usage stats", error);
    }
  }

  /**
   * Reset AI usage count (typically called on a schedule, e.g., monthly)
   */
  async resetAIUsage(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { creditsUsedToday: 0 },
      });
    } catch (error) {
      throw new DatabaseError("Failed to reset AI usage", error);
    }
  }

  /**
   * Delete user and all associated data
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.getUserById(userId);

      // Cascade delete will handle subjects, notes, and learning tools
      await prisma.user.delete({
        where: { id: userId },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("Failed to delete user", error);
    }
  }
}

export const userService = new UserService();
