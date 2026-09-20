"use client";

import React from "react";
import { OptionCards } from "./ToolSetupFrame";
import {
  LENGTH_OPTIONS,
  TYPE_OPTIONS,
  type SummaryLength,
  type SummaryType,
} from "./options";

const PREVIEW: Record<SummaryType, Record<SummaryLength, string>> = {
  paragraph: {
    short: "A brief, flowing summary in 2-3 sentences, covering the main ideas.",
    medium: "A balanced, narrative summary with key details and transitions between concepts.",
    detailed: "A comprehensive, multi-paragraph summary with examples and deeper explanations.",
  },
  bullet: {
    short: "A quick list of the main ideas (3 bullets).",
    medium: "Key concepts and supporting details, organized for clarity (6 bullets).",
    detailed: "A comprehensive breakdown with examples, sub-points and explanations (10 bullets).",
  },
  keypoints: {
    short: "3 main concepts only.",
    medium: "5 essential ideas, no extra details.",
    detailed: "8 major concepts with brief context.",
  },
};

/** Length + format pickers with a plain-language preview of what you'll get. */
export default function SummaryOptions({
  length,
  type,
  onLength,
  onType,
}: {
  length: SummaryLength;
  type: SummaryType;
  onLength: (v: SummaryLength) => void;
  onType: (v: SummaryType) => void;
}) {
  const typeLabel = TYPE_OPTIONS.find((t) => t.value === type)?.label;
  return (
    <>
      <OptionCards legend="Summary length" options={LENGTH_OPTIONS} value={length} onChange={onLength} />
      <OptionCards legend="Summary format" options={TYPE_OPTIONS} value={type} onChange={onType} />
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4" aria-live="polite">
        <p className="eyebrow !text-indigo-700">You&apos;ll get · {typeLabel}</p>
        <p className="mt-1 text-[15px] font-semibold leading-relaxed text-gray-700">
          {PREVIEW[type][length]}
        </p>
      </div>
    </>
  );
}
