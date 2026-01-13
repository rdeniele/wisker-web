"use client";

import React from "react";

// Mock data - replace with actual data from your backend
const streakData = {
  currentStreak: 7,
  longestStreak: 15,
};

function StudyStreak() {
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
        style={{ fontFamily: "Fredoka, Arial, sans-serif", boxShadow: '0 4px 0 #ececec' }}
      >
        {/* Decorative background elements */}
        <div className="absolute top-2 right-2 text-6xl opacity-20">🔥</div>
        <div className="absolute bottom-2 left-2 text-4xl opacity-20">⭐</div>

        <div className="relative z-10 flex flex-col items-center justify-center">
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
            Study today to keep your streak alive! 🎯
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudyStreak;
