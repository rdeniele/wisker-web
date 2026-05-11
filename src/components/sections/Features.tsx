"use client";
import React from "react";
import { landingPillOrange } from "@/lib/brand-landing";
import { landingPrimaryButtonClass } from "@/lib/landing-button-styles";
import {
  FiFolder,
  FiRefreshCw,
  FiLayers,
  FiZap,
} from "react-icons/fi";

const features = [
  {
    icon: <FiFolder size={28} />,
    title: "Organized Study Spaces",
    desc: "Keep all your materials structured by subject so everything stays easy to find and review.",
    color: "bg-[#FD9E2F]/10",
    iconColor: "text-[#FD9E2F]",
    borderColor: "border-[#FD9E2F]/25",
  },
  {
    icon: <FiRefreshCw size={28} />,
    title: "Active Recall Generation",
    desc: "Automatically generate quizzes and flashcards that help reinforce memory and improve retention.",
    color: "bg-[#7678ed]/10",
    iconColor: "text-[#6B5CE0]",
    borderColor: "border-[#7678ed]/22",
  },
  {
    icon: <FiLayers size={28} />,
    title: "Multi-Document Understanding",
    desc: "Combine multiple files into one connected learning space for deeper comprehension.",
    color: "bg-[#FD9E2F]/10",
    iconColor: "text-[#FD9E2F]",
    borderColor: "border-[#FD9E2F]/25",
  },
  {
    icon: <FiZap size={28} />,
    title: "Instant Study Tools",
    desc: "Summaries, quizzes, and flashcards generated in seconds — no manual formatting needed.",
    color: "bg-[#7678ed]/10",
    iconColor: "text-[#6B5CE0]",
    borderColor: "border-[#7678ed]/22",
  },
];

export default function Features() {
  return (
    <section
      className="font-fredoka w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
      id="features"
    >
      <div className="max-w-7xl mx-auto rounded-[24px] border border-[#b3d1ff]/40 bg-[#f7f6fd] py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 ring-1 ring-[#FD9E2F]/15">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className={landingPillOrange}>Features</div>
          <h2 className="font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#111016] mb-6 tracking-tight leading-tight">
            Study tools that{" "}
            <span className="text-[#7678ed]">work with your materials</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`${feature.color} ${feature.borderColor} border-2 rounded-2xl p-6 sm:p-8 hover:shadow-lg transition-all duration-200 group hover:-translate-y-1`}
            >
              <div
                className={`${feature.iconColor} mb-4 transform group-hover:scale-110 transition-transform`}
              >
                {feature.icon}
              </div>
              <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-3 leading-tight">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
