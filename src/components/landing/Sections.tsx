import React from "react";
import Image from "next/image";
import Link from "next/link";
import { LuCheck } from "react-icons/lu";
import Mascot, { type MascotName } from "@/components/ui/Mascot";
import { buttonClasses } from "@/components/ui/button";

const container = "mx-auto w-full max-w-[1180px] px-5 sm:px-6";
const h2 =
  "text-[clamp(1.875rem,5vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.015em]";

/* -------------------------------------------------------------------------- */

const SUBJECTS = [
  "Biology",
  "Organic Chem",
  "Nursing boards",
  "Torts",
  "Anatomy",
  "Stats",
];

/** Slow-scrolling subject ribbon. The duplicate set is hidden from assistive tech. */
export function Marquee() {
  const set = (hidden: boolean) =>
    SUBJECTS.map((s) => (
      <span
        key={`${hidden}-${s}`}
        aria-hidden={hidden || undefined}
        className="flex items-center gap-10"
      >
        {s}
        <span className="text-[#f0c089]" aria-hidden>
          ✦
        </span>
      </span>
    ));
  return (
    <div
      aria-label="Subjects students study with Wisker"
      role="group"
      className="overflow-hidden border-y border-[#f2e7d8] bg-[#fff4e8] py-3.5"
    >
      <div className="animate-marquee flex w-max gap-10 whitespace-nowrap font-display text-base font-medium text-orange-800">
        {set(false)}
        {set(true)}
        {set(true)}
        {set(true)}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const REASONS = [
  "Questions come from your files, so you revise what your lecturer actually said.",
  "Miss one and it comes back, so the weak spots get the repetitions.",
  "A whole semester of material stays in one place, sorted by subject.",
];

export function WhyItWorks() {
  return (
    <section id="recall" className={`${container} py-16 sm:py-24`}>
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="eyebrow !text-orange-700">Why it works</p>
          <h2 className={`${h2} mt-3`}>
            Highlighting feels like studying. Recall{" "}
            <em className="not-italic text-indigo-500">is</em> studying.
          </h2>
          <p className="mt-[18px] text-lg leading-[1.6] text-gray-600">
            Every time you pull an answer out of your own head, the memory gets
            harder to lose. That&apos;s the whole method. The problem was never
            the science. It was the two hours it takes to write your own
            flashcards at 1am.
          </p>
          <p className="mt-3.5 text-lg leading-[1.6] text-gray-600">
            Wisker does that part. You do the remembering.
          </p>
          <ul className="mt-7 grid gap-3.5">
            {REASONS.map((r) => (
              <li key={r} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-indigo-500 text-white">
                  <LuCheck className="h-4 w-4" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-[17px] font-semibold leading-[1.45] text-ink">
                  {r}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[36px] bg-indigo-100 lg:aspect-auto lg:min-h-[440px]">
          {/* The artwork has a white canvas; multiply lets the tint show through. */}
          <Image
            src="/images/wisker_sample.png"
            alt="Wisker on a phone: a list of subjects and generated study notes"
            fill
            sizes="(min-width: 1024px) 560px, 92vw"
            className="scale-[1.32] object-contain mix-blend-multiply"
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

const STEPS = [
  {
    title: "Upload",
    body: "Drag in PDFs, slides and notes. One file or a whole module's worth.",
  },
  {
    title: "Wisker reads it",
    body: "Your content is parsed and organised into a study space by subject.",
  },
  {
    title: "Generate",
    body: "Pick what you need: a quiz, a flashcard deck, or a summary to skim first.",
  },
  {
    title: "Recall",
    body: "Work through it, get it wrong, get it right, and watch it stick.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-ink py-16 text-cream sm:py-24">
      <div className={container}>
        <div className="max-w-[640px]">
          <p className="eyebrow !text-orange-500">How it works</p>
          <h2 className={`${h2} mt-3`}>Upload at 9. Quizzing yourself by 9:01.</h2>
        </div>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-12 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="rounded-[26px] border border-[#3d3733] bg-[#2e2926] p-6 sm:p-[26px]"
            >
              <span className="grid h-[38px] w-[38px] place-items-center rounded-[13px] bg-orange-500 font-display text-[15px] font-semibold text-ink">
                {i + 1}
              </span>
              <h3 className="mb-2 mt-[18px] text-[21px] font-semibold leading-[1.2]">
                {s.title}
              </h3>
              <p className="text-[15.5px] leading-[1.55] text-[#b6aba1]">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap items-center gap-x-[18px] gap-y-3.5 lg:mt-11">
          <Link
            href="/signup"
            className={`${buttonClasses({ size: "lg" })} !shadow-[0_5px_0_#c97112]`}
          >
            Upload your first file
          </Link>
          <span className="text-[15px] font-semibold text-[#b6aba1]">
            PDF, PowerPoint and plain notes supported.
          </span>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

const TOOLS: {
  title: string;
  body: string;
  tint: string;
  mascot: MascotName;
}[] = [
  {
    title: "Quizzes that ask, not tell",
    body: "Multiple-choice sets generated from your material, ready the moment the upload finishes.",
    tint: "bg-[#ffefd9]",
    mascot: "check",
  },
  {
    title: "Flashcards without the busywork",
    body: "Key concepts pulled out and turned into cards, so you skip the two hours of typing.",
    tint: "bg-indigo-100",
    mascot: "cards",
  },
  {
    title: "Summaries for the first pass",
    body: "A clean overview of a dense reading before you start testing yourself on it.",
    tint: "bg-green-50",
    mascot: "read",
  },
  {
    title: "Subjects that stay organised",
    body: "Everything grouped by course, so picking up where you left off takes one tap.",
    tint: "bg-red-100",
    mascot: "search",
  },
];

export function StudyTools() {
  return (
    <section id="tools" className={`${container} py-16 sm:py-24`}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-[600px]">
          <p className="eyebrow !text-orange-700">Study tools</p>
          <h2 className={`${h2} mt-3`}>Four ways to attack the same material</h2>
        </div>
        <Mascot name="idea" size={110} className="hidden sm:block" />
      </div>
      <ul className="mt-10 grid gap-5 sm:gap-[22px] md:grid-cols-2 lg:mt-11">
        {TOOLS.map((t) => (
          <li
            key={t.title}
            className="card card-interactive flex items-start gap-5 rounded-[28px] p-6 shadow-[0_5px_0_#efe0cc] sm:gap-[22px] sm:p-8"
          >
            <span
              className={`grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[20px] ${t.tint}`}
            >
              <Mascot name={t.mascot} size={52} />
            </span>
            <div>
              <h3 className="mb-2 text-[21px] font-semibold leading-[1.2] sm:text-[23px]">
                {t.title}
              </h3>
              <p className="text-base leading-[1.55] text-gray-600 sm:text-[16.5px]">
                {t.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

const OCCASIONS = [
  "Exam week",
  "Board exams",
  "Lecture catch-up",
  "Self-learners",
  "Semester notes",
];

export function FinalsBand() {
  return (
    <section className={`${container} pb-16 sm:pb-24`}>
      <div className="grid items-center gap-8 overflow-hidden rounded-[32px] bg-indigo-500 p-7 text-white sm:rounded-[40px] sm:p-12 lg:grid-cols-[1fr_0.8fr] lg:gap-10 lg:p-14">
        <div>
          <h2 className="text-[clamp(1.75rem,4.6vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.015em]">
            Made for the week before finals
          </h2>
          <p className="mt-[18px] max-w-[480px] text-lg leading-[1.6] text-indigo-100">
            Twelve lectures, four readings and a slide deck you never opened.
            Group them by subject, generate what you need, and work through it
            on your phone between classes.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {OCCASIONS.map((o) => (
              <li
                key={o}
                className="whitespace-nowrap rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[15px] font-bold"
              >
                {o}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid place-items-center">
          <Mascot name="point" size={260} float className="h-auto w-full max-w-[200px] sm:max-w-[260px]" />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

export function FinalCTA() {
  return (
    <section className="border-t border-[#f7ddb6] bg-[#ffefd9]">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-7 px-5 py-16 text-center sm:px-6 sm:py-20">
        <Mascot name="star" size={130} />
        <div>
          <h2 className="mx-auto max-w-[680px] text-[clamp(2rem,6vw,3.125rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
            Your notes are already there. Put them to work.
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] text-lg text-[#6f5f4a] sm:text-[19px]">
            Free to start. First quiz in under a minute.
          </p>
        </div>
        <Link
          href="/signup"
          className={`${buttonClasses({ variant: "ink", size: "lg" })} !shadow-[0_6px_0_#c79c63]`}
        >
          Get started free
        </Link>
      </div>
    </section>
  );
}
