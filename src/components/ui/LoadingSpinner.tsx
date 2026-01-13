import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  size = "md", 
  message = "Loading...",
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const container = fullScreen 
    ? "fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50"
    : "flex flex-col items-center justify-center py-12";

  return (
    <div className={container}>
      <div className="relative">
        {/* Spinning circle */}
        <div
          className={`${sizeClasses[size]} rounded-full border-4 border-gray-200 border-t-orange-500 animate-spin`}
        />
        {/* Wisky mascot in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🐱</span>
        </div>
      </div>
      {message && (
        <p className="mt-4 text-gray-600 font-medium font-fredoka">
          {message}
        </p>
      )}
    </div>
  );
}
