"use client";
import React from "react";
import { useSubscription } from "@/hook/useSubscription";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

/**
 * Daily credit meter. A ring plus "remaining / daily" so the cost of the next
 * generation is never a surprise. `compact` hides the label for tight headers.
 */
export function CreditsDisplay({ compact = false }: { compact?: boolean }) {
  const { subscription, loading, error } = useSubscription();

  if (loading) {
    return <Skeleton className="h-11 w-24 rounded-full" />;
  }

  if (error || !subscription) {
    return null;
  }

  const total = subscription.dailyCredits || 1;
  const percentage = Math.max(
    0,
    Math.min(100, (subscription.creditsRemaining / total) * 100),
  );
  const isLow = percentage < 20;
  const circumference = 2 * Math.PI * 14;

  return (
    <div
      className={cn(
        "flex h-11 items-center gap-2.5 rounded-full border bg-white pl-1.5 pr-3.5",
        isLow ? "border-red-200" : "border-line",
      )}
      role="group"
      aria-label={`${subscription.creditsRemaining} of ${subscription.dailyCredits} daily credits remaining`}
      title="Daily credits"
    >
      <svg className="h-8 w-8 shrink-0" viewBox="0 0 32 32" aria-hidden>
        <circle
          cx="16"
          cy="16"
          r="14"
          fill="none"
          stroke="#f0e4d4"
          strokeWidth="4"
        />
        <circle
          cx="16"
          cy="16"
          r="14"
          fill="none"
          stroke={isLow ? "#d04848" : "#f9993a"}
          strokeWidth="4"
          strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 16 16)"
          className="transition-[stroke-dasharray] duration-700"
        />
      </svg>
      <span className="font-display text-[15px] font-semibold leading-none text-ink">
        {subscription.creditsRemaining}
        <span className="text-gray-500">/{subscription.dailyCredits}</span>
      </span>
      {!compact && (
        <span className="hidden text-[13px] font-bold leading-none text-gray-600 xl:inline">
          credits
        </span>
      )}
    </div>
  );
}
