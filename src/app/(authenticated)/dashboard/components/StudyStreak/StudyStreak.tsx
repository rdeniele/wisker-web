"use client";

import React, { useEffect, useState } from "react";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

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
      <h2
        className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4"
        style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
      >
        Keep It Going!
      </h2>
      <div
        className="bg-linear-to-br from-[#FFE8CC] to-[#FFD699] p-8 rounded-2xl relative overflow-hidden"
        style={{
          fontFamily: "Fredoka, Arial, sans-serif",
          boxShadow: "0 4px 0 #ececec",
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute top-2 right-2 text-6xl opacity-20">🔥</div>
        <div className="absolute bottom-2 left-2 text-4xl opacity-20">⭐</div>

        <div className="relative z-10 flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-16 w-24 bg-orange-200 rounded-lg mb-4"></div>
              <div className="h-6 w-32 bg-orange-200 rounded mb-2"></div>
              <div className="h-4 w-40 bg-orange-200 rounded"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-6xl">🔥</span>
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
                  ? "Start studying today to begin your streak! 🎯"
                  : "Study today to keep your streak alive! 🎯"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudyStreak;
