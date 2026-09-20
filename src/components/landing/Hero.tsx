"use client";

import React, { useId, useRef, useState } from "react";
import Link from "next/link";
import { LuCheck, LuFileUp, LuX } from "react-icons/lu";
import Mascot from "@/components/ui/Mascot";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = ["Ribosome", "Mitochondrion", "Golgi apparatus", "Lysosome"];
const CORRECT = 1;

/** Drop target that hands visitors to sign-up once they've picked a file. */
function DropZone() {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = (file?: File | null) => {
    if (!file) return;
    setDragging(false);
    setName(file.name);
  };

  if (name) {
    return (
      <div
        role="status"
        className="relative mb-4 flex items-center gap-4 rounded-[26px] border-2 border-[#b0e1c2] bg-green-50 p-4 sm:p-5"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-300 text-white">
          <LuCheck className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[17px] font-medium text-ink">
            {name}
          </p>
          <p className="text-sm font-semibold text-gray-600">
            Create a free account to turn it into a quiz.
          </p>
        </div>
        <Link href="/signup" className={buttonClasses({ size: "sm" })}>
          Sign up
        </Link>
        <button
          type="button"
          onClick={() => setName(null)}
          aria-label="Remove file"
          className="btn btn-icon -mr-1 hidden h-10 w-10 sm:inline-flex"
        >
          <LuX className="h-5 w-5" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        accept(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "relative mb-4 block cursor-pointer rounded-[26px] border-2 border-dashed p-5 text-center transition-colors focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-indigo-500/55 sm:p-[22px]",
        dragging
          ? "border-orange-500 bg-orange-100"
          : "border-[#f3d6ae] bg-[#fff4e8] hover:border-orange-400",
      )}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".pdf,.ppt,.pptx,.txt,.md,.doc,.docx"
        className="sr-only"
        onChange={(e) => accept(e.target.files?.[0])}
      />
      <span className="flex items-center justify-center gap-2 font-display text-[19px] font-medium text-ink">
        <LuFileUp className="h-5 w-5 text-orange-700" aria-hidden />
        Drop a lecture PDF or slide deck
      </span>
      <span className="mt-1.5 block text-[14.5px] font-semibold text-gray-600">
        or tap to choose a file · PDF, PPTX, notes
      </span>
    </label>
  );
}

function QuizPreview() {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;

  const hint = !answered
    ? "Tap an answer. This is a real generated question."
    : picked === CORRECT
      ? "Correct. Wisker brings back the ones you miss, so weak spots get more reps."
      : "Not quite. The answer is Mitochondrion, and Wisker will ask again soon.";

  return (
    <div className="relative rounded-[32px] border border-[#f0e4d4] bg-white p-5 shadow-[0_8px_0_#efe0cc] sm:p-[26px]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-display text-[13px] font-semibold uppercase tracking-[0.04em] text-gray-500 sm:text-sm">
          Quiz · from Biology_Lec4.pdf
        </p>
        <span className="shrink-0 rounded-full bg-indigo-100 px-3 py-1 text-[13px] font-bold text-indigo-700">
          Q3 of 12
        </span>
      </div>
      <p className="mb-5 font-display text-[22px] font-medium leading-[1.25] text-ink sm:text-[26px]">
        Which organelle generates most of the cell&apos;s ATP?
      </p>
      <div role="group" aria-label="Answers" className="grid gap-2.5">
        {OPTIONS.map((label, i) => {
          const isCorrect = i === CORRECT;
          const isPicked = picked === i;
          const state = answered
            ? isCorrect
              ? "correct"
              : isPicked
                ? "wrong"
                : "dim"
            : "idle";
          return (
            <button
              key={label}
              type="button"
              onClick={() => setPicked(i)}
              aria-pressed={isPicked}
              className={cn(
                "flex min-h-[56px] w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base font-semibold transition-[background-color,border-color,transform] duration-150 active:scale-[0.985]",
                state === "idle" &&
                  "border-[#f0e4d4] bg-[#fffdfa] text-ink hover:border-[#f3cfa0] hover:bg-orange-50",
                state === "correct" && "border-green-300 bg-green-50 text-ink",
                state === "wrong" && "border-red-300 bg-red-50 text-ink",
                state === "dim" && "border-[#f0e4d4] bg-[#fffdfa] text-gray-500",
              )}
            >
              <span
                className={cn(
                  "grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[9px] text-[13px] font-extrabold",
                  state === "correct" && "bg-green-500 text-white",
                  state === "wrong" && "bg-red-500 text-white",
                  (state === "idle" || state === "dim") &&
                    "bg-[#f6efe6] text-gray-600",
                )}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{label}</span>
              {state === "correct" && (
                <LuCheck className="h-5 w-5 text-green-600" aria-label="Correct" />
              )}
              {state === "wrong" && (
                <LuX className="h-5 w-5 text-red-600" aria-label="Incorrect" />
              )}
            </button>
          );
        })}
      </div>
      <p
        aria-live="polite"
        className="mt-4 min-h-[2.75rem] max-w-[62%] text-sm font-semibold leading-snug text-gray-600 sm:min-h-0 sm:max-w-none"
      >
        {hint}
      </p>
    </div>
  );
}

export default function Hero() {
  return (
    <section
      id="top"
      className="mx-auto grid max-w-[1180px] items-center gap-12 px-5 pb-16 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-20 lg:pt-[72px]"
    >
      <div>
        <span className="inline-flex max-w-full rounded-full border border-[#fad9a8] bg-[#ffefd9] px-3.5 py-[7px] text-[13px] font-bold tracking-[0.02em] text-orange-800">
          Built on active recall, not highlighting
        </span>
        <h1 className="mt-5 text-[clamp(2.5rem,8.5vw,4.125rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-ink">
          Stop re-reading.
          <br />
          Start <span className="text-orange-500">remembering</span>.
        </h1>
        <p className="mt-5 max-w-[520px] text-lg leading-[1.5] text-gray-600 sm:text-xl">
          Drop in your PDFs, lecture slides and notes. Wisker turns them into
          quizzes, flashcards and summaries in seconds, so every study session
          actually tests you.
        </p>
        <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
          <Link href="/signup" className={buttonClasses({ size: "lg" })}>
            Start studying free
          </Link>
          <a
            href="#how"
            className={buttonClasses({ variant: "secondary", size: "lg" })}
          >
            See how it works
          </a>
        </div>
        <div className="mt-7 flex items-center gap-2.5 text-[15px] font-semibold text-gray-600">
          <Mascot name="hi" size={38} />
          <span>10,000+ students studying with Wisky. Free to start, no card.</span>
        </div>
      </div>

      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-x-3 -bottom-3 -top-6 -rotate-[2.5deg] rounded-[44px] bg-[#ffefd9]"
        />
        <div className="relative">
          <DropZone />
          <QuizPreview />
          <Mascot
            name="laptop"
            size={150}
            float
            className="pointer-events-none absolute -bottom-12 right-0 h-[110px] w-[110px] sm:-bottom-14 sm:-right-6 sm:h-[150px] sm:w-[150px]"
          />
        </div>
      </div>
    </section>
  );
}
