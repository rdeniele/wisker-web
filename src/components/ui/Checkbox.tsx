"use client";

import React, { useId } from "react";
import { LuCheck } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  className?: string;
}

/** Native checkbox with a large hit area and Wisker styling. */
export default function Checkbox({
  label,
  className,
  id,
  ...props
}: CheckboxProps) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="relative mt-0.5 grid h-6 w-6 shrink-0 place-items-center">
        <input
          id={inputId}
          type="checkbox"
          className="peer absolute -inset-2.5 z-10 m-0 cursor-pointer opacity-0"
          {...props}
        />
        <span
          aria-hidden
          className="grid h-6 w-6 place-items-center rounded-lg border-2 border-gray-300 bg-white text-transparent transition-colors peer-checked:border-orange-500 peer-checked:bg-orange-500 peer-checked:text-ink peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-500/55"
        >
          <LuCheck className="h-4 w-4" strokeWidth={3.5} />
        </span>
      </span>
      <label
        htmlFor={inputId}
        className="cursor-pointer select-none text-[15px] font-semibold leading-snug text-gray-700"
      >
        {label}
      </label>
    </div>
  );
}
