"use client";

import React, { useEffect, useState } from "react";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

const fireAnimationStyles = `
  @keyframes fireFlicker {
    0%, 100% {
      transform: scale(1) rotate(-2deg);
      filter: brightness(1) drop-shadow(0 0 8px rgba(255, 107, 53, 0.6));
    }
    25% {
      transform: scale(1.05) rotate(2deg);
      filter: brightness(1.1) drop-shadow(0 0 12px rgba(255, 107, 53, 0.8));
    }
    50% {
      transform: scale(0.98) rotate(-1deg);
      filter: brightness(0.95) drop-shadow(0 0 6px rgba(255, 107, 53, 0.5));
    }
    75% {
      transform: scale(1.03) rotate(1deg);
      filter: brightness(1.05) drop-shadow(0 0 10px rgba(255, 107, 53, 0.7));
    }
  }
  
  @keyframes fireGlow {
    0%, 100% {
      box-shadow: 0 4px 0 #ececec, inset 0 0 30px rgba(255, 107, 53, 0.1);
    }
    50% {
      box-shadow: 0 4px 0 #ececec, inset 0 0 50px rgba(255, 107, 53, 0.2);
    }
  }
  
  @keyframes flameBorder {
    0% {
      border-color: rgba(255, 107, 53, 0.8);
      box-shadow: 
        0 0 10px rgba(255, 107, 53, 0.6),
        0 0 20px rgba(255, 107, 53, 0.4),
        0 0 30px rgba(255, 107, 53, 0.2),
        inset 0 0 10px rgba(255, 107, 53, 0.1);
    }
    25% {
      border-color: rgba(255, 69, 0, 0.9);
      box-shadow: 
        0 0 15px rgba(255, 69, 0, 0.7),
        0 0 25px rgba(255, 107, 53, 0.5),
        0 0 35px rgba(255, 140, 0, 0.3),
        inset 0 0 15px rgba(255, 107, 53, 0.15);
    }
    50% {
      border-color: rgba(255, 140, 0, 0.85);
      box-shadow: 
        0 0 12px rgba(255, 140, 0, 0.65),
        0 0 22px rgba(255, 107, 53, 0.45),
        0 0 32px rgba(255, 69, 0, 0.25),
        inset 0 0 12px rgba(255, 140, 0, 0.12);
    }
    75% {
      border-color: rgba(255, 69, 0, 0.9);
      box-shadow: 
        0 0 16px rgba(255, 69, 0, 0.75),
        0 0 26px rgba(255, 107, 53, 0.55),
        0 0 36px rgba(255, 140, 0, 0.35),
        inset 0 0 16px rgba(255, 69, 0, 0.16);
    }
    100% {
      border-color: rgba(255, 107, 53, 0.8);
      box-shadow: 
        0 0 10px rgba(255, 107, 53, 0.6),
        0 0 20px rgba(255, 107, 53, 0.4),
        0 0 30px rgba(255, 107, 53, 0.2),
        inset 0 0 10px rgba(255, 107, 53, 0.1);
    }
  }
  
  @keyframes floatUp {
    0% {
      transform: translateY(0) scale(1);
      opacity: 0.6;
    }
    50% {
      opacity: 0.8;
    }
    100% {
      transform: translateY(-20px) scale(0.8);
      opacity: 0;
    }
  }
  
  .fire-animate {
    display: inline-block;
    transition: transform 0.3s ease;
  }
  
  .streak-container:hover .fire-animate {
    animation: fireFlicker 2s ease-in-out infinite;
  }
  
  .fire-glow {
    box-shadow: 0 4px 0 #ececec;
    transition: box-shadow 0.3s ease;
  }
  
  .streak-container:hover .fire-glow {
    animation: fireGlow 3s ease-in-out infinite;
  }
  
  .flame-border {
    border: 3px solid rgba(255, 107, 53, 0.3);
    box-shadow: 0 0 5px rgba(255, 107, 53, 0.2);
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  
  .streak-container:hover .flame-border {
    animation: flameBorder 2.5s ease-in-out infinite;
  }
  
  .ember {
    position: absolute;
    font-size: 12px;
    opacity: 0;
  }
  
  .streak-container:hover .ember {
    animation: floatUp 3s ease-in infinite;
  }
  
  .ember:nth-child(1) {
    left: 15%;
    animation-delay: 0s;
  }
  
  .ember:nth-child(2) {
    left: 35%;
    animation-delay: 1s;
  }
  
  .ember:nth-child(3) {
    left: 55%;
    animation-delay: 0.5s;
  }
  
  .ember:nth-child(4) {
    left: 75%;
    animation-delay: 1.5s;
  }
  
  .ember:nth-child(5) {
    left: 85%;
    animation-delay: 2s;
  }
`;

