"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { subjects as subjectsData } from "@/lib/data/subjects";

function Subjects() {
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
          <Link
            key={subject.id}
            href={`/subjects/${subject.id}`}
            className="rounded-2xl bg-white shadow-[0_4px_0_0_rgba(91,91,255,0.08)] p-5 min-h-[220px] flex flex-col justify-between items-start relative border border-[#F3F3F3] transition-all duration-300 hover:scale-105 hover:shadow-lg w-full"
            prefetch={false}
          >
            <div className="flex items-center mb-2">
              <div
                className="bg-[#5B5BFF] rounded-xl p-2 flex items-center justify-center"
                style={{ width: 48, height: 48 }}
              >
                <Image
                  src={subject.img}
                  alt={subject.name}
                  width={32}
                  height={32}
                />
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
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Subjects;
