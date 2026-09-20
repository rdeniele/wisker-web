"use client";

import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { LuX } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** Sticky action row. Stacks full-width on phones. */
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  /** Hide the title visually but keep it for screen readers. */
  hideTitle?: boolean;
  /** Prevent closing via backdrop / Esc (e.g. while a request is in flight). */
  locked?: boolean;
  className?: string;
}

const sizeClass = { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl" };

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog. Bottom sheet on phones (thumb reachable, drag-free),
 * centred card from `sm` up. Traps focus, closes on Esc/backdrop, restores
 * focus and locks body scroll while open.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  hideTitle,
  locked,
  className,
}: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const lockedRef = useRef(locked);
  // Keep the latest callbacks reachable from the long-lived key handler below.
  useEffect(() => {
    onCloseRef.current = onClose;
    lockedRef.current = locked;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    // Focus the first field if there is one, otherwise the panel itself.
    const firstField = panel?.querySelector<HTMLElement>(
      "input:not([type=hidden]),textarea,select",
    );
    (firstField ?? panel)?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !lockedRef.current) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="animate-fade-in absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={() => !locked && onClose()}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "animate-sheet-up sm:animate-pop-in relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-white shadow-2xl outline-none sm:max-h-[86dvh] sm:rounded-[28px]",
          sizeClass[size],
          className,
        )}
      >
        {/* grab handle: purely visual cue that this is a sheet on phones */}
        <div
          className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-gray-200 sm:hidden"
          aria-hidden
        />
        <div className="flex items-start gap-3 px-5 pb-2 pt-3 sm:px-7 sm:pt-6">
          <div className={cn("min-w-0 flex-1", hideTitle && "sr-only")}>
            <h2
              id={titleId}
              className="text-xl font-semibold leading-tight text-ink sm:text-2xl"
            >
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1.5 text-[15px] text-gray-600">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={locked}
            aria-label="Close dialog"
            className="btn btn-icon -mr-2 -mt-1 shrink-0 text-gray-600"
          >
            <LuX className="h-6 w-6" aria-hidden />
          </button>
        </div>

        {children ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3 sm:px-7">
            {children}
          </div>
        ) : (
          <div className="h-2" aria-hidden />
        )}

        {footer && (
          <div className="pb-safe flex flex-col-reverse gap-3 border-t border-line px-5 py-4 sm:flex-row sm:justify-end sm:px-7 [&>*]:sm:min-w-[120px]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
