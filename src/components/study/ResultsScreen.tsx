"use client";

import React from "react";
import StudyShell from "./StudyShell";
import Mascot, { type MascotName } from "@/components/ui/Mascot";
import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResultsScreenProps {
  title: string;
  score: number;
  total: number;
  onRetry: () => void;
  onBack: () => void;
  backLabel?: string;
  retryLabel?: string;
}

function verdict(pct: number): { message: string; mascot: MascotName; tone: string } {
  if (pct >= 90) return { message: "Outstanding!", mascot: "star", tone: "text-green-700" };
  if (pct >= 70) return { message: "Great job!", mascot: "happy", tone: "text-indigo-700" };
  if (pct >= 50) return { message: "Good effort. Go again?", mascot: "gym", tone: "text-yellow-700" };
  return { message: "Keep practicing, it sticks with reps.", mascot: "read", tone: "text-orange-700" };
}

/** End-of-quiz summary. Big number first, then the next action. */
export default function ResultsScreen({
  title,
  score,
  total,
  onRetry,
  onBack,
  backLabel = "Back to subject",
  retryLabel = "Retake quiz",
}: ResultsScreenProps) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const v = verdict(percentage);

  return (
    <StudyShell
      title={title}
      subtitle="Quiz complete"
      onExit={onBack}
      exitLabel={backLabel}
      progress={100}
      progressLabel="Quiz complete"
      tone="success"
      centered
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button variant="secondary" size="lg" fullWidth onClick={onBack}>
            {backLabel}
          </Button>
          <Button size="lg" fullWidth onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      }
    >
      <div className="animate-pop-in text-center">
        <Mascot name={v.mascot} size={150} className="mx-auto" />
        <h1 className="mt-2 text-[2rem] font-semibold leading-tight text-ink">
          Quiz complete!
        </h1>
        <p className="mt-1 text-[15px] font-semibold text-gray-600">
          You finished the quiz on <span className="font-extrabold text-ink">{title}</span>
        </p>

        <div className="mx-auto mt-6 max-w-sm rounded-[28px] border border-[#f3d6ae] bg-[#ffefd9] p-6 shadow-[0_5px_0_#f6d3a4]">
          <p className="font-display text-[4.5rem] font-semibold leading-none text-ink">
            {percentage}%
          </p>
          <p className="mt-3 text-lg font-bold text-gray-700">
            {score} out of {total} correct
          </p>
          <p className={cn("mt-1 font-display text-lg font-semibold", v.tone)}>{v.message}</p>
        </div>

        <dl className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-2.5">
          {[
            { label: "Correct", value: score, tone: "text-green-700" },
            { label: "Missed", value: total - score, tone: "text-red-700" },
            { label: "Total", value: total, tone: "text-ink" },
          ].map((s) => (
            <div key={s.label} className="card rounded-2xl px-2 py-3">
              <dd className={cn("font-display text-2xl font-semibold", s.tone)}>{s.value}</dd>
              <dt className="text-[13px] font-bold text-gray-600">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </StudyShell>
  );
}
