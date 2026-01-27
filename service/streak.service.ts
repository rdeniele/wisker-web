/**
 * Streak Service
 * Handles user activity streaks and tracking
 */

import { prisma } from "@/lib/prisma";

/**
 * Record user activity and update streak
 */
export async function recordActivity(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastActivityDate: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get last activity date at midnight
  const lastActivity = user.lastActivityDate
    ? new Date(
        user.lastActivityDate.getFullYear(),
        user.lastActivityDate.getMonth(),
        user.lastActivityDate.getDate(),
      )
    : null;

  // Calculate days difference
  const daysDiff = lastActivity
    ? Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
      )
    : -1;

  let newStreak = user.currentStreak;

  if (daysDiff === 0) {
    // Same day - no change to streak
    return;
  } else if (daysDiff === 1) {
    // Consecutive day - increment streak
    newStreak = user.currentStreak + 1;
  } else {
    // Streak broken - start new streak at 1
    newStreak = 1;
  }

  // Update longest streak if current is higher
  const newLongestStreak = Math.max(newStreak, user.longestStreak);

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: now,
    },
  });
}

/**
 * Get user's streak data
 */
export async function getStreakData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastActivityDate: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if streak should be reset (no activity yesterday or today)
  if (user.lastActivityDate) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActivity = new Date(
      user.lastActivityDate.getFullYear(),
      user.lastActivityDate.getMonth(),
      user.lastActivityDate.getDate(),
    );

    const daysDiff = Math.floor(
      (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
    );

    // If more than 1 day has passed, streak is broken
    if (daysDiff > 1) {
      await prisma.user.update({
        where: { id: userId },
        data: { currentStreak: 0 },
      });

      return {
        currentStreak: 0,
        longestStreak: user.longestStreak,
        lastActivityDate: user.lastActivityDate,
      };
    }
  }

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastActivityDate: user.lastActivityDate,
  };
}
