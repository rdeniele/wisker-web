import React, { useState, forwardRef } from "react";
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
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputType = type === "password" && showPassword ? "text" : type;

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div
        className={cn("flex flex-col gap-2", fullWidth && "w-full", className)}
        style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
      >
        {/* Label */}
        <label
          className={cn(
            "text-lg md:text-xl font-semibold text-gray-900",
            labelClassName,
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* Input Container */}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full px-6 py-4 text-lg md:text-xl",
              "bg-gray-50",
              "border-2 rounded-2xl",
              "placeholder:text-gray-500",
              "text-gray-900",
              "transition-all duration-200 ease-in-out",
              "focus:outline-none focus:ring-2",
              // Border states
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-300"
                : isFocused
                  ? "border-orange-400 focus:border-orange-500 focus:ring-orange-300"
                  : "border-gray-300 hover:border-gray-400",
              // Disabled state
              disabled && "opacity-50 cursor-not-allowed bg-gray-100",
              // Padding adjustment for password toggle
              type === "password" && showPasswordToggle && "pr-14",
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Password Toggle Icon */}
          {type === "password" && showPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2",
                "text-gray-500 hover:text-gray-700",
                "focus:outline-none focus:text-gray-700",
                "transition-colors duration-200",
                "p-1 rounded-md hover:bg-gray-100",
                disabled && "cursor-not-allowed opacity-50",
              )}
              disabled={disabled}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                // Eye slash icon (password hidden)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                // Eye icon (password visible)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Helper Text or Error */}
        {(error || helperText) && (
          <p
            className={cn(
              "text-sm md:text-base",
              error ? "text-red-500" : "text-gray-600",
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