function StudyStreak() {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStreakData = async () => {
      try {
        const response = await fetch("/api/streak");
        const result = await response.json();

        if (result.success) {
          setStreakData({
            currentStreak: result.data.currentStreak,
            longestStreak: result.data.longestStreak,
          });
        }
      } catch (error) {
        console.error("Failed to fetch streak data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreakData();
  }, []);

  return (
    <div className="w-full">
      <style>{fireAnimationStyles}</style>
      <h2
        className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4"
        style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
      >
        Keep It Going!
      </h2>
      <div
        className="bg-linear-to-br from-[#FFE8CC] to-[#FFD699] p-8 rounded-2xl relative overflow-hidden fire-glow flame-border streak-container min-h-[300px]"
        style={{
          fontFamily: "Fredoka, Arial, sans-serif",
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute top-2 right-2 opacity-20 fire-animate">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C11.5 4 11 6 10 7.5C9 9 8 10.5 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 10.5 15 9 14 7.5C13 6 12.5 4 12 2Z" fill="#FF6B35"/>
            <path d="M12 8C11.5 9.5 11 10.5 10.5 11.5C10 12.5 9.5 13.5 9.5 14.5C9.5 16.16 10.84 17.5 12.5 17.5C14.16 17.5 15.5 16.16 15.5 14.5C15.5 13.5 15 12.5 14.5 11.5C14 10.5 13.5 9.5 13 8H12Z" fill="#FF8C00"/>
            <path d="M12 12C11.75 13 11.5 13.5 11.25 14C11 14.5 10.75 15 10.75 15.5C10.75 16.33 11.42 17 12.25 17C13.08 17 13.75 16.33 13.75 15.5C13.75 15 13.5 14.5 13.25 14C13 13.5 12.75 13 12.5 12H12Z" fill="#FFD700"/>
          </svg>
        </div>
        <div className="absolute bottom-2 left-2 opacity-20">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
          </svg>
        </div>
        
        {/* Floating embers */}
        <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none">
          <span className="ember">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FFD700"/>
            </svg>
          </span>
          <span className="ember">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FFD700"/>
            </svg>
          </span>
          <span className="ember">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FFD700"/>
            </svg>
          </span>
          <span className="ember">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FFD700"/>
            </svg>
          </span>
          <span className="ember">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FFD700"/>
            </svg>
          </span>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-[236px]">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-16 w-24 bg-orange-200 rounded-lg mb-4"></div>
              <div className="h-6 w-32 bg-orange-200 rounded mb-2"></div>
              <div className="h-4 w-40 bg-orange-200 rounded"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="fire-animate">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C11.5 4 11 6 10 7.5C9 9 8 10.5 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 10.5 15 9 14 7.5C13 6 12.5 4 12 2Z" fill="#FF6B35"/>
                    <path d="M12 8C11.5 9.5 11 10.5 10.5 11.5C10 12.5 9.5 13.5 9.5 14.5C9.5 16.16 10.84 17.5 12.5 17.5C14.16 17.5 15.5 16.16 15.5 14.5C15.5 13.5 15 12.5 14.5 11.5C14 10.5 13.5 9.5 13 8H12Z" fill="#FF8C00"/>
                    <path d="M12 12C11.75 13 11.5 13.5 11.25 14C11 14.5 10.75 15 10.75 15.5C10.75 16.33 11.42 17 12.25 17C13.08 17 13.75 16.33 13.75 15.5C13.75 15 13.5 14.5 13.25 14C13 13.5 12.75 13 12.5 12H12Z" fill="#FFD700"/>
                  </svg>
                </div>
                <p className="text-6xl font-extrabold text-[#FF6B35]">
                  {streakData.currentStreak}
                </p>
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-4">
                Day Streak!
              </p>
              <p className="text-sm font-medium text-gray-600">
                Longest streak: {streakData.longestStreak} days
              </p>
              <p className="text-xs text-gray-500 mt-2 text-center max-w-xs">
                {streakData.currentStreak === 0
                  ? "Start studying today to begin your streak!"
                  : "Study today to keep your streak alive!"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudyStreak;
