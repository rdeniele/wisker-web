"use client";

import React, { useState, useEffect } from "react";

interface LearningTool {
  id: string;
  type: string;
  createdAt: string;
  subject?: {
    id: string;
    title: string;
  };
  note?: {
    id: string;
    title: string;
  };
}

function TodaysFocus() {
  const [recentTools, setRecentTools] = useState<LearningTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const response = await fetch("/api/learning-tools?pageSize=5");
        const result = await response.json();
        if (response.ok && result.data.learningTools) {
          // Filter to today's activities
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const todaysTools = result.data.learningTools.filter(
            (tool: LearningTool) => {
              const toolDate = new Date(tool.createdAt);
              toolDate.setHours(0, 0, 0, 0);
              return toolDate.getTime() === today.getTime();
            },
          );

          setRecentTools(todaysTools.slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to fetch learning tools:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);


  return (
    <div className="w-full">
      <h2
        className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4"
        style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
      >
        Today&apos;s Focus
      </h2>
      <div
        className="bg-white p-8 rounded-2xl border-2 border-gray-100 min-h-[300px] flex flex-col"
        style={{
          fontFamily: "Fredoka, Arial, sans-serif",
          boxShadow: "0 4px 0 #ececec",
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-gray-500 mt-3">
                Loading activities...
              </p>
            </div>
          </div>
        ) : recentTools.length > 0 ? (
          <div className="space-y-3 flex-1">
            {recentTools.map((tool) => {
              return (
                <div
                  key={tool.id}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                        tool.type === "QUIZ"
                          ? "bg-purple-100"
                          : tool.type === "FLASHCARD"
                            ? "bg-green-100"
                            : "bg-blue-100"
                      }`}
                    >
                      {tool.type === "QUIZ" ? (
                        "📝"
                      ) : tool.type === "FLASHCARD" ? (
                        "🎴"
                      ) : (
                        "📄"
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-800">
                        {tool.type === "QUIZ"
                          ? "Quiz"
                          : tool.type === "FLASHCARD"
                            ? "Flashcards"
                            : "Summary"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {tool.subject?.title || tool.note?.title || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(tool.createdAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <p className="text-6xl mb-3">🎉</p>
              <p className="text-lg font-bold text-gray-700">
                No activity today yet
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Create a quiz, flashcard, or summary to get started!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TodaysFocus;
