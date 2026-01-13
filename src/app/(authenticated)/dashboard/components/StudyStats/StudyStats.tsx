"use client";

import React from "react";

// Mock data - replace with actual data from your backend
const stats = {
  totalSubjects: 12,
  totalNotes: 47,
  quizzesThisWeek: 8,
};

function StudyStats() {
  return (
    <div className="w-full">
      <h2
        className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4"
        style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
      >
        Study Overview
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Subjects Card */}
        <div
          className="bg-linear-to-br from-[#FFE5E5] to-[#FFD0D0] p-6 rounded-2xl"
          style={{ fontFamily: "Fredoka, Arial, sans-serif", boxShadow: '0 4px 0 #ececec' }}
        >
          <div className="flex flex-col items-center justify-center">
            <p className="text-5xl font-extrabold text-[#FF6B6B] mb-2">
              {stats.totalSubjects}
            </p>
            <p className="text-lg font-semibold text-gray-700">
              Total Subjects
            </p>
          </div>
        </div>

        {/* Total Notes Card */}
        <div
          className="bg-linear-to-br from-[#E0F7FF] to-[#B8E6FF] p-6 rounded-2xl"
          style={{ fontFamily: "Fredoka, Arial, sans-serif", boxShadow: '0 4px 0 #ececec' }}
        >
          <div className="flex flex-col items-center justify-center">
            <p className="text-5xl font-extrabold text-[#4A90E2] mb-2">
              {stats.totalNotes}
            </p>
            <p className="text-lg font-semibold text-gray-700">
              Notes Created
            </p>
          </div>
        </div>

        {/* Quizzes This Week Card */}
        <div
          className="bg-linear-to-br from-[#F0E5FF] to-[#E0CFFF] p-6 rounded-2xl"
          style={{ fontFamily: "Fredoka, Arial, sans-serif", boxShadow: '0 4px 0 #ececec' }}
        >
          <div className="flex flex-col items-center justify-center">
            <p className="text-5xl font-extrabold text-[#9B59B6] mb-2">
              {stats.quizzesThisWeek}
            </p>
            <p className="text-lg font-semibold text-gray-700">
              Quizzes This Week
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudyStats;
