/**
 * Subscription Service
 * Manages user subscription plans, credits, and limits
 */

import { PlanType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Plan configurations
export const PLAN_CONFIGS = {
  FREE: {
    dailyCredits: 10,
    notesLimit: 50,
    subjectsLimit: 10,
    features: [
      'AI Cat Quizzes',
      'AI Flashcat Cards',
      'AI Cat-nnected Concept Maps',
    ],
  },
  PRO: {
    dailyCredits: 1000,
    notesLimit: 500,
    subjectsLimit: 100,
    features: [
      'AI Cat Quizzes',
      'AI Flashcat Cards',
      'AI Cat-nnected Concept Maps',
      'Catnap Study Schedules',
      'Advanced analytics',
      'Priority support',
    ],
  },
  PREMIUM: {
    dailyCredits: 4000,
    notesLimit: -1, // Unlimited
    subjectsLimit: -1, // Unlimited
    features: [
      'All Pro perks',
      'Early access to new drops',
      'Dedicated Cat Manager',
      'Custom integrations',
    ],
  },
} as const;

export interface UserSubscriptionInfo {
  planType: PlanType;
  dailyCredits: number;
  creditsRemaining: number;
  creditsUsedToday: number;
  subscriptionStatus: string | null;
  subscriptionEndDate: Date | null;
  isActive: boolean;
}

/**
 * Get user's current subscription information
 */
export async function getUserSubscription(userId: string): Promise<UserSubscriptionInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planType: true,
      dailyCredits: true,
      creditsUsedToday: true,
      lastCreditReset: true,
      subscriptionStatus: true,
      subscriptionEndDate: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Reset daily credits if needed
  await resetDailyCreditsIfNeeded(userId, user.lastCreditReset);

  // Refresh user data after potential reset
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planType: true,
      dailyCredits: true,
      creditsUsedToday: true,
      subscriptionStatus: true,
      subscriptionEndDate: true,
    },
  });

  if (!updatedUser) {
    throw new Error('User not found after reset');
  }

  const creditsRemaining = updatedUser.dailyCredits - updatedUser.creditsUsedToday;
  const isActive = 
    updatedUser.subscriptionStatus === 'active' &&
    (!updatedUser.subscriptionEndDate || updatedUser.subscriptionEndDate > new Date());

  return {
    planType: updatedUser.planType,
    dailyCredits: updatedUser.dailyCredits,
    creditsRemaining: Math.max(0, creditsRemaining),
    creditsUsedToday: updatedUser.creditsUsedToday,
    subscriptionStatus: updatedUser.subscriptionStatus,
    subscriptionEndDate: updatedUser.subscriptionEndDate,
    isActive,
  };
}

/**
 * Reset daily credits if 24 hours have passed
 */
async function resetDailyCreditsIfNeeded(userId: string, lastReset: Date): Promise<void> {
  const now = new Date();
  const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

  if (hoursSinceReset >= 24) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        creditsUsedToday: 0,
        lastCreditReset: now,
      },
    });
  }
}

/**
 * Check if user has enough credits for an operation
 */
export async function checkCredits(userId: string, creditsNeeded: number = 1): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription.creditsRemaining >= creditsNeeded;
}

/**
 * Consume credits for an operation
 */
export async function consumeCredits(userId: string, creditsToConsume: number = 1): Promise<void> {
  const hasCredits = await checkCredits(userId, creditsToConsume);
  
  if (!hasCredits) {
    throw new Error('Insufficient credits');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      creditsUsedToday: {
        increment: creditsToConsume,
      },
    },
  });
}

/**
 * Update user's subscription plan
 */
export async function updateSubscriptionPlan(
  userId: string,
  planType: PlanType,
  period: 'monthly' | 'yearly',
  paymentSuccessful: boolean = true
): Promise<void> {
  const config = PLAN_CONFIGS[planType];
  const now = new Date();
  const endDate = new Date(now);
  
  // Calculate end date based on period
  if (period === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      planType,
      dailyCredits: config.dailyCredits,
      notesLimit: config.notesLimit,
      subjectsLimit: config.subjectsLimit,
      subscriptionStatus: paymentSuccessful ? 'active' : 'inactive',
      subscriptionPeriod: period,
      subscriptionStartDate: paymentSuccessful ? now : undefined,
      subscriptionEndDate: paymentSuccessful ? endDate : undefined,
      creditsUsedToday: 0,
      lastCreditReset: now,
    },
  });
}

/**
 * Cancel user's subscription (downgrade to FREE)
 */
export async function cancelSubscription(userId: string): Promise<void> {
  await updateSubscriptionPlan(userId, 'FREE', 'monthly', false);
}

/**
 * Check if user can perform an action based on their plan limits
 */
export async function checkPlanLimit(
  userId: string,
  limitType: 'notes' | 'subjects'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planType: true,
      notesLimit: true,
      subjectsLimit: true,
      _count: {
        select: {
          subjects: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  let current = 0;
  let limit = 0;

  if (limitType === 'subjects') {
    current = user._count.subjects;
    limit = user.subjectsLimit;
  } else if (limitType === 'notes') {
    // Count all notes across all subjects
    const noteCount = await prisma.note.count({
      where: {
        subject: {
          userId,
        },
      },
    });
    current = noteCount;
    limit = user.notesLimit;
  }

  // -1 means unlimited
  const allowed = limit === -1 || current < limit;

  return { allowed, current, limit };
}

/**
 * Get credit cost for different operations
 */
export function getOperationCost(operation: string): number {
  const costs: Record<string, number> = {
    'generate_quiz': 2,
    'generate_flashcards': 2,
    'generate_concept_map': 3,
    'generate_summary': 1,
    'process_note': 1,
    'analyze_document': 2,
  };

  return costs[operation] || 1;
}
