"use client";
import React from "react";
import Image from "next/image";
import { FiBookOpen, FiTrendingUp, FiAward, FiZap } from "react-icons/fi";

function Hero() {
  return (
    <section className="font-fredoka w-full mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
      <div
        className="w-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16"
        id="hero"
      >
        {/* Left Column - Content */}
        <div className="flex-1 flex flex-col items-start justify-center text-left max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-[#FD9E2F]/10 text-[#FD9E2F] px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <FiZap size={16} />
            Smart Study Assistant
          </div>

          <h1 className="text-[#111016] font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-tight mb-6">
            Study Smarter,
            <br />
            <span className="text-[#FD9E2F]">Not Harder</span>
          </h1>

          <p className="text-gray-600 text-lg sm:text-xl leading-relaxed mb-8">
            Transform your notes into interactive quizzes, flashcards, and
            summaries with AI. Track your progress, maintain study streaks, and
            ace your exams with confidence.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 w-full sm:w-auto">
            <a
              href="/signup"
              className="bg-[#FD9E2F] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#F5B17F] transition-all duration-200 shadow-lg hover:shadow-xl text-center text-lg transform hover:-translate-y-0.5"
            >
              Start Learning Free
            </a>
            <a
              href="#features"
              className="bg-white text-[#FD9E2F] font-semibold px-8 py-4 rounded-xl border-2 border-[#FD9E2F] hover:bg-[#FD9E2F]/5 transition-all duration-200 text-center text-lg"
            >
              See How It Works
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 w-full max-w-lg">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1">
                <FiBookOpen className="text-[#FD9E2F]" size={20} />
                <span className="text-3xl font-bold text-[#111016]">1.2K+</span>
              </div>
              <span className="text-[#333132] text-sm">Active Students</span>
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1">
                <FiTrendingUp className="text-[#FD9E2F]" size={20} />
                <span className="text-3xl font-bold text-[#111016]">3.4K+</span>
              </div>
              <span className="text-[#333132] text-sm">Quizzes Created</span>
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1">
                <FiAward className="text-[#FD9E2F]" size={20} />
                <span className="text-3xl font-bold text-[#111016]">89%</span>
              </div>
              <span className="text-[#333132] text-sm">Success Rate</span>
            </div>
          </div>
        </div>

        {/* Right Column - Hero Image */}
        <div className="flex-1 w-full lg:w-auto flex items-center justify-center">
          <div className="relative w-full max-w-2xl">
            <div className="absolute -inset-4 bg-linear-to-r from-[#FD9E2F] to-[#F5B17F] rounded-3xl blur-3xl opacity-20"></div>
            <div className="relative">
              <Image
                src="/images/wisker hero image .png"
                alt="Wisker Study Assistant"
                width={800}
                height={800}
                className="w-full h-auto rounded-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
