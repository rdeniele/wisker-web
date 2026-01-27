"use client";
import React from "react";
import { useSubscription } from "@/hook/useSubscription";

export function CreditsDisplay() {
  const { subscription, loading, error } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error || !subscription) {
    return null;
  }

  const percentage =
    (subscription.creditsRemaining / subscription.dailyCredits) * 100;
  const isLow = percentage < 20;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <svg className="w-8 h-8" viewBox="0 0 32 32">
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke={isLow ? "#ef4444" : "#fb923c"}
            strokeWidth="3"
            strokeDasharray={`${percentage * 0.88} 88`}
            strokeLinecap="round"
            transform="rotate(-90 16 16)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-700">
            {subscription.creditsRemaining}
          </span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-700">
          {subscription.creditsRemaining} / {subscription.dailyCredits}
        </span>
        <span className="text-xs text-gray-500">Daily Credits</span>
      </div>
    </div>
  );
}
