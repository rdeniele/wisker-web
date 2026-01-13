"use client";
import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Example data, replace with backend fetch later
const exams = [
  {
    id: 1,
    title: "Programming",
    day: "Today",
    time: "50 mins",
    notes: 5,
    emoji: "💻",
    iconBg: "bg-purple-100",
    lineColor: "bg-purple-200",
    urgent: true,
  },
  {
    id: 2,
    title: "Mathematics",
    day: "Saturday",
    time: "5 days",
    notes: 14,
    emoji: "📐",
    iconBg: "bg-blue-100",
    lineColor: "bg-blue-200",
    urgent: false,
  },
  {
    id: 3,
    title: "Biology",
    day: "Monday",
    time: "7 days",
    notes: 0,
    emoji: "🧬",
    iconBg: "bg-green-100",
    lineColor: "bg-green-200",
    urgent: false,
  },
];

function UpcomingExam() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [navigatingTo, setNavigatingTo] = useState<number | null>(null);
  const topExams = exams.slice(0, 3);

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
        {topExams.map((exam, index) => (
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
                className={`relative z-10 w-14 h-14 rounded-full ${exam.iconBg} flex items-center justify-center text-2xl shadow-md hover:shadow-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {navigatingTo === exam.id ? (
                  <svg className="animate-spin h-6 w-6 text-gray-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  exam.emoji
                )}
              </button>
              
              {/* Connecting Line */}
              {index < topExams.length - 1 && (
                <div className={`w-0.5 h-full absolute top-14 ${exam.lineColor}`} />
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
                      {exam.urgent && (
                        <span className="px-2.5 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full animate-pulse">
                          Due {exam.day}!
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{exam.day}</p>
                  </div>
                  
                  {/* Time Badge */}
                  <div className="shrink-0 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold">
                    {exam.time}
                  </div>
                </div>

                {/* Notes info */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>📝</span>
                  <span>{exam.notes} {exam.notes === 1 ? 'note' : 'notes'} available</span>
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {topExams.length === 0 && (
        <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl">
          <span className="text-5xl mb-3 block">📚</span>
          <p className="text-gray-600 font-medium">No upcoming exams</p>
          <p className="text-sm text-gray-400 mt-1">You&apos;re all caught up!</p>
        </div>
      )}
    </div>
  );
}

export default UpcomingExam;
