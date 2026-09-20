import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** "mark" = the cat only; "full" = cat + wordmark. */
  variant?: "mark" | "full";
  /** Height of the cat mark in px. */
  size?: number;
  className?: string;
}

/** The Wisker lockup: cat mark plus the wordmark. */
export default function Logo({
  variant = "full",
  size = 36,
  className,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/images/wisker-mark.png"
        alt={variant === "mark" ? "Wisker" : ""}
        width={Math.round(size * 1.17)}
        height={size}
        priority
        style={{ height: size, width: "auto" }}
      />
      {variant === "full" && (
        <Image
          src="/images/wisker-wordmark.png"
          alt="Wisker"
          width={Math.round(size * 0.62 * 3.23)}
          height={Math.round(size * 0.62)}
          priority
          style={{ height: size * 0.62, width: "auto" }}
        />
      )}
    </span>
  );
}
