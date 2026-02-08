"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
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

  // Clear loading state when navigation completes
  useEffect(() => {
    if (!isPending && navigatingTo) {
      setNavigatingTo(null);
    }
  }, [isPending, navigatingTo]);

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
              const subjectId = tool.subject?.id || "";
              const link = tool.subject
                ? `/subjects/${subjectId}`
                : `/notes/${tool.note?.id || ""}`;

              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    setNavigatingTo(`tool-${tool.id}`);
                    startTransition(() => {
                      router.push(link);
                    });
                  }}
                  disabled={navigatingTo === `tool-${tool.id}`}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
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
                      {navigatingTo === `tool-${tool.id}` ? (
                        <svg
                          className="animate-spin h-5 w-5 text-gray-600"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : tool.type === "QUIZ" ? (
                        "📝"
                      ) : tool.type === "FLASHCARD" ? (
                        "🎴"
                      ) : (
                        "📄"
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-800 group-hover:text-gray-900">
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
                  <span className="text-gray-400 group-hover:text-gray-600 text-xl">
                    →
                  </span>
                </button>
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
