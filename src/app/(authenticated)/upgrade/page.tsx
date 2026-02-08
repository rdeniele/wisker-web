"use client";
import React, { useState, useEffect } from "react";

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
        } else {
          console.error("Failed to fetch plans:", data.error);
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
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
        });
      } else {
        setPromoValidation({
          isValid: false,
          message: data.error || "Invalid promo code",
        });
      }
    } catch (error) {
      console.error("Error validating promo code:", error);
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
      const requestBody: {
        planName: string;
        amount: number;
        billingPeriod: BillingPeriod;
        promoCode?: string;
      } = {
        planName: plan.displayName,
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
        console.error("Checkout error:", data.error);
        alert("Failed to create checkout session. Please try again.");
        setLoading(null);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
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

    // Apply promo code discount if valid
    if (promoValidation?.isValid && promoValidation.discount) {
      const promoDiscount = promoValidation.discount;

      if (promoDiscount.type === "PERCENTAGE") {
        originalPrice = `₱${price.toLocaleString()}`;
        price = price * (1 - promoDiscount.value / 100);
        discount = `${promoDiscount.value}% off with promo code`;
      } else if (promoDiscount.type === "FIXED_AMOUNT") {
        originalPrice = `₱${price.toLocaleString()}`;
        price = Math.max(0, price - promoDiscount.value);
        discount = `₱${promoDiscount.value.toLocaleString()} off with promo code`;
      } else if (promoDiscount.type === "MONTHS_FREE") {
        discount = `First ${promoDiscount.value} months free!`;
      }
    } else if (plan.discountPercent && plan.discountPercent > 0) {
      // Existing plan discount
      const original = price / (1 - plan.discountPercent / 100);
      originalPrice = `₱${original.toLocaleString()}`;
    }

    return {
      name: plan.name,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Choose Your Plan
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 px-4">
            Upgrade your learning experience with Wisker
          </p>

          {/* Billing Toggle */}
          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md border border-gray-200">
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-semibold transition-all duration-200 ${
                  billingPeriod === "yearly"
                    ? "bg-orange-500 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-semibold transition-all duration-200 ${
                  billingPeriod === "monthly"
                    ? "bg-orange-500 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
            </div>

            {/* Save Badge for Yearly */}
            {billingPeriod === "yearly" && (
              <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold">
                Save 20% with annual billing
              </span>
            )}
          </div>

          {/* Promo Code Input */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-dashed border-orange-300">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🎟️</span>
                <h3 className="text-lg font-semibold text-gray-900">
                  Have a promo code?
                </h3>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={handlePromoCodeChange}
                  placeholder="Enter code (e.g., EARLYCAT50)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base uppercase"
                  disabled={validatingPromo}
                />
                <button
                  onClick={handleApplyPromoCode}
                  disabled={!promoCode.trim() || validatingPromo}
                  className="px-4 sm:px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm sm:text-base whitespace-nowrap"
                >
                  {validatingPromo ? "..." : "Apply"}
                </button>
              </div>

              {/* Validation Message */}
              {promoValidation && (
                <div
                  className={`mt-3 p-3 rounded-lg flex items-start gap-2 text-sm ${
                    promoValidation.isValid
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <span className="text-lg">
                    {promoValidation.isValid ? "✓" : "✕"}
                  </span>
                  <span>{promoValidation.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
          {currentPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl p-6 sm:p-8 transition-all duration-200 ${
                plan.isMostPopular
                  ? "border-2 border-orange-500 sm:col-span-2 lg:col-span-1 lg:transform lg:scale-105"
                  : "border border-gray-200"
              }`}
              style={{ boxShadow: "0 4px 0 #ececec" }}
            >
              {/* Badges */}
              <div className="absolute -top-3 sm:-top-4 left-0 right-0 flex justify-center gap-2 flex-wrap px-2">
                {plan.isMostPopular && (
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md">
                    Most Popular
                  </span>
                )}
                {plan.isCurrentPlan && (
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md">
                    Current Plan
                  </span>
                )}
              </div>

              {/* Plan Name */}
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 mt-6 sm:mt-4">
                {plan.displayName}
              </h3>

              {/* Discount Badge */}
              {plan.discount && (
                <div className="mb-2">
                  <span className="bg-red-100 text-red-600 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold">
                    {plan.discount}
                  </span>
                </div>
              )}

              {/* Pricing */}
              <div className="mb-4 sm:mb-6">
                {plan.originalPrice && (
                  <div className="text-gray-400 line-through text-base sm:text-lg">
                    {plan.originalPrice}
                  </div>
                )}
                <div className="flex items-baseline">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-1 text-sm sm:text-base">
                    {plan.period}
                  </span>
                </div>
                {plan.displayName !== "Free" && billingPeriod === "yearly" && (
                  <p className="text-sm text-gray-500 mt-1">
                    Save 20% with annual billing
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold mt-1 text-sm sm:text-base">
                      •
                    </span>
                    <span className="text-gray-700 text-sm sm:text-base">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                disabled={plan.buttonDisabled || loading !== null}
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${
                  plan.buttonDisabled || loading !== null
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : plan.isMostPopular
                      ? "bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
                      : "bg-gray-900 text-white hover:bg-gray-800 active:scale-95"
                }`}
                style={{
                  boxShadow:
                    plan.buttonDisabled || loading !== null
                      ? "none"
                      : "0 4px 0 0 rgba(251, 146, 60, 0.18)",
                }}
              >
                {loading === plan.displayName
                  ? "Processing..."
                  : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Launch Offer Note */}
        <div className="bg-linear-to-r from-orange-100 to-yellow-100 border-2 border-orange-300 rounded-xl p-4 sm:p-6 text-center mx-2 sm:mx-0">
          <p className="text-sm sm:text-base text-gray-800 font-semibold mb-1 sm:mb-2">
            🎉 Launch Offer: All plans are 50% off for a limited time!
          </p>
          <p className="text-sm sm:text-base text-gray-700">
            Get an extra 20% off when you choose annual billing.
          </p>
        </div>
      </div>
    </div>
  );
}
