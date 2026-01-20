"use client";

import React, { useEffect, useState } from "react";

interface Stats {
  totalSubjects: number;
  totalNotes: number;
  quizzesThisWeek: number;
}

function StudyStats() {
  const [stats, setStats] = useState<Stats>({
    totalSubjects: 0,
    totalNotes: 0,
    quizzesThisWeek: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);

        // Fetch subjects to count them and aggregate notes
        const subjectsResponse = await fetch("/api/subjects", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (subjectsResponse.ok) {
          const subjectsResult = await subjectsResponse.json();
          const subjects = subjectsResult.data.subjects || [];

          // Calculate total subjects and total notes across all subjects
          const totalSubjects = subjects.length;
          const totalNotes = subjects.reduce((sum: number, subject: any) => {
            return sum + (subject._count?.notes || 0);
          }, 0);

          setStats({
            totalSubjects,
            totalNotes,
            quizzesThisWeek: 0, // TODO: Implement quizzes tracking
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);
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
          style={{
            fontFamily: "Fredoka, Arial, sans-serif",
            boxShadow: "0 4px 0 #ececec",
          }}
        >
          <div className="flex flex-col items-center justify-center">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="bg-red-200 h-12 w-16 rounded mb-2"></div>
                <div className="bg-red-200 h-5 w-24 rounded"></div>
              </div>
            ) : (
              <>
                <p className="text-5xl font-extrabold text-[#FF6B6B] mb-2">
                  {stats.totalSubjects}
                </p>
                <p className="text-lg font-semibold text-gray-700">
                  Total Subjects
                </p>
              </>
            )}
          </div>
        </div>

        {/* Total Notes Card */}
        <div
          className="bg-linear-to-br from-[#E0F7FF] to-[#B8E6FF] p-6 rounded-2xl"
          style={{
            fontFamily: "Fredoka, Arial, sans-serif",
            boxShadow: "0 4px 0 #ececec",
          }}
        >
          <div className="flex flex-col items-center justify-center">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="bg-blue-200 h-12 w-16 rounded mb-2"></div>
                <div className="bg-blue-200 h-5 w-24 rounded"></div>
              </div>
            ) : (
              <>
                <p className="text-5xl font-extrabold text-[#4A90E2] mb-2">
                  {stats.totalNotes}
                </p>
                <p className="text-lg font-semibold text-gray-700">
                  Notes Created
                </p>
              </>
            )}
          </div>
        </div>

        {/* Quizzes This Week Card */}
        <div
          className="bg-linear-to-br from-[#F0E5FF] to-[#E0CFFF] p-6 rounded-2xl"
          style={{
            fontFamily: "Fredoka, Arial, sans-serif",
            boxShadow: "0 4px 0 #ececec",
          }}
        >
          <div className="flex flex-col items-center justify-center">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="bg-purple-200 h-12 w-16 rounded mb-2"></div>
                <div className="bg-purple-200 h-5 w-24 rounded"></div>
              </div>
            ) : (
              <>
                <p className="text-5xl font-extrabold text-[#9B59B6] mb-2">
                  {stats.quizzesThisWeek}
                </p>
                <p className="text-lg font-semibold text-gray-700">
                  Quizzes This Week
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudyStats;
