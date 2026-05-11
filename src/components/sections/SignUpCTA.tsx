"use client";
import React from "react";
import Image from "next/image";
import { landingPrimaryButtonClass } from "@/lib/landing-button-styles";

export default function SignUpCTA() {
  return (
    <section className="w-full bg-[#e6f3ff] py-10 px-4 sm:py-12 sm:px-6 mt-8 flex items-center rounded-3xl max-w-7xl mx-auto border-2 border-[#b3d1ff]/50 shadow-[0_4px_20px_rgba(118,120,237,0.08),0_3px_0_0_rgba(253,158,47,0.35)]">
      <div className="flex flex-col md:flex-row items-center gap-8 w-full min-w-0 text-center md:text-left">
        <Image
          src="/images/wisky-hi.png"
          alt="Wisky Mascot"
          width={96}
          height={96}
          className="w-24 h-24 shrink-0 rounded-full border-4 border-[#7678ed]/35 bg-[#fafafa] shadow-[3px_3px_0_#b3d1ff]"
        />
        <div className="w-full md:flex-1">
          <h2 className="font-extrabold text-[#232323] text-2xl sm:text-3xl md:text-4xl m-0 leading-tight">
            <span className="text-[#6B5CE0]">Study with Structure,</span>{" "}
            <span className="text-[#FD9E2F]">Not Stress</span>
          </h2>
          <p className="text-[#5c5c5c] text-base sm:text-lg mt-3 font-semibold max-w-xl md:max-w-none mx-auto md:mx-0">
            Start building your personal study system today.
          </p>
        </div>
        <a href="/signup" className={`shrink-0 ${landingPrimaryButtonClass}`}>
          Get Started Free
        </a>
      </div>
    </section>
  );
}
