import React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "ink";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  accent: "btn-accent",
  secondary: "btn-secondary",
  // "outline" kept for backwards compatibility; it renders as the quiet white button.
  outline: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  ink: "btn-ink",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
  xl: "btn-lg",
};

/**
 * Class names for the Wisker button. Use this to style links (`<Link>`, `<a>`)
 * so navigation and actions share one visual component.
 */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return cn(
    "btn",
    variantClass[variant],
    sizeClass[size],
    fullWidth && "btn-block",
    className,
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5 animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      fullWidth = false,
      isLoading = false,
      disabled = false,
      className,
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  ),
);

Button.displayName = "Button";

export default Button;
