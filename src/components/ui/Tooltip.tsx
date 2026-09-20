import React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  side?: "right" | "top" | "bottom";
  className?: string;
}

const pos = {
  right: "left-full top-1/2 ml-3 -translate-y-1/2",
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
};

/**
 * CSS-only tooltip: shows on hover and keyboard focus, never on touch (so it
 * can't get stuck). The wrapped control should already have its own
 * accessible name; this is a visual affordance for icon-only controls.
 */
export default function Tooltip({
  label,
  children,
  side = "right",
  className,
}: TooltipProps) {
  return (
    <span className={cn("group/tip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-[70] whitespace-nowrap rounded-xl bg-ink px-3 py-1.5 text-sm font-bold text-cream opacity-0 shadow-xl transition-opacity duration-150 [@media(hover:hover)]:group-hover/tip:opacity-100 group-focus-within/tip:opacity-100",
          pos[side],
        )}
      >
        {label}
      </span>
    </span>
  );
}
