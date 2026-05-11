"use client";

import React from "react";

export default function Subheadline() {
  return (
    <section
      className="font-fredoka w-full py-6 sm:py-8"
      aria-labelledby="subheadline-heading"
    >
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        <div className="rounded-full border-2 border-[#7678ed]/25 bg-[#f7f6fd] px-6 sm:px-10 md:px-12 py-5 sm:py-6 md:py-7 text-center shadow-[0_8px_28px_-10px_rgba(118,120,237,0.14),0_6px_20px_-8px_rgba(253,158,47,0.12)]">
          <p
            id="subheadline-heading"
            className="text-[#111016] text-lg sm:text-xl md:text-2xl leading-relaxed font-medium"
          >
            A simple study system powered by active recall — designed to turn
            passive reading into real understanding.
          </p>
        </div>
      </div>
    </section>
  );
}
