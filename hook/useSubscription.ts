import { useState, useEffect } from "react";
import { PlanType } from "@prisma/client";

export interface SubscriptionInfo {
  planType: PlanType;
  dailyCredits: number;
  creditsRemaining: number;
  creditsUsedToday: number;
  subscriptionStatus: string | null;
  subscriptionEndDate: Date | null;
  isActive: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/subscription/status");
      const data = await response.json();

      if (data.success) {
        setSubscription(data.data);
        setError(null);
      } else {
        setError(data.error || "Failed to load subscription");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load subscription",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const refresh = () => {
    fetchSubscription();
  };

  return {
    subscription,
    loading,
    error,
    refresh,
  };
}
