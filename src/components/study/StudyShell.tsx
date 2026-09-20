"use client";

import React, { useEffect, useRef } from "react";
import { LuX } from "react-icons/lu";
import ProgressBar from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";

interface StudyShellProps {
  /** Short label, e.g. the subject or note being studied. */
  title: string;
  /** e.g. "Question 3 of 12". */
  subtitle?: string;
  onExit: () => void;
  exitLabel?: string;
  /** 0-100. Omit to hide the bar (loading / error states). */
  progress?: number;
  progressLabel?: string;
  /** Right-hand header content (score, restart…). */
  aside?: React.ReactNode;
  children: React.ReactNode;
  /** Pinned action area. Always inside the safe area, never covered by the keyboard-free UI. */
  footer?: React.ReactNode;
  tone?: "brand" | "accent" | "success";
  /** Vertically centre the body (setup-like, short content). */
  centered?: boolean;
}

/**
 * Focus mode for active study. Covers the app chrome (sidebar, headers, tab bar)
 * so the only things on screen are the material, the progress and the next action.
 */
export default function StudyShell({
  title,
  subtitle,
  onExit,
  exitLabel = "Exit",
  progress,
  progressLabel = "Progress",
  aside,
  children,
  footer,
  tone = "brand",
  centered,
}: StudyShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    rootRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      role="region"
      aria-label={`${title} study session`}
      className="animate-fade-in fixed inset-0 z-[70] flex flex-col bg-cream outline-none"
    >
      <header className="pt-safe shrink-0 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-2 px-2 sm:px-4">
          <button
            type="button"
            onClick={onExit}
            aria-label={exitLabel}
            className="btn btn-icon h-12 w-12 shrink-0 text-gray-700"
          >
            <LuX className="h-6 w-6" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-semibold leading-tight text-ink">
              {title}
            </p>
            {subtitle && (
              <p className="truncate text-[13px] font-bold text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
          {aside && <div className="flex shrink-0 items-center gap-1 pr-1">{aside}</div>}
        </div>
        {progress !== undefined && (
          <ProgressBar
            value={progress}
            label={progressLabel}
            tone={tone}
            size="sm"
            className="rounded-none bg-gray-100"
          />
        )}
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div
          className={cn(
            "mx-auto flex w-full max-w-2xl flex-col px-4 py-6 sm:py-10",
            centered && "min-h-full justify-center",
          )}
        >
          {children}
        </div>
      </main>

      {footer && (
        <footer className="pb-safe shrink-0 border-t border-line bg-white">
          <div className="mx-auto w-full max-w-2xl px-4 py-3">{footer}</div>
        </footer>
      )}
    </div>
  );
}
