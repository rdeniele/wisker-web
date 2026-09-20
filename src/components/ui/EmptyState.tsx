import React from "react";
import { cn } from "@/lib/utils";
import Mascot, { type MascotName } from "./Mascot";

interface EmptyStateProps {
  /** Short headline. Falls back to `message` for older call sites. */
  title?: string;
  message?: string;
  description?: string;
  mascot?: MascotName;
  action?: React.ReactNode;
  className?: string;
  /** "card" draws a dashed, tinted panel; "plain" is just centred content. */
  variant?: "card" | "plain";
}

/** Friendly empty state: mascot, one clear line, one clear next step. */
export default function EmptyState({
  title,
  message,
  description,
  mascot = "idle",
  action,
  className = "",
  variant = "card",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "col-span-full flex flex-col items-center px-6 py-10 text-center sm:py-14",
        variant === "card" &&
          "rounded-[28px] border-2 border-dashed border-[#f3d6ae] bg-sand",
        className,
      )}
    >
      <Mascot name={mascot} size={112} />
      <h3 className="mt-3 text-xl font-semibold text-ink">
        {title ?? message ?? "Nothing here yet."}
      </h3>
      {(description ?? (title ? message : undefined)) && (
        <p className="mt-1.5 max-w-sm text-[15px] leading-relaxed text-gray-600">
          {description ?? message}
        </p>
      )}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
