"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";

// Simulated subjects array (replace with backend data fetch in real app)
const subjects = [
  {
    title: "Biology",
    imageSrc: "/images/ui/paw-book.png",
    quizInDays: 7,
    notesCount: 0,
    createdSecondsAgo: 5,
  },
  {
    title: "Mathematics",
    imageSrc: "/images/ui/paw-book.png",
    quizInDays: 3,
    notesCount: 2,
    createdSecondsAgo: 120,
  },
  {
    title: "History",
    imageSrc: "/images/ui/paw-book.png",
    quizInDays: 10,
    notesCount: 1,
    createdSecondsAgo: 900,
  },
  {
    title: "Physics",
    imageSrc: "/images/ui/paw-book.png",
    quizInDays: 5,
    notesCount: 3,
    createdSecondsAgo: 1800,
  },
  {
    title: "Chemistry",
    imageSrc: "/images/ui/paw-book.png",
    quizInDays: 2,
    notesCount: 4,
    createdSecondsAgo: 3600,
  },
  {
    title: "Geography",
    imageSrc: "/images/ui/paw-book.png",
    quizInDays: 8,
    notesCount: 1,
    createdSecondsAgo: 4000,
  },
  {
    title: "English",
    imageSrc: "/images/ui/paw-book.png",
    quizInDays: 6,
    notesCount: 0,
    createdSecondsAgo: 4200,
  },
  {
    title: "Computer Science",
    imageSrc: "/images/ui/paw-book.png",
    quizInDays: 4,
    notesCount: 2,
    createdSecondsAgo: 4400,
  },
  {
    title: "Art",
    imageSrc: "/images/ui/paw-book.png",
    quizInDays: 9,
    notesCount: 0,
    createdSecondsAgo: 4600,
  },
  {
    title: "Music",
    imageSrc: "/images/ui/paw-book.png",
    quizInDays: 12,
    notesCount: 1,
    createdSecondsAgo: 4800,
  },
  {
    title: "Economics",
    imageSrc: "/images/ui/paw-book.png",
    quizInDays: 11,
    notesCount: 3,
    createdSecondsAgo: 5000,
  },
  {
    title: "Philosophy",
    imageSrc: "/images/ui/paw-book.png",
    quizInDays: 13,
    notesCount: 2,
    createdSecondsAgo: 5200,
  },
  {
    title: "Sociology",
    imageSrc: "/images/ui/paw-book.png",
    quizInDays: 14,
    notesCount: 1,
    createdSecondsAgo: 5400,
  },
  {
    title: "Political Science",
    imageSrc: "/images/ui/paw-book.png",
    quizInDays: 15,
    notesCount: 0,
    createdSecondsAgo: 5600,
  },
  {
    title: "Psychology",
    imageSrc: "/images/ui/paw-book.png",
    quizInDays: 16,
    notesCount: 2,
    createdSecondsAgo: 5800,
  },
];

function formatTimeAgo(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function Subjects() {
  // Sort by most recently opened (smaller createdSecondsAgo = more recent) and take first 4
  const recentSubjects = [...subjects]
    .sort((a, b) => a.createdSecondsAgo - b.createdSecondsAgo)
    .slice(0, 4)
    .map((s) => ({
      ...s,
      slug: s.title.toLowerCase().replace(/\s+/g, "-"),
    }));

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
        {recentSubjects.map((subject) => (
          <Link
            key={subject.title}
            href={`/subjects/${subject.slug}`}
            className="rounded-2xl bg-white shadow-[0_4px_0_0_rgba(91,91,255,0.08)] p-5 min-h-[220px] flex flex-col justify-between items-start relative border border-[#F3F3F3] transition-all duration-300 hover:scale-105 hover:shadow-lg w-full"
            prefetch={false}
          >
            <div className="flex items-center mb-2">
              <div
                className="bg-[#5B5BFF] rounded-xl p-2 flex items-center justify-center"
                style={{ width: 48, height: 48 }}
              >
                <Image
                  src={subject.imageSrc}
                  alt={subject.title}
                  width={32}
                  height={32}
                />
              </div>
            </div>
            <div className="mt-2">
              <div className="font-fredoka font-bold text-xl text-gray-900 mb-1">
                {subject.title}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                <span className="text-gray-700 text-base font-medium">
                  Quiz in {subject.quizInDays} days
                </span>
              </div>
            </div>
            <div className="text-gray-400 text-sm font-medium mt-4">
              {subject.notesCount} Notes created &bull;{" "}
              {formatTimeAgo(subject.createdSecondsAgo)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Subjects;
