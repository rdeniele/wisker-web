"use client";
import React from "react";
import Image from "next/image";

import { useRouter } from "next/navigation";

interface QuickActionCardProps {
  bgColor?: string;
  imageSrc?: string;
  text?: string;
  textColor?: string;
  style?: React.CSSProperties;
  route?: string; // Route to navigate to on click
  onClick?: () => void; // Custom click handler for backend integration
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  bgColor = "#FFF3D1",
  imageSrc,
  text = "",
  textColor = "#D18B3B",
  style,
  route,
  onClick,
}) => {
  const router = useRouter();
  // Animation states
  const [isPressed, setIsPressed] = React.useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (route) {
      router.push(route);
    }
  };

  // Extract shadow color from style or use default
  let shadowColor = "#c7a76a";
  if (style && style.boxShadow) {
    const match = String(style.boxShadow).match(/#[0-9a-fA-F]{3,8}/);
    if (match) shadowColor = match[0];
  }

  return (
    <div
      tabIndex={0}
      role="button"
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      style={{
        background: bgColor,
        borderRadius: 24,
        boxShadow: style?.boxShadow ?? `0 4px 0 0 ${shadowColor}`,
        border: `2px solid ${shadowColor}`,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 260,
        height: 260,
        position: "relative",
        cursor: route || onClick ? "pointer" : "default",
        transition: "transform 0.15s cubic-bezier(.4,2,.3,1)",
        transform: isPressed ? "scale(0.96)" : undefined,
        ...style,
      }}
      className="quick-action-card group hover:scale-105 focus:scale-105"
    >
      {imageSrc && (
        <Image
          src={imageSrc}
          alt="Quick Action"
          width={120}
          height={120}
          style={{
            marginBottom: 16,
            objectFit: "contain",
            transition: "transform 0.2s",
            transform: isPressed ? "scale(1.08)" : undefined,
          }}
        />
      )}
      <div
        style={{
          color: textColor,
          fontWeight: 700,
          fontSize: 28,
          textAlign: "center",
          fontFamily: "Fredoka, Arial, sans-serif",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export default QuickActionCard;
