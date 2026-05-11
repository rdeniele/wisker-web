"use client";

import React from "react";

export default function AudienceSection() {
  return (
    <section
      id="for-students"
      className="font-fredoka w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#f7f6fd]/70"
      aria-labelledby="audience-heading"
    >
      <div className="max-w-3xl mx-auto text-center">
        <h2
          id="audience-heading"
          className="font-bold text-3xl sm:text-4xl md:text-5xl text-[#111016] mb-6 tracking-tight"
        >
          For Students Who Want{" "}
          <span className="text-[#FD9E2F]">Better Study Sessions</span>
        </h2>
        <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
          Whether you&apos;re preparing for exams, reviewing lectures, or
          organizing your semester notes, Wisker helps turn scattered materials
          into a{" "}
          <span className="font-semibold text-[#6B5CE0]">
            structured study flow
          </span>
          .
        </p>
      </div>
    </section>
  );
}
