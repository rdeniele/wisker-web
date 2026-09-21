/**
 * Client-safe feedback constants (no @prisma/client import, so this can be
 * used from both the user form and the admin inbox).
 */

export const FEEDBACK_CATEGORIES = [
  "BUG",
  "FEATURE_REQUEST",
  "IMPROVEMENT",
  "PRAISE",
  "OTHER",
] as const;
export type FeedbackCategoryValue = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_STATUSES = [
  "NEW",
  "REVIEWED",
  "PLANNED",
  "DONE",
  "DISMISSED",
] as const;
export type FeedbackStatusValue = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategoryValue, string> = {
  BUG: "Something's broken",
  FEATURE_REQUEST: "Feature idea",
  IMPROVEMENT: "Make it better",
  PRAISE: "Something I love",
  OTHER: "Something else",
};

/** Short labels for admin tables and filters. */
export const FEEDBACK_CATEGORY_SHORT: Record<FeedbackCategoryValue, string> = {
  BUG: "Bug",
  FEATURE_REQUEST: "Feature",
  IMPROVEMENT: "Improvement",
  PRAISE: "Praise",
  OTHER: "Other",
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatusValue, string> = {
  NEW: "New",
  REVIEWED: "Reviewed",
  PLANNED: "Planned",
  DONE: "Done",
  DISMISSED: "Dismissed",
};

export const FEEDBACK_MESSAGE_MIN = 10;
export const FEEDBACK_MESSAGE_MAX = 2000;
