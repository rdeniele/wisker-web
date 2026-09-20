"use client";
import React, { useId, useState, forwardRef } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface InputBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "number" | "tel";
  showPasswordToggle?: boolean;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  labelClassName?: string;
}

/** Label + input + helper/error text, wired together for assistive tech. */
const InputBox = forwardRef<HTMLInputElement, InputBoxProps>(
  (
    {
      label,
      placeholder,
      type = "text",
      showPasswordToggle = false,
      error,
      helperText,
      required = false,
      disabled = false,
      fullWidth = true,
      className,
      labelClassName,
      id,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const descId = `${inputId}-desc`;
    const [showPassword, setShowPassword] = useState(false);
    const inputType = type === "password" && showPassword ? "text" : type;
    const hasToggle = type === "password" && showPasswordToggle;

    return (
      <div
        className={cn("flex flex-col gap-2", fullWidth && "w-full", className)}
      >
        <label
          htmlFor={inputId}
          className={cn("text-[15px] font-bold text-ink", labelClassName)}
        >
          {label}
          {required && (
            <span className="ml-1 text-red-600" aria-hidden>
              *
            </span>
          )}
        </label>

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || helperText ? descId : undefined}
            className={cn("field", hasToggle && "pr-14")}
            {...props}
          />

          {hasToggle && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={disabled}
              className="btn btn-icon absolute right-1 top-1/2 h-11 w-11 -translate-y-1/2 text-gray-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <LuEyeOff className="h-5 w-5" aria-hidden />
              ) : (
                <LuEye className="h-5 w-5" aria-hidden />
              )}
            </button>
          )}
        </div>

        {(error || helperText) && (
          <p
            id={descId}
            role={error ? "alert" : undefined}
            className={cn(
              "text-sm font-semibold",
              error ? "text-red-600" : "text-gray-600",
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);

InputBox.displayName = "InputBox";

export default InputBox;

interface TextAreaBoxProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: React.ReactNode;
  error?: string;
  helperText?: string;
  /** Shows "n / max" under the field when `maxLength` is set. */
  showCount?: boolean;
  className?: string;
}

/** Label + textarea with the same wiring as InputBox. */
export const TextAreaBox = forwardRef<HTMLTextAreaElement, TextAreaBoxProps>(
  (
    { label, error, helperText, showCount, className, id, value, maxLength, ...props },
    ref,
  ) => {
    const autoId = useId();
    const fieldId = id ?? autoId;
    const descId = `${fieldId}-desc`;
    const length = typeof value === "string" ? value.length : 0;
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <label htmlFor={fieldId} className="text-[15px] font-bold text-ink">
          {label}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || helperText ? descId : undefined}
          className="field resize-none"
          {...props}
        />
        <div className="flex items-start justify-between gap-3">
          {(error || helperText) && (
            <p
              id={descId}
              role={error ? "alert" : undefined}
              className={cn(
                "text-sm font-semibold",
                error ? "text-red-600" : "text-gray-600",
              )}
            >
              {error || helperText}
            </p>
          )}
          {showCount && maxLength && (
            <p className="ml-auto text-xs font-bold text-gray-500">
              {length} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  },
);
TextAreaBox.displayName = "TextAreaBox";
