"use client";
import React from "react";
import { FiZap } from "react-icons/fi";
import { toneViolet } from "@/lib/brand-landing";
import {
  landingOutlineButtonClass,
  landingPrimaryButtonClass,
} from "@/lib/landing-button-styles";

function Hero() {
  return (
    <section className="font-fredoka w-full mx-auto py-14 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8">
      <div
        id="hero"
        className="max-w-3xl mx-auto flex flex-col items-center text-center"
      >
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${toneViolet}`}
        >
          <FiZap size={16} aria-hidden />
          Active recall, automated
        </div>

        <h1 className="text-[#111016] font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-6">
          Turn Your Study Materials Into{" "}
          <span className="text-[#FD9E2F]">Active Recall</span>
          <br className="hidden sm:block" />
          <span className="text-[#6B5CE0]"> in Seconds</span>
        </h1>

        <div className="text-gray-600 text-lg sm:text-xl leading-relaxed mb-6 space-y-4">
          <p>
            Upload your PDFs, slides, and notes. Wisker automatically transforms
            them into quizzes, flashcards, and summaries — organized and ready for
            review.
          </p>
          <p className="font-semibold text-gray-800">
            Built to help you study faster, retain more, and stay consistent.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
          <a href="/signup" className={landingPrimaryButtonClass}>
            Start Studying Free
          </a>
          <a href="#how-it-works" className={landingOutlineButtonClass}>
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}

export default Hero;
