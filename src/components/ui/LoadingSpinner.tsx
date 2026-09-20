import React from "react";
import Image from "next/image";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
}

const dims = { sm: 32, md: 48, lg: 64 };

/** Wisky-in-a-ring loader. `fullScreen` covers the viewport (use sparingly). */
export default function LoadingSpinner({
  size = "md",
  message = "Loading...",
  fullScreen = false,
}: LoadingSpinnerProps) {
  const px = dims[size];
  const container = fullScreen
    ? "fixed inset-0 z-[80] flex flex-col items-center justify-center bg-cream/85 backdrop-blur-sm"
    : "flex flex-col items-center justify-center py-12";

  return (
    <div className={container} role="status" aria-live="polite">
      <div className="relative" style={{ width: px + 16, height: px + 16 }}>
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
        <div className="absolute inset-0 grid place-items-center">
          <Image
            src="/images/wisker-mark.png"
            alt=""
            width={px}
            height={px}
            style={{ width: px * 0.62, height: "auto" }}
          />
        </div>
      </div>
      {message ? (
        <p className="mt-4 font-display text-base font-medium text-gray-600">
          {message}
        </p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}
