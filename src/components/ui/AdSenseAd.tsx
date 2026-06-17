"use client";

import React, { useEffect } from "react";

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
  useEffect(() => {
    try {
      // Push ads from previously registered ad slots
      if (typeof window !== "undefined" && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
          {},
        );
      }
    } catch (error) {
      console.error("AdSense error:", error);
    }
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
