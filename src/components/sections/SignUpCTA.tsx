"use client";
import React from "react";
import Image from "next/image";

export default function SignUpCTA() {
  return (
    <section className="w-full bg-[#e6f3ff] py-8 px-2 sm:py-10 sm:px-4 mt-8 flex items-center border-b-4 border-[#5c5c5c] shadow-[0_4px_16px_rgba(88,88,88,0.08)] rounded-3xl">
      <div className="flex flex-col sm:flex-col md:flex-row items-center gap-6 sm:gap-8 w-full min-w-0 text-center md:text-left">
        <Image
          src="/images/wisky-hi.png"
          alt="Wisky Mascot"
          width={80}
          height={80}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#5c5c5c] bg-[#fafafa] shadow-[4px_4px_0_#5c5c5c] mb-4 md:mb-0"
        />
        <div className="w-full md:flex-1">
          <p className="font-extrabold text-[#232323] text-lg sm:text-2xl md:text-3xl m-0 leading-tight">
            <span className="text-[#5c5c5c]">Wisky says:</span>{" "}
            <span className="bg-[#ffe7a1] text-[#5c5c5c] px-2 py-1 rounded">
              Ready to pounce on better grades?
            </span>{" "}
            <span className="text-[#ff69b4]">#StudyGlowUp</span>
          </p>
          <p className="text-[#5c5c5c] text-base sm:text-lg md:text-xl mt-2 font-semibold">
            Join the Wisker fam and let our AI cat-mascot help you study
            smarter, not harder.{" "}
            <span className="text-orange-500">
              No cap, just pawsome results.
            </span>
          </p>
        </div>
        <a
          href="/signup"
          className="bg-[#fafafa] text-[#232323] font-bold text-base sm:text-lg md:text-xl border-4 border-[#5c5c5c] rounded-2xl px-6 py-3 sm:px-8 sm:py-4 shadow-[6px_6px_0_#5c5c5c] no-underline transition-transform duration-150 hover:scale-105 hover:bg-[#d8c8f5] hover:text-[#5c5c5c] mt-4 md:mt-0"
        >
          Sign Up Free
        </a>
      </div>
    </section>
  );
}
