/**
 * Subscription Service
 * Manages user subscription plans, credits, and limits
 */

import { PlanType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Cache for plan configs to avoid repeated database queries
let planConfigsCache: Map<PlanType, any> | null = null;
let planConfigsCacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all plan configurations from the database
 * Results are cached for 5 minutes
 */
async function getPlanConfigs() {
  const now = Date.now();

  // Return cached plans if still valid
  if (planConfigsCache && now - planConfigsCacheTime < CACHE_TTL) {
    return planConfigsCache;
  }

  // Fetch plans from database
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // Build map of plan configs
  const configs = new Map<PlanType, any>();
  for (const plan of plans) {
    configs.set(plan.planType, {
      dailyCredits: plan.dailyCredits,
      notesLimit: plan.notesLimit,
      subjectsLimit: plan.subjectsLimit,
      features: plan.features,
    });
  }

  // Update cache
  planConfigsCache = configs;
  planConfigsCacheTime = now;

  return configs;
}

/**
 * Get a specific plan configuration
 */
async function getPlanConfig(planType: PlanType) {
  const configs = await getPlanConfigs();
  const config = configs.get(planType);

  if (!config) {
    throw new Error(`Plan configuration not found for ${planType}`);
  }

  return config;
}

/**
 * Clear the plan configs cache
 * Call this after updating plan configurations
 */
export function clearPlanConfigsCache() {
  planConfigsCache = null;
  planConfigsCacheTime = 0;
}

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
export async function getUserSubscription(
  userId: string,
): Promise<UserSubscriptionInfo> {
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
    throw new Error("User not found");
  }

  // Ensure user has proper subscription fields initialized
  // If dailyCredits is 0 or undefined, initialize with FREE plan defaults
  if (!user.dailyCredits || user.dailyCredits === 0) {
    const freeConfig = await getPlanConfig("FREE");
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyCredits: freeConfig.dailyCredits,
        creditsUsedToday: 0,
        lastCreditReset: new Date(),
        planType: "FREE",
        notesLimit: freeConfig.notesLimit,
        subjectsLimit: freeConfig.subjectsLimit,
      },
    });

    // Refetch user data after initialization
    const initializedUser = await prisma.user.findUnique({
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

    if (!initializedUser) {
      throw new Error("Failed to initialize user subscription");
    }

    return {
      planType: initializedUser.planType,
      dailyCredits: initializedUser.dailyCredits,
      creditsRemaining: initializedUser.dailyCredits,
      creditsUsedToday: 0,
      subscriptionStatus: initializedUser.subscriptionStatus,
      subscriptionEndDate: initializedUser.subscriptionEndDate,
      isActive: true,
    };
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
    throw new Error("User not found after reset");
  }

  const creditsRemaining =
    updatedUser.dailyCredits - updatedUser.creditsUsedToday;
  const isActive =
    updatedUser.subscriptionStatus === "active" &&
    (!updatedUser.subscriptionEndDate ||
      updatedUser.subscriptionEndDate > new Date());

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
async function resetDailyCreditsIfNeeded(
  userId: string,
  lastReset: Date,
): Promise<void> {
  const now = new Date();
  const hoursSinceReset =
    (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

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
export async function checkCredits(
  userId: string,
  creditsNeeded: number = 1,
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription.creditsRemaining >= creditsNeeded;
}

/**
 * Consume credits for an operation
 */
export async function consumeCredits(
  userId: string,
  creditsToConsume: number = 1,
): Promise<void> {
  const hasCredits = await checkCredits(userId, creditsToConsume);

  if (!hasCredits) {
    throw new Error("Insufficient credits");
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
  period: "monthly" | "yearly",
  paymentSuccessful: boolean = true,
): Promise<void> {
  const config = await getPlanConfig(planType);
  const now = new Date();
  const endDate = new Date(now);

  // Calculate end date based on period
  if (period === "yearly") {
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
      subscriptionStatus: paymentSuccessful ? "active" : "inactive",
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
  await updateSubscriptionPlan(userId, "FREE", "monthly", false);
}

/**
 * Check if user can perform an action based on their plan limits
 */
export async function checkPlanLimit(
  userId: string,
  limitType: "notes" | "subjects",
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
    throw new Error("User not found");
  }

  let current = 0;
  let limit = 0;

  if (limitType === "subjects") {
    current = user._count.subjects;
    limit = user.subjectsLimit;
  } else if (limitType === "notes") {
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
    generate_quiz: 2,
    generate_flashcards: 2,
    generate_concept_map: 3,
    generate_summary: 1,
    process_note: 1,
    analyze_document: 2,
  };

  return costs[operation] || 1;
}
