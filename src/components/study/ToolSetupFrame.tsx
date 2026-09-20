"use client";

import React, { useId } from "react";
import {
  LuArrowLeft,
  LuBookOpen,
  LuLayers,
  LuListChecks,
  LuSparkles,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StudyTool = "quiz" | "flashcard" | "summary";

export const TOOL_META: Record<
  StudyTool,
  { label: string; setupTitle: string; icon: IconType; tone: string; chip: string }
> = {
  quiz: {
    label: "Quiz",
    setupTitle: "Quiz setup",
    icon: LuListChecks,
    tone: "bg-orange-100 text-orange-700",
    chip: "chip",
  },
  flashcard: {
    label: "Flashcards",
    setupTitle: "Flashcard setup",
    icon: LuLayers,
    tone: "bg-indigo-100 text-indigo-700",
    chip: "chip chip-accent",
  },
  summary: {
    label: "Summary",
    setupTitle: "Summary setup",
    icon: LuBookOpen,
    tone: "bg-green-100 text-green-700",
    chip: "chip chip-success",
  },
};

interface ToolSetupFrameProps {
  tool: StudyTool;
  /** Sentence under the title, e.g. "Customize your quiz on Biology". */
  subtitle: React.ReactNode;
  /** Small chip, e.g. "Based on 3 selected notes". */
  context?: string;
  backLabel: string;
  onBack: () => void;
  submitLabel: string;
  generatingLabel: string;
  isGenerating: boolean;
  onSubmit: () => void;
  /** Warnings shown above the options. */
  notice?: React.ReactNode;
  tip?: React.ReactNode;
  children: React.ReactNode;
}

/** Shared page frame for the three "configure, then generate" screens. */
export default function ToolSetupFrame({
  tool,
  subtitle,
  context,
  backLabel,
  onBack,
  submitLabel,
  generatingLabel,
  isGenerating,
  onSubmit,
  notice,
  tip,
  children,
}: ToolSetupFrameProps) {
  const meta = TOOL_META[tool];
  const Icon = meta.icon;

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={onBack}
        className="group -ml-2 mb-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-[15px] font-bold text-gray-600 hover:text-ink"
      >
        <LuArrowLeft
          className="h-5 w-5 transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        />
        {backLabel}
      </button>

      <header className="flex items-start gap-4">
        <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl", meta.tone)}>
          <Icon className="h-7 w-7" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-4xl">
            {meta.setupTitle}
          </h1>
          <p className="mt-1.5 text-base font-semibold leading-snug text-gray-600 sm:text-lg">
            {subtitle}
          </p>
          {context && <p className={cn("mt-2.5", meta.chip)}>{context}</p>}
        </div>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isGenerating) onSubmit();
        }}
        className="card mt-6 space-y-7 rounded-[28px] p-5 sm:p-7"
      >
        {notice}
        {children}

        <div>
          <Button type="submit" size="lg" fullWidth isLoading={isGenerating}>
            {isGenerating ? generatingLabel : submitLabel}
          </Button>
          <p
            role="status"
            aria-live="polite"
            className="mt-3 flex items-start justify-center gap-2 text-center text-sm font-semibold text-gray-600"
          >
            <LuSparkles className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" aria-hidden />
            <span>
              {isGenerating
                ? "Hang tight. This usually takes a few seconds."
                : tip}
            </span>
          </p>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------ option groups */

export interface Option<T extends string | number> {
  value: T;
  label: string;
  description?: string;
  icon?: IconType;
}

/** Radio group rendered as big tappable cards. */
export function OptionCards<T extends string | number>({
  legend,
  options,
  value,
  onChange,
  columns = 3,
}: {
  legend: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  columns?: 2 | 3;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-3 font-display text-lg font-semibold text-ink">{legend}</legend>
      <div
        role="radiogroup"
        aria-label={legend}
        className={cn("grid gap-3", columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}
      >
        {options.map((o) => {
          const selected = o.value === value;
          const Icon = o.icon;
          return (
            <label
              key={String(o.value)}
              className={cn(
                "relative flex min-h-[64px] cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-3.5 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-500/55 sm:flex-col sm:items-start sm:gap-2",
                selected
                  ? "border-orange-400 bg-orange-50"
                  : "border-line bg-white hover:border-[#f3cfa0]",
              )}
            >
              <input
                type="radio"
                name={name}
                value={String(o.value)}
                checked={selected}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {Icon && (
                <Icon
                  className={cn("h-6 w-6 shrink-0", selected ? "text-orange-700" : "text-gray-600")}
                  aria-hidden
                />
              )}
              <span className="min-w-0">
                <span className="block font-bold text-ink">{o.label}</span>
                {o.description && (
                  <span className="block text-sm font-semibold leading-snug text-gray-600">
                    {o.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Compact number picker (question / card counts). */
export function CountPicker({
  legend,
  values,
  value,
  onChange,
}: {
  legend: string;
  values: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-3 font-display text-lg font-semibold text-ink">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2.5">
        {values.map((n) => (
          <label
            key={n}
            className={cn(
              "grid h-12 min-w-[56px] flex-1 cursor-pointer place-items-center rounded-2xl border-2 px-3 font-display text-lg font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-500/55",
              n === value
                ? "border-orange-400 bg-orange-500 text-ink shadow-[0_3px_0_#d97b18]"
                : "border-line bg-white text-gray-700 hover:border-[#f3cfa0]",
            )}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={n === value}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            {n}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
