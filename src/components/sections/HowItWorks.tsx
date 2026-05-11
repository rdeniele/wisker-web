"use client";
import React from "react";
import { FiUpload, FiCpu, FiLayers, FiCheckCircle } from "react-icons/fi";
import { landingPillViolet } from "@/lib/brand-landing";
import { landingPrimaryButtonClass } from "@/lib/landing-button-styles";

const steps = [
  {
    icon: <FiUpload size={32} />,
    title: "Upload your study materials",
    desc: "Add PDFs, slides, and notes — Wisker takes it from there.",
    color: "bg-[#FD9E2F]",
  },
  {
    icon: <FiCpu size={32} />,
    title: "Wisker processes and organizes them",
    desc: "Your content is structured so you can pick up where you left off.",
    color: "bg-[#7678ed]",
  },
  {
    icon: <FiLayers size={32} />,
    title: "Generate quizzes, flashcards, and summaries",
    desc: "Choose the tools you need; no manual reformatting required.",
    color: "bg-[#ea8e26]",
  },
  {
    icon: <FiCheckCircle size={32} />,
    title: "Review and strengthen your memory through active recall",
    desc: "Practice with materials built from what you actually studied.",
    color: "bg-[#6B5CE0]",
  },
];

export default function HowItWorks() {
  return (
    <section
      className="font-fredoka w-full bg-white py-16 sm:py-20 lg:py-24"
      id="how-it-works"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className={landingPillViolet}>How it works</div>
          <h2 className="font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#111016] mb-6 tracking-tight">
            How It Works
          </h2>
          <p className="text-gray-600 text-lg sm:text-xl max-w-3xl mx-auto">
            From upload to review in four straightforward steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={step.title} className="relative group">
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-linear-to-r from-[#7678ed]/25 via-[#b3d1ff]/40 to-[#FD9E2F]/35 z-0" />
              )}

              <div className="relative bg-white rounded-2xl border-2 border-gray-200 p-6 hover:border-[#7678ed]/35 hover:shadow-[0_12px_40px_-12px_rgba(118,120,237,0.15)] transition-all duration-300 z-10 h-full min-h-[280px] flex flex-col">
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#7678ed] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg ring-2 ring-[#FD9E2F]/40">
                  {idx + 1}
                </div>

                <div className="mb-6 mt-2">
                  <div
                    className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    {step.icon}
                  </div>
                </div>

                <h3 className="font-bold text-xl text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed grow">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <a href="/signup" className={landingPrimaryButtonClass}>
            Get Started Free
          </a>
        </div>
      </div>
    </section>
  );
}
