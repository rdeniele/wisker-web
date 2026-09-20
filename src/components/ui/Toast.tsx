"use client";

import { useEffect, useRef } from "react";
import { LuCircleCheck, LuCircleAlert, LuInfo, LuTriangleAlert, LuX } from "react-icons/lu";

export type ToastSeverity = "success" | "info" | "warning" | "error";

export interface ToastProps {
  open: boolean;
  message: string;
  severity: ToastSeverity;
  onClose: () => void;
  duration?: number;
}

const tone: Record<
  ToastSeverity,
  { icon: React.ReactNode; bar: string; iconWrap: string }
> = {
  success: {
    icon: <LuCircleCheck className="h-5 w-5" aria-hidden />,
    bar: "bg-green-400",
    iconWrap: "bg-green-100 text-green-700",
  },
  info: {
    icon: <LuInfo className="h-5 w-5" aria-hidden />,
    bar: "bg-indigo-400",
    iconWrap: "bg-indigo-100 text-indigo-700",
  },
  warning: {
    icon: <LuTriangleAlert className="h-5 w-5" aria-hidden />,
    bar: "bg-yellow-400",
    iconWrap: "bg-yellow-100 text-yellow-700",
  },
  error: {
    icon: <LuCircleAlert className="h-5 w-5" aria-hidden />,
    bar: "bg-red-400",
    iconWrap: "bg-red-100 text-red-700",
  },
};

/**
 * Wisker toast. Announces politely (assertively for errors), auto-dismisses,
 * pauses its timer while hovered/focused, and sits clear of the mobile header.
 */
export default function Toast({
  open,
  message,
  severity,
  onClose,
  duration = 5000,
}: ToastProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const start = () => {
    clear();
    timer.current = setTimeout(() => onCloseRef.current(), duration);
  };

  useEffect(() => {
    if (!open) return clear;
    start();
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, message, duration]);

  if (!open) return null;
  const t = tone[severity] ?? tone.info;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] md:pt-5">
      <div
        role={severity === "error" ? "alert" : "status"}
        aria-live={severity === "error" ? "assertive" : "polite"}
        onMouseEnter={clear}
        onMouseLeave={start}
        onFocus={clear}
        onBlur={start}
        className="animate-toast-in pointer-events-auto relative flex w-full max-w-md items-start gap-3 overflow-hidden rounded-2xl border border-line bg-white py-3 pl-4 pr-2 shadow-xl"
      >
        <span className={`absolute inset-y-0 left-0 w-1.5 ${t.bar}`} aria-hidden />
        <span
          className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${t.iconWrap}`}
        >
          {t.icon}
        </span>
        <p className="min-w-0 flex-1 py-1 text-[15px] font-semibold leading-snug text-ink">
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-icon -my-0.5 h-10 w-10 shrink-0 text-gray-500"
          aria-label="Dismiss notification"
        >
          <LuX className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
