"use client";
import React, { useState, useEffect } from "react";
import { LuCheck } from "react-icons/lu";
import Button from "@/components/ui/button";
import Alert from "@/components/ui/Alert";
import Mascot from "@/components/ui/Mascot";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/contexts/ToastContext";

type BillingPeriod = "yearly" | "monthly";

interface PlanFromDB {
  id: string;
  name: string;
  planType: string;
  displayName: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  dailyCredits: number;
  notesLimit: number;
  subjectsLimit: number;
  features: string[];
  isMostPopular: boolean;
  discountPercent: number | null;
  discountLabel: string | null;
}

interface PricingTier {
  name: string;
  displayName: string;
  price: string;
  originalPrice?: string;
  period: string;
  discount?: string;
  features: string[];
  isCurrentPlan?: boolean;
  isMostPopular?: boolean;
  buttonText: string;
  buttonDisabled?: boolean;
  actualAmount: number;
}

export default function UpgradePage() {
  const { showToast } = useToast();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
  const [loading, setLoading] = useState<string | null>(null);
  const [plansFromDB, setPlansFromDB] = useState<PlanFromDB[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoValidation, setPromoValidation] = useState<{
    isValid: boolean;
    message: string;
    discount?: {
      type: string;
      value: number;
    };
    applicablePlans?: string[];
  } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Fetch plans from API on mount
  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch("/api/plans");
        const data = await response.json();

        if (data.success) {
          setPlansFromDB(data.plans);
        }
      } catch {
        // Error fetching plans
      } finally {
        setLoadingPlans(false);
      }
    }

    fetchPlans();
  }, []);

  // Validate promo code
  const validatePromoCode = async (code: string, planType: string) => {
    if (!code.trim()) {
      setPromoValidation(null);
      return;
    }

    setValidatingPromo(true);
    try {
      const response = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          planType,
        }),
      });

      const data = await response.json();

      if (data.success && data.promoCode) {
        setPromoValidation({
          isValid: true,
          message: data.promoCode.description || "Promo code applied!",
          discount: {
            type: data.promoCode.discountType,
            value: data.promoCode.discountValue,
          },
          applicablePlans: data.promoCode.applicablePlans || [],
        });
      } else {
        setPromoValidation({
          isValid: false,
          message: data.error || "Invalid promo code",
        });
      }
    } catch {
      setPromoValidation({
        isValid: false,
        message: "Failed to validate promo code",
      });
    } finally {
      setValidatingPromo(false);
    }
  };

  // Handle promo code change
  const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase();
    setPromoCode(code);

    // Clear validation when user types
    if (promoValidation) {
      setPromoValidation(null);
    }
  };

  // Handle apply promo code
  const handleApplyPromoCode = () => {
    // We'll validate against PRO plan as default for now
    // In actual checkout, we'll validate against the selected plan
    validatePromoCode(promoCode, "PRO");
  };

  const handleSelectPlan = async (plan: PricingTier) => {
    if (plan.isCurrentPlan || plan.buttonDisabled) return;

    setLoading(plan.displayName);

    try {
      // Check if this is a free promo (price is 0 due to MONTHS_FREE promo)
      const isFreePromo = 
        plan.actualAmount === 0 && 
        promoValidation?.isValid && 
        promoValidation.discount?.type === "MONTHS_FREE";

      if (isFreePromo) {
        // Direct activation for free promo - no payment needed
        const response = await fetch("/api/payments/activate-promo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planName: plan.name, // Use plan.name (planType) not displayName
            billingPeriod: billingPeriod,
            promoCode: promoCode.trim().toUpperCase(),
            monthsFree: promoValidation.discount?.value || 0,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Redirect to success page
          window.location.href = "/upgrade/success?promo=true";
        } else {
          const errorMsg = data.error || "Failed to activate promo. Please try again.";
          showToast(errorMsg, "error");
          setLoading(null);
        }
      } else {
        // Normal payment flow
        const requestBody: {
          planName: string;
          amount: number;
          billingPeriod: BillingPeriod;
          promoCode?: string;
        } = {
          planName: plan.name, // Use plan.name (planType) not displayName
          amount: plan.actualAmount,
          billingPeriod: billingPeriod,
        };

        // Include promo code if valid
        if (promoValidation?.isValid && promoCode.trim()) {
          requestBody.promoCode = promoCode.trim().toUpperCase();
        }

        const response = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (data.success && data.checkoutUrl) {
          // Store session ID in sessionStorage before redirecting
          sessionStorage.setItem("paymongoSessionId", data.sessionId);
          // Redirect to PayMongo checkout page
          window.location.href = data.checkoutUrl;
        } else {
          const errorMsg = data.error || "Failed to create checkout session. Please try again.";
          showToast(errorMsg, "error");
          setLoading(null);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An error occurred. Please try again.";
      showToast(errorMsg, "error");
      setLoading(null);
    }
  };

  // Transform database plans into display format
  const transformPlanForDisplay = (
    plan: PlanFromDB,
    period: BillingPeriod,
  ): PricingTier => {
    const isYearly = period === "yearly";
    let price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const periodLabel = isYearly ? "/year" : "/mo";

    // Calculate original prices if discount exists
    let originalPrice: string | undefined;
    let discount: string | undefined = plan.discountLabel || undefined;

    // Apply promo code discount if valid AND applicable to this plan
    const isPromoApplicable = promoValidation?.isValid && 
      promoValidation.discount &&
      (promoValidation.applicablePlans?.length === 0 || 
       promoValidation.applicablePlans?.includes(plan.planType));

    if (isPromoApplicable) {
      const promoDiscount = promoValidation.discount!;

      if (promoDiscount.type === "PERCENTAGE") {
        originalPrice = `₱${price.toLocaleString()}`;
        price = price * (1 - promoDiscount.value / 100);
        discount = `${promoDiscount.value}% off with promo code`;
      } else if (promoDiscount.type === "FIXED_AMOUNT") {
        originalPrice = `₱${price.toLocaleString()}`;
        price = Math.max(0, price - promoDiscount.value);
        discount = `₱${promoDiscount.value.toLocaleString()} off with promo code`;
      } else if (promoDiscount.type === "MONTHS_FREE") {
        originalPrice = `₱${price.toLocaleString()}`;
        price = 0;
        discount = `First ${promoDiscount.value} months free!`;
      }
    } else if (plan.discountPercent && plan.discountPercent > 0) {
      // Existing plan discount
      const original = price / (1 - plan.discountPercent / 100);
      originalPrice = `₱${original.toLocaleString()}`;
    }

    return {
      name: plan.planType, // Use planType (PRO, PREMIUM) for API calls
      displayName: plan.displayName,
      price: price === 0 ? "Free" : `₱${Math.round(price).toLocaleString()}`,
      originalPrice,
      period: price === 0 ? "" : periodLabel,
      discount,
      features: plan.features,
      isCurrentPlan: plan.planType === "FREE", // TODO: Get from user's current plan
      isMostPopular: plan.isMostPopular,
      buttonText: plan.planType === "FREE" ? "Current Plan" : "Choose Plan",
      buttonDisabled: plan.planType === "FREE",
      actualAmount: Math.round(price),
    };
  };

  // Generate current plans based on billing period
  const currentPlans = plansFromDB.map((plan) =>
    transformPlanForDisplay(plan, billingPeriod),
  );

  // Re-validate promo code when billing period changes
  useEffect(() => {
    if (promoCode.trim() && promoValidation?.isValid) {
      validatePromoCode(promoCode, "PRO");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingPeriod]);

  // Show loading state
  if (loadingPlans) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <LoadingSpinner size="lg" message="Loading plans..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8 text-center sm:mb-12">
        <Mascot name="star" size={96} className="mx-auto" />
        <h1 className="mt-2 text-[2rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
          Choose your plan
        </h1>
        <p className="mt-3 text-base font-semibold text-gray-600 sm:text-lg">
          Upgrade your learning experience with Wisker
        </p>

        {/* Billing Toggle */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div
            role="radiogroup"
            aria-label="Billing period"
            className="inline-flex items-center rounded-full border border-line bg-white p-1 shadow-sm"
          >
            {(["yearly", "monthly"] as const).map((period) => (
              <button
                key={period}
                type="button"
                role="radio"
                aria-checked={billingPeriod === period}
                onClick={() => setBillingPeriod(period)}
                className={`min-h-11 rounded-full px-6 font-display text-base font-semibold capitalize transition-colors ${
                  billingPeriod === period
                    ? "bg-orange-500 text-ink"
                    : "text-gray-600 hover:text-ink"
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Save Badge for Yearly */}
          {billingPeriod === "yearly" && (
            <span className="chip chip-success">Save 20% with annual billing</span>
          )}
        </div>

        {/* Promo Code Input */}
        <div className="mx-auto mt-8 max-w-md text-left">
          <div className="rounded-[24px] border-2 border-dashed border-[#f3d6ae] bg-sand p-4 sm:p-5">
            <h2 className="mb-3 text-lg font-semibold text-ink">Have a promo code?</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={handlePromoCodeChange}
                placeholder="Enter code (e.g., EARLYCAT50)"
                aria-label="Promo code"
                className="field min-w-0 flex-1"
                disabled={validatingPromo}
              />
              <Button
                onClick={handleApplyPromoCode}
                disabled={!promoCode.trim() || validatingPromo}
                isLoading={validatingPromo}
              >
                Apply
              </Button>
            </div>

            {/* Validation Message */}
            {promoValidation && (
              <Alert
                tone={promoValidation.isValid ? "success" : "error"}
                className="mt-3"
              >
                {promoValidation.message}
              </Alert>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:mb-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {currentPlans.map((plan, index) => (
          <div
            key={index}
            className={`relative flex flex-col rounded-[28px] bg-white p-6 sm:p-8 ${
              plan.isMostPopular
                ? "border-2 border-orange-500 shadow-[0_6px_0_#d97b18] sm:col-span-2 lg:col-span-1"
                : "border border-line shadow-[0_5px_0_#efe0cc]"
            }`}
          >
            {/* Badges */}
            <div className="absolute -top-4 left-0 right-0 flex flex-wrap justify-center gap-2 px-2">
              {plan.isMostPopular && (
                <span className="rounded-full bg-orange-500 px-4 py-1 font-display text-sm font-semibold text-ink shadow-sm">
                  Most popular
                </span>
              )}
              {plan.isCurrentPlan && (
                <span className="rounded-full bg-indigo-500 px-4 py-1 font-display text-sm font-semibold text-white shadow-sm">
                  Current plan
                </span>
              )}
            </div>

            <h3 className="mt-3 text-2xl font-semibold text-ink">{plan.displayName}</h3>

            {plan.discount && (
              <p className="mt-2">
                <span className="chip chip-danger">{plan.discount}</span>
              </p>
            )}

            <div className="mb-6 mt-4">
              {plan.originalPrice && (
                <div className="text-lg text-gray-500 line-through">{plan.originalPrice}</div>
              )}
              <div className="flex items-baseline">
                <span className="font-display text-4xl font-semibold text-ink">{plan.price}</span>
                <span className="ml-1 text-base font-semibold text-gray-600">{plan.period}</span>
              </div>
              {plan.displayName !== "Free" && billingPeriod === "yearly" && (
                <p className="mt-1 text-sm font-semibold text-gray-600">
                  Save 20% with annual billing
                </p>
              )}
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-green-100 text-green-700">
                    <LuCheck className="h-3.5 w-3.5" strokeWidth={3.5} aria-hidden />
                  </span>
                  <span className="text-[15px] font-semibold text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              fullWidth
              size="lg"
              variant={plan.isMostPopular ? "primary" : "ink"}
              disabled={plan.buttonDisabled || loading !== null}
              isLoading={loading === plan.displayName}
              onClick={() => handleSelectPlan(plan)}
            >
              {loading === plan.displayName ? "Processing..." : plan.buttonText}
            </Button>
          </div>
        ))}
      </div>

      {/* Launch Offer Note */}
      <div className="rounded-[24px] border-2 border-[#f3d6ae] bg-orange-50 p-5 text-center sm:p-6">
        <p className="font-display text-lg font-semibold text-ink">
          Launch offer: all plans are 50% off for a limited time.
        </p>
        <p className="mt-1 text-[15px] font-semibold text-gray-700">
          Get an extra 20% off when you choose annual billing.
        </p>
      </div>
    </div>
  );
}
