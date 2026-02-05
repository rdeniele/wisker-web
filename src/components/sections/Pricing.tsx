"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheck } from "react-icons/fi";

interface Plan {
  name: string;
  price: number;
  originalPrice?: number;
  features: string[];
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    name: "Free",
    price: 0,
    features: [
      "10 daily credits",
      "AI-powered quizzes",
      "Smart flashcards",
      "Basic progress tracking",
      "Study streak tracking",
    ],
  },
  {
    name: "Pro",
    price: 50,
    originalPrice: 99,
    highlighted: true,
    features: [
      "300 daily credits",
      "All Free features",
      "Advanced analytics",
      "Priority AI processing",
      "Custom study schedules",
      "Export study materials",
      "Priority support",
    ],
  },
  {
    name: "Premium",
    price: 100,
    originalPrice: 199,
    features: [
      "1500 daily credits",
      "All Pro features",
      "Early access to new features",
      "Dedicated account manager",
      "Custom integrations",
      "API access",
      "White-glove onboarding",
    ],
  },
];

function getDiscountedPrice(base: number, isYearly: boolean) {
  if (isYearly) {
    return base * 12 * 0.8; // 20% annual discount
  }
  return base;
}

function formatPrice(price: number) {
  return price === 0
    ? "Free"
    : `₱${price.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(true);
  const router = useRouter();

  const handleSelectPlan = (planName: string) => {
    if (planName !== "Free") {
      router.push("/signup");
    }
  };

  return (
    <section className="font-fredoka w-full flex flex-col items-center py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50" id="pricing">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-[#F5B17F]/10 text-[#6B5CE0] px-4 py-2 rounded-full text-sm font-semibold mb-4">
            Simple Pricing
          </div>
          <h2 className="font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#111016] mb-6 tracking-tight">
            Choose Your Plan
          </h2>
          <p className="text-gray-600 text-lg sm:text-xl max-w-3xl mx-auto mb-8">
            Start free and upgrade as you grow. All plans include our core features.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex gap-1 bg-white rounded-xl shadow-sm p-1 border border-gray-200">
            <button
              className={`px-6 py-3 font-semibold text-base rounded-lg transition-all ${!isYearly ? "bg-[#7678ed] text-white shadow-md" : "text-[#333132] hover:text-[#7678ed]"}`}
              onClick={() => setIsYearly(false)}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-3 font-semibold text-base rounded-lg transition-all flex items-center gap-2 ${isYearly ? "bg-[#7678ed] text-white shadow-md" : "text-[#333132] hover:text-[#7678ed]"}`}
              onClick={() => setIsYearly(true)}
            >
              Yearly
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Launch Offer Banner */}
        <div className="mb-8 text-center">
          <div className="inline-block bg-green-50 border-2 border-green-500 text-green-700 px-6 py-3 rounded-xl font-semibold">
            🎉 Launch Offer: <span className="text-green-600 font-bold">50% OFF</span> for first 50 users!
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const price = getDiscountedPrice(plan.price, isYearly);
            const per = isYearly ? "year" : "month";
            
            return (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl border-2 p-8 transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlighted
                    ? "border-[#7678ed] shadow-2xl scale-105"
                    : "border-gray-200 shadow-lg hover:border-[#7678ed]/30"
                }`}
              >
                {/* Most Popular Badge */}
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#7678ed] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-[#111016] mb-2">
                  {plan.name}
                </h3>

                {/* Original Price (if discounted) */}
                {plan.originalPrice && (
                  <div className="mb-2">
                    <span className="text-lg text-red-500 line-through font-semibold">
                      ₱{isYearly
                        ? (plan.originalPrice * 12 * 0.8).toLocaleString("en-PH", { maximumFractionDigits: 0 })
                        : plan.originalPrice.toLocaleString("en-PH", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-bold text-[#111016]">
                      {formatPrice(price)}
                    </span>
                    {plan.price !== 0 && (
                      <span className="text-[#333132] text-lg font-medium mb-2">
                        /{per}
                      </span>
                    )}
                  </div>
                  {isYearly && plan.price !== 0 && (
                    <p className="text-green-600 text-sm font-semibold mt-1">
                      Save ₱{(plan.price * 12 * 0.2).toLocaleString("en-PH", { maximumFractionDigits: 0 })} per year
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <FiCheck className="text-[#7678ed] shrink-0 mt-0.5" size={20} />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                    plan.highlighted
                      ? "bg-[#7678ed] text-white hover:bg-[#6B5CE0] shadow-lg hover:shadow-xl"
                      : plan.price === 0
                        ? "bg-gray-100 text-[#9298A9] cursor-default"
                        : "bg-white text-[#7678ed] border-2 border-[#7678ed] hover:bg-[#7678ed]/5"
                  }`}
                  onClick={() => handleSelectPlan(plan.name)}
                  disabled={plan.price === 0}
                >
                  {plan.price === 0 ? "Current Plan" : "Get Started"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center text-gray-600 max-w-2xl mx-auto">
          <p className="text-sm">
            All plans include a 14-day free trial. No credit card required to start. 
            Cancel anytime with no questions asked.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
