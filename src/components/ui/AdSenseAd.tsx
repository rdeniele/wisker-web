"use client";

import React, { useEffect, useRef } from "react";

interface AdSenseAdProps {
  adSlot: string;
  adFormat?: "auto" | "rectangle" | "vertical" | "horizontal";
  className?: string;
}

export function AdSenseAd({
  adSlot,
  adFormat = "auto",
  className = "",
}: AdSenseAdProps) {
  const hasPushed = useRef(false);

  useEffect(() => {
    // Only push once per component instance
    if (hasPushed.current) return;
    hasPushed.current = true;

    // Wait for the DOM to be ready and the ad element to be in place
    const timer = setTimeout(() => {
      try {
        if (typeof window !== "undefined" && (window as any).adsbygoogle) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
            {},
          );
        }
      } catch (error) {
        // Silently handle - ad might already be processed
        if (
          error instanceof Error &&
          !error.message.includes("already have ads")
        ) {
          console.error("AdSense error:", error);
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-4143521375584293"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}

// Sidebar ad (vertical rectangle)
export function SidebarAd() {
  return (
    <AdSenseAd
      adSlot="1234567890"
      adFormat="vertical"
      className="w-full max-w-sm mx-auto"
    />
  );
}

// Bottom of page ad (horizontal)
export function BottomAd() {
  return (
    <AdSenseAd
      adSlot="0987654321"
      adFormat="horizontal"
      className="w-full my-8"
    />
  );
}
