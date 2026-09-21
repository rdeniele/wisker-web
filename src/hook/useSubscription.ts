import { useState, useEffect } from "react";
import { PlanType } from "@prisma/client";
import { fetchJsonOnce } from "@/lib/dedupe-fetch";

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

  const fetchSubscription = async (force = false) => {
    try {
      setLoading(true);
      // Several components mount this hook at once; share one request.
      const { json } = await fetchJsonOnce("/api/subscription/status", { force });
      const data = (json ?? {}) as {
        success?: boolean;
        data?: SubscriptionInfo;
        error?: string;
      };

      if (data.success && data.data) {
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

  return { subscription, loading, error, refresh: () => fetchSubscription(true) };
}
