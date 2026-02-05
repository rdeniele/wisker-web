"use client";
import React from "react";
import { FiUpload, FiZap, FiTrendingUp, FiCheckCircle } from "react-icons/fi";

const steps = [
  {
    icon: <FiUpload size={32} />,
    title: "Upload Your Notes",
    desc: "Upload your study materials, lecture notes, or PDFs. Our system handles the rest.",
    color: "bg-[#7678ed]",
  },
  {
    icon: <FiZap size={32} />,
    title: "AI Generates Content",
    desc: "Our AI instantly creates quizzes, flashcards, and summaries tailored to your content.",
    color: "bg-[#6B5CE0]",
  },
  {
    icon: <FiTrendingUp size={32} />,
    title: "Study & Track Progress",
    desc: "Use your personalized materials and watch your progress grow with detailed analytics.",
    color: "bg-[#FD9E2F]",
  },
  {
    icon: <FiCheckCircle size={32} />,
    title: "Ace Your Exams",
    desc: "Stay consistent with study streaks and achieve better grades with confidence.",
    color: "bg-[#F5B17F]",
  },
];

export default function HowItWorks() {
  return (
    <section
      className="font-fredoka w-full bg-white py-16 sm:py-20 lg:py-24"
      id="how-it-works"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block bg-[#F5B17F]/10 text-[#6B5CE0] px-4 py-2 rounded-full text-sm font-semibold mb-4">
            Simple Process
          </div>
          <h2 className="font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#111016] mb-6 tracking-tight">
            How Wisker Works
          </h2>
          <p className="text-gray-600 text-lg sm:text-xl max-w-3xl mx-auto">
            Get started in minutes. Four simple steps to transform your studying.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div
              key={step.title}
              className="relative group"
            >
              {/* Connector Line (desktop only) */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-linear-to-r from-gray-300 to-gray-200 z-0" />
              )}
              
              {/* Card */}
              <div className="relative bg-white rounded-2xl border-2 border-gray-200 p-6 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 z-10 h-full min-h-[280px] flex flex-col">
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#7678ed] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  {idx + 1}
                </div>
                
                {/* Icon with Solid Color Background */}
                <div className="mb-6 mt-2">
                  <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    {step.icon}
                  </div>
                </div>
                
                {/* Content */}
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

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <a
            href="/signup"
            className="inline-block bg-[#7678ed] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#6B5CE0] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Start Your Free Trial
          </a>
          <p className="mt-4 text-gray-500 text-sm">
            No credit card required • Get started in minutes
          </p>
        </div>
      </div>
    </section>
  );
}
