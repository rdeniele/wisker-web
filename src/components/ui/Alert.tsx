import React from "react";
import {
  LuCircleAlert,
  LuCircleCheck,
  LuInfo,
  LuTriangleAlert,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

interface AlertProps {
  tone?: "info" | "success" | "warning" | "error";
  title?: string;
  children?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

const styles = {
  info: {
    wrap: "bg-indigo-50 border-indigo-200 text-indigo-900",
    icon: <LuInfo className="h-5 w-5 text-indigo-600" aria-hidden />,
  },
  success: {
    wrap: "bg-green-50 border-green-200 text-green-900",
    icon: <LuCircleCheck className="h-5 w-5 text-green-600" aria-hidden />,
  },
  warning: {
    wrap: "bg-yellow-50 border-yellow-200 text-yellow-900",
    icon: <LuTriangleAlert className="h-5 w-5 text-yellow-600" aria-hidden />,
  },
  error: {
    wrap: "bg-red-50 border-red-200 text-red-900",
    icon: <LuCircleAlert className="h-5 w-5 text-red-600" aria-hidden />,
  },
};

/** Inline message banner (form errors, plan limits, notices). */
export default function Alert({
  tone = "info",
  title,
  children,
  className,
  action,
}: AlertProps) {
  const s = styles[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 text-[15px] leading-snug",
        s.wrap,
        className,
      )}
    >
      <span className="mt-0.5 shrink-0">{s.icon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "font-semibold")}>{children}</div>}
      </div>
      {action}
    </div>
  );
}
