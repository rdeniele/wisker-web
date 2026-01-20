"use client";
import React, { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Subject {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    notes: number;
    learningTools: number;
  };
}

function Subjects() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Clear loading state when navigation completes
  useEffect(() => {
    if (!isPending && navigatingTo) {
      setNavigatingTo(null);
    }
  }, [isPending, navigatingTo]);

  // Fetch subjects from API
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setIsLoading(true);

        const response = await fetch("/api/subjects", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch subjects");
        }

        const result = await response.json();
        setSubjects(result.data.subjects || []);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${diffWeeks}w ago`;
  };

  // Show only the first 4 subjects (most recent)
  const recentSubjects = subjects.slice(0, 4);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1
          className="text-2xl md:text-3xl font-extrabold text-gray-900"
          style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
        >
          Subjects
        </h1>
        <Link
          href="/subjects"
          className="text-base md:text-xl font-bold text-[#231F20] opacity-60 hover:opacity-100 transition-all"
          style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
        >
          See all
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-5 min-h-[220px] flex flex-col justify-between items-start relative border border-[#F3F3F3] w-full animate-pulse"
              style={{ boxShadow: "0 4px 0 #ececec" }}
            >
              <div className="bg-gray-200 rounded-xl w-12 h-12 mb-2"></div>
              <div className="w-full mt-2">
                <div className="bg-gray-200 h-6 w-3/4 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
              </div>
              <div className="bg-gray-200 h-4 w-full rounded mt-4"></div>
            </div>
          ))
        ) : recentSubjects.length === 0 ? (
          // Empty state
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No subjects yet</p>
            <Link
              href="/subjects"
              className="inline-block bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-2xl font-medium transition-colors"
            >
              Create your first subject
            </Link>
          </div>
        ) : (
          recentSubjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => {
                setNavigatingTo(subject.id);
                startTransition(() => {
                  router.push(`/subjects/${subject.id}`);
                });
              }}
              disabled={navigatingTo === subject.id}
              className="rounded-2xl bg-white p-5 min-h-[220px] flex flex-col justify-between items-start relative border border-[#F3F3F3] transition-all duration-300 hover:scale-105 hover:border-purple-200 w-full disabled:opacity-50 disabled:cursor-not-allowed text-left"
              style={{ boxShadow: "0 4px 0 #ececec" }}
            >
              <div className="flex items-center mb-2">
                <div
                  className="bg-[#5B5BFF] rounded-xl p-2 flex items-center justify-center relative"
                  style={{ width: 48, height: 48 }}
                >
                  {navigatingTo === subject.id ? (
                    <svg
                      className="animate-spin h-8 w-8 text-white"
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
                    <Image
                      src="/images/wisky-read.png"
                      alt={subject.title}
                      width={32}
                      height={32}
                    />
                  )}
                </div>
              </div>
              <div className="mt-2">
                <div className="font-fredoka font-bold text-xl text-gray-900 mb-1 line-clamp-2">
                  {subject.title}
                </div>
                {subject.description && (
                  <div className="text-gray-500 text-sm mb-2 line-clamp-1">
                    {subject.description}
                  </div>
                )}
              </div>
              <div className="text-gray-400 text-sm font-medium mt-4">
                {subject._count?.notes || 0} Notes created &bull;{" "}
                {getRelativeTime(subject.updatedAt)}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default Subjects;
