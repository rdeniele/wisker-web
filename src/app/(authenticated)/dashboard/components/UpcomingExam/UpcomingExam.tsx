"use client";
import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Subject {
  id: string;
  title: string;
  description?: string;
  examDate?: string;
  _count?: {
    notes: number;
  };
}

function UpcomingExam() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch("/api/subjects");
        const result = await response.json();
        if (response.ok && result.data.subjects) {
          // Filter subjects with exam dates and sort by date
          const withExams = result.data.subjects
            .filter((s: Subject) => s.examDate)
            .sort((a: Subject, b: Subject) => {
              const dateA = new Date(a.examDate!).getTime();
              const dateB = new Date(b.examDate!).getTime();
              return dateA - dateB;
            });
          setSubjects(withExams);
        }
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const formatExamDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getExamUrgency = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays <= 3;
  };

  const topExams = subjects.slice(0, 3);

  // Clear loading state when navigation completes
  useEffect(() => {
    if (!isPending && navigatingTo) {
      setNavigatingTo(null);
    }
  }, [isPending, navigatingTo]);

  return (
    <div className="w-full font-fredoka">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
          Upcoming Exams
        </h1>
        <Link
          href="/subjects"
          className="text-sm md:text-base font-semibold text-gray-500 hover:text-orange-500 transition-colors"
        >
          See all →
        </Link>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mb-2"></div>
            <p className="text-gray-500 text-sm">Loading exams...</p>
          </div>
        ) : topExams.length > 0 ? (
          topExams.map((exam, index) => {
            const isUrgent = exam.examDate
              ? getExamUrgency(exam.examDate)
              : false;
            const dayText = exam.examDate
              ? formatExamDate(exam.examDate)
              : "No date set";

            return (
              <div key={exam.id} className="relative flex gap-4 pb-8 last:pb-0">
                {/* Timeline Line + Icon */}
                <div className="relative flex flex-col items-center">
                  {/* Icon Circle */}
                  <button
                    onClick={() => {
                      setNavigatingTo(exam.id);
                      startTransition(() => {
                        router.push(`/subjects/${exam.id}`);
                      });
                    }}
                    disabled={navigatingTo === exam.id}
                    className={`relative z-10 w-14 h-14 rounded-full ${isUrgent ? "bg-red-100" : "bg-orange-100"} flex items-center justify-center text-2xl shadow-md hover:shadow-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {navigatingTo === exam.id ? (
                      <svg
                        className="animate-spin h-6 w-6 text-gray-500"
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
                    ) : (
                      "📚"
                    )}
                  </button>

                  {/* Connecting Line */}
                  {index < topExams.length - 1 && (
                    <div
                      className={`w-0.5 h-full absolute top-14 ${isUrgent ? "bg-red-200" : "bg-orange-200"}`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <button
                    onClick={() => {
                      setNavigatingTo(exam.id);
                      startTransition(() => {
                        router.push(`/subjects/${exam.id}`);
                      });
                    }}
                    disabled={navigatingTo === exam.id}
                    className="w-full text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-500 transition-colors">
                            {exam.title}
                          </h3>
                          {isUrgent && (
                            <span className="px-2.5 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full animate-pulse">
                              Due {dayText}!
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{dayText}</p>
                      </div>

                      {/* Time Badge */}
                      {exam.examDate && (
                        <div className="shrink-0 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold">
                          {new Date(exam.examDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      )}
                    </div>

                    {/* Notes info */}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>📝</span>
                      <span>
                        {exam._count?.notes || 0}{" "}
                        {exam._count?.notes === 1 ? "note" : "notes"} available
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl">
            <span className="text-5xl mb-3 block">📚</span>
            <p className="text-gray-600 font-medium">No upcoming exams</p>
            <p className="text-sm text-gray-400 mt-1">
              Add exam dates to your subjects to see them here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpcomingExam;
