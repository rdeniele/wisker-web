"use client";
import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { subjects as subjectsData } from "@/lib/data/subjects";

function Subjects() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  
  // Take first 4 subjects from the mock data
  const recentSubjects = subjectsData.slice(0, 4);

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
          <button
            key={subject.id}
            onClick={() => {
              setNavigatingTo(`subject-${subject.id}`);
              startTransition(() => {
                router.push(`/subjects/${subject.id}`);
              });
            }}
            disabled={navigatingTo === `subject-${subject.id}`}
            className="rounded-2xl bg-white shadow-[0_4px_0_0_rgba(91,91,255,0.08)] p-5 min-h-[220px] flex flex-col justify-between items-start relative border border-[#F3F3F3] transition-all duration-300 hover:scale-105 hover:shadow-lg w-full disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="flex items-center mb-2">
              <div
                className="bg-[#5B5BFF] rounded-xl p-2 flex items-center justify-center relative"
                style={{ width: 48, height: 48 }}
              >
                {navigatingTo === `subject-${subject.id}` ? (
                  <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Image
                    src={subject.img}
                    alt={subject.name}
                    width={32}
                    height={32}
                  />
                )}
              </div>
            </div>
            <div className="mt-2">
              <div className="font-fredoka font-bold text-xl text-gray-900 mb-1">
                {subject.name}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                <span className="text-gray-700 text-base font-medium">
                  Quiz in 7 days
                </span>
              </div>
            </div>
            <div className="text-gray-400 text-sm font-medium mt-4">
              {subject.notes} Notes created &bull; {subject.time}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Subjects;
