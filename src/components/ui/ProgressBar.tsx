import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  label: string;
  tone?: "brand" | "accent" | "success" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const fill = {
  brand: "bg-orange-500",
  accent: "bg-indigo-500",
  success: "bg-green-400",
  danger: "bg-red-400",
};
const height = { sm: "h-2", md: "h-3", lg: "h-4" };

/** Animated, accessible progress indicator. */
export default function ProgressBar({
  value,
  label,
  tone = "brand",
  size = "md",
  className,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn(
        "w-full overflow-hidden rounded-full bg-gray-100",
        height[size],
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          fill[tone],
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
