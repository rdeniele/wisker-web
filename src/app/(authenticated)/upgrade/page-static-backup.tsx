"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

type BillingPeriod = "yearly" | "monthly";

interface PricingTier {
  name: string;
  price: string;
  originalPrice?: string;
  period: string;
  discount?: string;
  features: string[];
  isCurrentPlan?: boolean;
  isMostPopular?: boolean;
  buttonText: string;
  buttonDisabled?: boolean;
}

export default function UpgradePage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSelectPlan = async (plan: PricingTier) => {
    if (plan.isCurrentPlan || plan.buttonDisabled) return;

    setLoading(plan.name);

    try {
      // Calculate the actual amount to charge
      const priceString = plan.price.replace("₱", "").replace(",", "");
      const amount = parseFloat(priceString);

      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planName: plan.name,
          amount: amount,
          billingPeriod: billingPeriod,
        }),
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
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

  // Base monthly prices (before any discounts)
  const BASE_PRO_MONTHLY = 100;
  const BASE_PREMIUM_MONTHLY = 150;

  // Discount rates
  const EARLY_USER_DISCOUNT = 0.5; // 50% off
  const ANNUAL_DISCOUNT = 0.2; // 20% off for annual billing

  // Calculate Pro pricing
  const proMonthlyPrice = BASE_PRO_MONTHLY * (1 - EARLY_USER_DISCOUNT); // ₱50
  const proMonthlyOriginal = BASE_PRO_MONTHLY; // ₱100
  const proYearlyOriginal = BASE_PRO_MONTHLY * 12; // ₱1,200
  const proYearlyPrice =
    proYearlyOriginal * (1 - EARLY_USER_DISCOUNT) * (1 - ANNUAL_DISCOUNT); // ₱480

  // Calculate Premium pricing
  const premiumMonthlyPrice = BASE_PREMIUM_MONTHLY; // ₱150 (no early user discount)
  const premiumYearlyOriginal = BASE_PREMIUM_MONTHLY * 12; // ₱1,800
  const premiumYearlyPrice = premiumYearlyOriginal * (1 - ANNUAL_DISCOUNT); // ₱1,440

  const yearlyPlans: PricingTier[] = [
    {
      name: "Free",
      price: "Free",
      period: "",
      features: [
        "10 daily credits (fur real)",
        "AI Cat Quizzes (purr-fect your smarts)",
        "AI Flashcat Cards (study on fleek)",
        "AI Cat-nnected Concept Maps (big brain energy)",
      ],
      isCurrentPlan: true,
      buttonText: "Current Plan",
      buttonDisabled: true,
    },
    {
      name: "Pro",
      price: `₱${proYearlyPrice.toLocaleString()}`,
      originalPrice: `₱${proYearlyOriginal.toLocaleString()}`,
      period: "/year",
      discount: "50% OFF for Early Users",
      features: [
        "1000 daily credits (no cap)",
        "AI Cat Quizzes (flex your whiskers)",
        "AI Flashcat Cards (study glow-up)",
        "AI Cat-nnected Concept Maps (mega mind mode)",
        "Catnap Study Schedules (plan your catnaps)",
        "Advanced analytics (stats for days)",
        "Priority support (VIP paws only)",
      ],
      isMostPopular: true,
      buttonText: "Choose Plan",
    },
    {
      name: "Premium",
      price: `₱${premiumYearlyPrice.toLocaleString()}`,
      originalPrice: `₱${premiumYearlyOriginal.toLocaleString()}`,
      period: "/year",
      features: [
        "4000 daily credits (max catitude)",
        "All Pro perks, but supercharged",
        "Early access to new drops (first dibs, always)",
        "Dedicated Cat Manager (your own hype human)",
        "Custom integrations (make it your vibe)",
      ],
      buttonText: "Choose Plan",
    },
  ];

  const monthlyPlans: PricingTier[] = [
    {
      name: "Free",
      price: "Free",
      period: "",
      features: [
        "10 daily credits (fur real)",
        "AI Cat Quizzes (purr-fect your smarts)",
        "AI Flashcat Cards (study on fleek)",
        "AI Cat-nnected Concept Maps (big brain energy)",
      ],
      isCurrentPlan: true,
      buttonText: "Current Plan",
      buttonDisabled: true,
    },
    {
      name: "Pro",
      price: `₱${proMonthlyPrice}`,
      originalPrice: `₱${proMonthlyOriginal}`,
      period: "/mo",
      discount: "50% OFF for Early Users",
      features: [
        "1000 daily credits (no cap)",
        "AI Cat Quizzes (flex your whiskers)",
        "AI Flashcat Cards (study glow-up)",
        "AI Cat-nnected Concept Maps (mega mind mode)",
        "Catnap Study Schedules (plan your catnaps)",
        "Advanced analytics (stats for days)",
        "Priority support (VIP paws only)",
      ],
      isMostPopular: true,
      buttonText: "Choose Plan",
    },
    {
      name: "Premium",
      price: `₱${premiumMonthlyPrice}`,
      period: "/mo",
      features: [
        "4000 daily credits (max catitude)",
        "All Pro perks, but supercharged",
        "Early access to new drops (first dibs, always)",
        "Dedicated Cat Manager (your own hype human)",
        "Custom integrations (make it your vibe)",
      ],
      buttonText: "Choose Plan",
    },
  ];

  const currentPlans = billingPeriod === "yearly" ? yearlyPlans : monthlyPlans;

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
                {plan.name}
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
                {plan.name !== "Free" && billingPeriod === "yearly" && (
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
                  boxShadow: plan.buttonDisabled || loading !== null
                    ? "none"
                    : "0 4px 0 0 rgba(251, 146, 60, 0.18)",
                }}
              >
                {loading === plan.name ? "Processing..." : plan.buttonText}
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
