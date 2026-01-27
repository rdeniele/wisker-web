"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  name: string;
  price: number;
  originalPrice?: number;
  features: string[];
}

const plans: Plan[] = [
  {
    name: "Free",
    price: 0,
    features: [
      "10 daily credits (fur real)",
      "AI Cat Quizzes (purr-fect your smarts)",
      "AI Flashcat Cards (study on fleek)",
      "AI Cat-nnected Concept Maps (big brain energy)",
    ],
  },
  {
    name: "Pro",
    price: 50,
    originalPrice: 99,
    features: [
      "300 daily credits (no cap)",
      "AI Cat Quizzes (flex your whiskers)",
      "AI Flashcat Cards (study glow-up)",
      "AI Cat-nnected Concept Maps (mega mind mode)",
      "Catnap Study Schedules (plan your catnaps)",
      "Advanced analytics (stats for days)",
      "Priority support (VIP paws only)",
    ],
  },
  {
    name: "Premium",
    price: 100,
    originalPrice: 199,
    features: [
      "1500 daily credits (max catitude)",
      "All Pro perks, but supercharged",
      "Early access to new drops (first dibs, always)",
      "Dedicated Cat Manager (your own hype human)",
      "Custom integrations (make it your vibe)",
    ],
  },
];

function getDiscountedPrice(base: number, isYearly: boolean) {
  if (isYearly) {
    // Monthly price * 12 months * 0.8 (20% annual discount)
    return base * 12 * 0.8;
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
  const [animKey, setAnimKey] = useState(0);
  const router = useRouter();

  const handleTab = (yearly: boolean) => {
    if (yearly !== isYearly) {
      setIsYearly(yearly);
      setAnimKey((k) => k + 1);
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <section className="w-full flex flex-col items-center py-12 px-2 sm:px-4 rounded-3xl">
      <h2
        className="font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-700 text-center mb-8 sm:mb-12 drop-shadow-[2px_2px_0_#a3cfff,4px_4px_0_#d8c8f5] tracking-tight leading-tight"
        id="pricing"
      >
        Choose Your
        <br className="hidden sm:block" />
        Cat-egory
      </h2>
      {/* Tab Switcher */}
      <div className="mb-10 flex gap-2 bg-white rounded-xl shadow-sm p-1">
        <button
          className={`px-6 py-3 font-bold text-lg rounded-lg transition-all border-b-4 ${!isYearly ? "bg-indigo-500 text-white shadow border-indigo-500" : "bg-slate-50 text-gray-900 border-transparent hover:border-indigo-300 hover:text-orange-500"} hover:bg-indigo-50`}
          onClick={() => handleTab(false)}
        >
          Monthly
        </button>
        <button
          className={`px-6 py-3 font-bold text-lg rounded-lg transition-all flex items-center gap-1 border-b-4 ${isYearly ? "bg-indigo-500 text-white shadow border-indigo-500" : "bg-slate-50 text-gray-900 border-transparent hover:border-indigo-300 hover:text-orange-500"} hover:bg-indigo-50`}
          onClick={() => handleTab(true)}
        >
          Yearly{" "}
          <span className="text-green-600 font-bold text-base ml-1">
            (-20%)
          </span>
        </button>
      </div>
      {/* Pricing Cards */}
      <div className="flex flex-col md:flex-row gap-6 justify-center w-full max-w-5xl">
        {plans.map((plan) => {
          const price = getDiscountedPrice(plan.price, isYearly);
          const per = isYearly ? "year" : "mo";
          return (
            <div
              key={plan.name}
              className={`flex-1 flex flex-col items-center rounded-2xl px-8 py-10 min-w-60 max-w-xs mx-auto relative border-4 transition-transform duration-200 ease-in-out
                hover:scale-[1.045] hover:-translate-y-1 focus:scale-[1.045] focus:-translate-y-1 active:scale-100
                border-[#5c5c5c] shadow-[12px_12px_0_#5c5c5c,0_4px_24px_rgba(0,0,0,0.10)]
                ${
                  plan.name === "Pro"
                    ? "bg-indigo-100 text-[#5c5c5c]"
                    : plan.name === "Premium"
                      ? "bg-orange-100 text-[#5c5c5c]"
                      : "bg-slate-100 text-[#5c5c5c]"
                }
              `}
            >
              {plan.name === "Pro" && (
                <span className="absolute top-3 right-3 bg-indigo-700 text-white rounded-md px-3 py-1 text-xs font-bold shadow">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold mb-2 tracking-wide text-[#5c5c5c]">
                {plan.name}
              </h3>
              {/* Animated Price */}
              {/* 50% OFF badge for paid plans, above price */}
              {plan.price !== 0 && (
                <div className="mb-1 flex flex-col items-center w-full">
                  <span className="bg-green-600 text-white rounded px-3 py-1 text-xs font-bold shadow z-10 mb-1">
                    50% OFF for First 50 Users
                  </span>
                  {plan.originalPrice && (
                    <span className="text-lg font-semibold text-red-500 line-through">
                      ₱
                      {isYearly
                        ? (plan.originalPrice * 12 * 0.8).toLocaleString(
                            "en-PH",
                            { maximumFractionDigits: 0 },
                          )
                        : plan.originalPrice.toLocaleString("en-PH", {
                            maximumFractionDigits: 0,
                          })}
                    </span>
                  )}
                </div>
              )}
              <div
                key={animKey + "-" + plan.name}
                className={`transition-all duration-400 ease-in-out text-4xl font-extrabold my-2 flex items-end gap-1 text-[#5c5c5c]`}
              >
                {formatPrice(price)}
                {plan.price !== 0 && (
                  <span className="text-base font-medium ml-1 text-[#5c5c5c]">
                    /{per}
                  </span>
                )}
              </div>
              {isYearly && plan.price !== 0 && (
                <div className="text-green-600 text-xs font-semibold mb-2">
                  Save 20% with annual billing
                </div>
              )}
              <ul className="list-none p-0 my-4 w-full">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="mb-2 text-[15px] font-medium text-[#5c5c5c]"
                  >
                    • {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-auto w-full py-3 rounded-lg font-bold text-lg transition-all ${plan.name === "Pro" ? "bg-white text-indigo-700 hover:bg-indigo-100" : plan.name === "Premium" ? "bg-orange-500 text-white hover:bg-orange-400" : "bg-indigo-500 text-white hover:bg-indigo-600"} ${plan.price === 0 ? "opacity-70 cursor-default" : "hover:scale-[1.03] active:scale-95"}`}
                disabled={plan.price === 0}
                onClick={plan.price === 0 ? undefined : handleLogin}
              >
                {plan.price === 0 ? "Current Plan" : "Choose Plan"}
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-10 text-gray-400 text-sm text-center max-w-xl font-medium">
        <strong className="text-gray-700">Launch Offer:</strong> All plans are{" "}
        <span className="text-green-600 font-bold">50% off</span> for a limited
        time!
        <br />
        <span>
          Get an extra <span className="text-green-600 font-bold">20% off</span>{" "}
          when you choose annual billing.
        </span>
      </div>
    </section>
  );
};

export default Pricing;
