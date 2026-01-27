"use client";
import React from "react";
import Image from "next/image";

function Hero() {
  // Typewriter animation for headline
  const headline = "Last-minute?";
  const subheadline = "We make it count.";
  const combined = headline + "\n" + subheadline;
  const [typed, setTyped] = React.useState("");
  const [showCursor, setShowCursor] = React.useState(true);
  React.useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTyped(combined.slice(0, i + 1));
      i++;
      if (i === combined.length) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, [combined]);
  React.useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((c) => !c);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);
  return (
    <section className="w-full rounded-3xl mx-auto py-8 sm:py-12 md:py-16 px-2 sm:px-4 md:px-6 lg:px-8">
      <div
        className="w-full flex flex-col lg:flex-row items-start justify-between mt-6 sm:mt-10 md:mt-20 mb-6 sm:mb-10 md:mb-20 gap-6 sm:gap-8"
        id="hero"
      >
        {/* Left Column */}
        <div className="flex-1 flex flex-col items-start justify-start text-left">
          <h1 className="text-[#676561] font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-0 drop-shadow-[2px_2px_0_#e0e7ef,4px_4px_0_#d8c8f5,0_2px_8px_rgba(0,0,0,0.12)]">
            {typed.split("\n")[0]}
            {typed.length <= headline.length && (
              <span
                style={{
                  opacity: showCursor ? 1 : 0,
                  transition: "opacity 0.2s",
                  color: "#676561",
                  fontWeight: "bold",
                }}
              >
                |
              </span>
            )}
          </h1>
          <h2 className="text-[#a5cffd] font-extrabold text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl tracking-tight leading-tight mb-0 drop-shadow-[2px_2px_0_#676561,4px_4px_0_#d8c8f5,0_2px_8px_rgba(0,0,0,0.12)]">
            {typed.length > headline.length ? typed.split("\n")[1] : ""}
            {typed.length > headline.length && (
              <span
                style={{
                  opacity: showCursor ? 1 : 0,
                  transition: "opacity 0.2s",
                  color: "#a5cffd",
                  fontWeight: "bold",
                }}
              >
                |
              </span>
            )}
          </h2>
          <p className="mt-4 sm:mt-6 text-gray-700 w-full text-left text-base sm:text-lg leading-relaxed mb-0">
            <span className="font-extrabold text-orange-300">
              Study magic, zero panic.
            </span>{" "}
            Wisker turns your notes into quizzes, flashcards, and study
            plans—fast. Less stress, more wins.
          </p>
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 mt-6 sm:mt-8 w-full">
            <a
              href="/signup"
              className="bg-purple-100 text-gray-700 font-bold border-2 sm:border-4 border-gray-600 rounded-xl sm:rounded-2xl shadow-[2px_2px_0_#666] sm:shadow-[4px_4px_0_#666] px-4 sm:px-6 md:px-8 py-2 text-sm sm:text-base md:text-lg transition-transform duration-150 outline-none focus:outline-none active:scale-95 hover:scale-105 w-full sm:w-auto text-center no-underline"
            >
              Let&apos;s Ace That Exam
            </a>
          </div>
          {/* Metrics section */}
          <div className="flex flex-row flex-wrap gap-6 mt-6 sm:mt-8 w-full justify-start">
            <div className="flex flex-col items-start">
              <span className="text-2xl sm:text-3xl font-extrabold text-orange-300">
                1,200+
              </span>
              <span className="text-gray-700 text-sm sm:text-base font-semibold">
                Students helped
              </span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-400">
                3,400+
              </span>
              <span className="text-gray-700 text-sm sm:text-base font-semibold">
                Quizzes generated
              </span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-2xl sm:text-3xl font-extrabold text-purple-400">
                7,800+
              </span>
              <span className="text-gray-700 text-sm sm:text-base font-semibold">
                Flashcards created
              </span>
            </div>
          </div>
        </div>
        {/* Right Column: Example image or illustration */}
        <div className="flex-1 flex justify-center items-center mt-6 sm:mt-8 lg:mt-0">
          <div className="group w-full flex justify-center">
            <Image
              src="/images/wisker_mockup.png"
              alt="Wisker Preview"
              width={350}
              height={160}
              className="w-full max-w-[220px] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg h-auto rounded-xl sm:rounded-3xl border-2 sm:border-4 px-1 sm:px-2 py-1 sm:py-2 bg-[#e6f0ff] object-cover group-hover:scale-105 transition-transform duration-200"
              style={{
                borderColor: "#4a90e2",
                boxShadow: `8px 8px 0 #b3d1ff, 0 2px 12px rgba(74,144,226,0.10), 0 0 0 4px #fafafa, 0 4px 16px #a5cffd, 0 0 0 1px #8bb6f7`,
              }}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
