'use client';

import React from 'react';
import HistoryCard from '@/components/ui/HistoryCard';
import Link from 'next/link';

// Simulated subjects array (replace with backend data fetch in real app)
const subjects = [
  {
    title: 'Mathematics',
    imageSrc: '/images/ui/book.png',
    createdSecondsAgo: 20,
  },
  {
    title: 'Physics',
    imageSrc: '/images/ui/book.png',
    createdSecondsAgo: 120,
  },
  {
    title: 'Chemistry',
    imageSrc: '/images/ui/book.png',
    createdSecondsAgo: 300,
  },
  {
    title: 'Biology',
    imageSrc: '/images/ui/book.png',
    createdSecondsAgo: 900,
  },
  {
    title: 'History',
    imageSrc: '/images/ui/book.png',
    createdSecondsAgo: 1800,
  },
  {
    title: 'Geography',
    imageSrc: '/images/ui/book.png',
    createdSecondsAgo: 3600,
  },
  {
    title: 'English',
    imageSrc: '/images/ui/book.png',
    createdSecondsAgo: 4000,
  },
  {
    title: 'Computer Science',
    imageSrc: '/images/ui/book.png',
    createdSecondsAgo: 4200,
  },
  {
    title: 'Art',
    imageSrc: '/images/ui/book.png',
    createdSecondsAgo: 4400,
  },
  {
    title: 'Music',
    imageSrc: '/images/ui/book.png',
    createdSecondsAgo: 4600,
  },
  {
    title: 'Economics',
    imageSrc: '/images/ui/book.png',
    createdSecondsAgo: 4800,
  },
];

import { useState } from 'react';

function SubjectHistory() {
  // Limit to 15 most recent subjects
  // Add slug for routing preparation
  const limitedSubjects = subjects.slice(0, 15).map(s => ({
    ...s,
    slug: s.title.toLowerCase().replace(/\s+/g, '-')
  }));
  const [startIdx, setStartIdx] = useState(0);
  const maxVisible = 3;
  const canScrollLeft = startIdx > 0;
  const canScrollRight = startIdx + maxVisible < limitedSubjects.length;

  const handleLeft = () => {
    if (canScrollLeft) {
      setStartIdx(Math.max(0, startIdx - 1));
    } else {
      // Loop to end
      setStartIdx(limitedSubjects.length - maxVisible);
    }
  };
  const handleRight = () => {
    if (canScrollRight) {
      setStartIdx(Math.min(limitedSubjects.length - maxVisible, startIdx + 1));
    } else {
      // Loop to start
      setStartIdx(0);
    }
  };

  return (
    <div className="w-full">
      {limitedSubjects.length > 0 ? (
        <>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Run it back</h1>
          <div className="flex items-center w-full">
            <button
              onClick={handleLeft}
              className="rounded-full p-2 bg-[#E4DFFF] hover:bg-[#d1c8ff] transition-all duration-300 mr-2"
              aria-label="Scroll left"
            >
              <span className="text-2xl text-white">&#8592;</span>
            </button>
            <div className="flex-1 flex justify-center items-center gap-1">
              {/* Previous card (faded, if exists) */}
              <div className="opacity-30 scale-95 transition-all duration-500 shrink-0">
                {limitedSubjects[startIdx - 1] && (
                  <HistoryCard
                    imageSrc={limitedSubjects[startIdx - 1].imageSrc}
                    title={limitedSubjects[startIdx - 1].title}
                    createdSecondsAgo={limitedSubjects[startIdx - 1].createdSecondsAgo}
                  />
                )}
              </div>
              {/* Visible cards */}
              {limitedSubjects.slice(startIdx, startIdx + maxVisible).map((subject, idx) => (
                <Link
                  key={subject.title + idx}
                  href={`/subjects/${subject.slug}`}
                  className="transition-all duration-500 shrink-0 focus:outline-none active:scale-95 hover:scale-105 hover:shadow-lg"
                  style={{ transform: 'scale(1)', opacity: 1 }}
                  prefetch={false}
                >
                  <HistoryCard
                    imageSrc={subject.imageSrc}
                    title={subject.title}
                    createdSecondsAgo={subject.createdSecondsAgo}
                  />
                </Link>
              ))}
              {/* Next card (faded, if exists) */}
              <div className="opacity-30 scale-95 transition-all duration-500 shrink-0">
                {limitedSubjects[startIdx + maxVisible] && (
                  <HistoryCard
                    imageSrc={limitedSubjects[startIdx + maxVisible].imageSrc}
                    title={limitedSubjects[startIdx + maxVisible].title}
                    createdSecondsAgo={limitedSubjects[startIdx + maxVisible].createdSecondsAgo}
                  />
                )}
              </div>
            </div>
            <button
              onClick={handleRight}
              className="rounded-full p-2 bg-[#E4DFFF] hover:bg-[#d1c8ff] transition-all duration-300 ml-2"
              aria-label="Scroll right"
            >
              <span className="text-2xl text-white">&#8594;</span>
            </button>
          </div>
        </>
      ) : (
        <h1 className="text-2xl font-bold text-gray-400 text-center py-12">No more recent subjects</h1>
      )}
    </div>
  );
}

export default SubjectHistory;