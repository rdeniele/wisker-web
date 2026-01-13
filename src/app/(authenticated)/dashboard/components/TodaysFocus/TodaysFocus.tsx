"use client";

import React from "react";
import Link from "next/link";
import { subjects } from "@/lib/data/subjects";

// Mock data using actual subject IDs from the data
const todaysTasks = [
  {
    id: 1,
    title: "Review Biology Notes",
    type: "review" as const,
    count: 3,
    urgent: true,
    subjectId: subjects[0]?.id || 1, // Biology
  },
  {
    id: 2,
    title: "Mathematics Quiz",
    type: "quiz" as const,
    count: 1,
    urgent: false,
    subjectId: subjects[3]?.id || 4, // Mathematics
  },
  {
    id: 3,
    title: "Programming Flashcards",
    type: "flashcard" as const,
    count: 15,
    urgent: false,
    subjectId: subjects[1]?.id || 2, // Programming
  },
];

function TodaysFocus() {
  return (
    <div className="w-full">
      <h2
        className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4"
        style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
      >
        Today&apos;s Focus
      </h2>
      <div
        className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100"
        style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
      >
        {todaysTasks.length > 0 ? (
          <div className="space-y-3">
            {todaysTasks.map((task) => {
              // Generate the correct link based on task type
              const link = task.type === "review" 
                ? `/subjects/${task.subjectId}`
                : `/subjects/${task.subjectId}/${task.type}`;
              
              return (
                <Link
                  key={task.id}
                  href={link}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon based on type */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                        task.type === "review"
                          ? "bg-blue-100"
                          : task.type === "quiz"
                          ? "bg-purple-100"
                          : "bg-green-100"
                      }`}
                    >
                      {task.type === "review"
                        ? "📖"
                        : task.type === "quiz"
                        ? "📝"
                        : "🎴"}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 group-hover:text-gray-900">
                        {task.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {task.count}{" "}
                        {task.type === "review"
                          ? "notes"
                          : task.type === "quiz"
                          ? "quiz"
                          : "cards"}
                      </p>
                    </div>
                  </div>
                  {task.urgent && (
                    <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                      Due Today
                    </span>
                  )}
                  <span className="text-gray-400 group-hover:text-gray-600 text-xl">
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-6xl mb-3">🎉</p>
            <p className="text-lg font-bold text-gray-700">All caught up!</p>
            <p className="text-sm text-gray-500 mt-1">
              No tasks scheduled for today
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TodaysFocus;
