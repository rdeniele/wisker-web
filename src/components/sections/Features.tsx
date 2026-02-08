"use client";
import React from "react";
import {
  FiZap,
  FiTarget,
  FiTrendingUp,
  FiCalendar,
  FiClock,
  FiAward,
} from "react-icons/fi";

const features = [
  {
    icon: <FiZap size={28} />,
    title: "AI-Powered Quizzes",
    desc: "Automatically generate personalized quizzes from your notes. Test your knowledge and identify weak areas instantly.",
    color: "bg-[#7678ed]/10",
    iconColor: "text-[#7678ed]",
    borderColor: "border-[#7678ed]/20",
  },
  {
    icon: <FiTarget size={28} />,
    title: "Smart Flashcards",
    desc: "Create flashcards with spaced repetition algorithms to maximize retention and minimize study time.",
    color: "bg-[#6B5CE0]/10",
    iconColor: "text-[#6B5CE0]",
    borderColor: "border-[#6B5CE0]/20",
  },
  {
    icon: <FiTrendingUp size={28} />,
    title: "Progress Tracking",
    desc: "Monitor your study progress with detailed analytics and insights. See your improvement over time.",
    color: "bg-[#FD9E2F]/10",
    iconColor: "text-[#FD9E2F]",
    borderColor: "border-[#FD9E2F]/20",
  },
  {
    icon: <FiCalendar size={28} />,
    title: "Study Streaks",
    desc: "Stay motivated with daily study streaks. Build consistency and maintain your learning momentum.",
    color: "bg-[#F5B17F]/10",
    iconColor: "text-[#F5B17F]",
    borderColor: "border-[#F5B17F]/20",
  },
  {
    icon: <FiClock size={28} />,
    title: "Smart Summaries",
    desc: "Get concise AI-generated summaries of your notes. Perfect for quick reviews before exams.",
    color: "bg-[#9298A9]/10",
    iconColor: "text-[#9298A9]",
    borderColor: "border-[#9298A9]/20",
  },
  {
    icon: <FiAward size={28} />,
    title: "Subject Organization",
    desc: "Organize your notes by subjects and topics. Keep everything structured and easy to find.",
    color: "bg-[#7678ed]/10",
    iconColor: "text-[#7678ed]",
    borderColor: "border-[#7678ed]/20",
  },
];

export default function Features() {
  return (
    <section
      className="font-fredoka w-full bg-gray-50 py-16 sm:py-20 lg:py-24"
      id="features"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block bg-[#F5B17F]/10 text-[#6B5CE0] px-4 py-2 rounded-full text-sm font-semibold mb-4">
            Everything You Need
          </div>
          <h2 className="font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#111016] mb-6 tracking-tight">
            Powerful Features for
            <br />
            <span className="text-[#7678ed]">Smarter Studying</span>
          </h2>
          <p className="text-gray-600 text-lg sm:text-xl max-w-3xl mx-auto">
            Everything you need to transform your study routine and achieve
            better results
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
              <h3 className="font-bold text-xl text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <a
            href="/signup"
            className="inline-block bg-[#7678ed] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#6B5CE0] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Get Started for Free
          </a>
        </div>
      </div>
    </section>
  );
}
