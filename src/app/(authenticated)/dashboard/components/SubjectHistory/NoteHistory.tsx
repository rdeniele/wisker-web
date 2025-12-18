"use client";

import React from "react";
import HistoryCard from "@/components/ui/HistoryCard";
import Link from "next/link";

// Simulated subjects array (replace with backend data fetch in real app)
const subjects = [
  {
    title: "Mathematics",
    imageSrc: "/images/ui/book.png",
    createdSecondsAgo: 20,
  },
  {
    title: "Physics",
    imageSrc: "/images/ui/book.png",
    createdSecondsAgo: 120,
  },
  {
    title: "Chemistry",
    imageSrc: "/images/ui/book.png",
    createdSecondsAgo: 300,
  },
  {
    title: "Biology",
    imageSrc: "/images/ui/book.png",
    createdSecondsAgo: 900,
  },
  {
    title: "History",
    imageSrc: "/images/ui/book.png",
    createdSecondsAgo: 1800,
  },
  {
    title: "Geography",
    imageSrc: "/images/ui/book.png",
    createdSecondsAgo: 3600,
  },
  {
    title: "English",
    imageSrc: "/images/ui/book.png",
    createdSecondsAgo: 4000,
  },
  {
    title: "Computer Science",
    imageSrc: "/images/ui/book.png",
    createdSecondsAgo: 4200,
  },
  {
    title: "Art",
    imageSrc: "/images/ui/book.png",
    createdSecondsAgo: 4400,
  },
  {
    title: "Music",
    imageSrc: "/images/ui/book.png",
    createdSecondsAgo: 4600,
  },
  {
    title: "Economics",
    imageSrc: "/images/ui/book.png",
    createdSecondsAgo: 4800,
  },
];

import { useState, useEffect } from "react";

function NoteHistory() {
  // Limit to 15 most recent subjects
  // Add slug for routing preparation
  const limitedNotes = subjects.slice(0, 15).map((s) => ({
    ...s,
    slug: s.title.toLowerCase().replace(/\s+/g, "-"),
  }));
  const [startIdx, setStartIdx] = useState(0);
  const [maxVisible, setMaxVisible] = useState(3);

  // Responsive: adjust maxVisible based on screen size (Subjects.tsx logic)
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 640) {
        setMaxVisible(1); // mobile
      } else if (window.innerWidth < 1024) {
        setMaxVisible(2); // tablet
      } else {
        setMaxVisible(3); // desktop
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Always show buttons and always loop
  const handleLeft = () => {
    if (startIdx === 0) {
      setStartIdx(limitedNotes.length - maxVisible);
    } else {
      setStartIdx(startIdx - 1);
    }
  };
  const handleRight = () => {
    if (startIdx + maxVisible >= limitedNotes.length) {
      setStartIdx(0);
    } else {
      setStartIdx(startIdx + 1);
    }
  };

  return (
    <div className="w-full">
      {limitedNotes.length > 0 ? (
        <>
          <h1
            className="text-3xl font-extrabold text-gray-900 mb-6"
            style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
          >
            Run It Back
          </h1>
          <div className="flex items-center w-full gap-2">
            <button
              onClick={handleLeft}
              className="rounded-full p-2 bg-[#E4DFFF] hover:bg-[#d1c8ff] transition-all duration-300 mr-2"
              aria-label="Scroll left"
            >
              <span className="text-2xl text-white">&#8592;</span>
            </button>
            <div className="flex-1 flex justify-center items-center gap-2">
              {/* Previous card (faded, if exists) */}
              <div className="opacity-30 scale-95 transition-all duration-500 shrink-0 hidden sm:block">
                {limitedNotes[startIdx - 1] && (
                  <Link
                    href={`/notes/${limitedNotes[startIdx - 1].slug}`}
                    className="transition-all duration-500 shrink-0"
                    prefetch={false}
                  >
                    <HistoryCard
                      imageSrc={limitedNotes[startIdx - 1].imageSrc}
                      title={limitedNotes[startIdx - 1].title}
                      createdSecondsAgo={
                        limitedNotes[startIdx - 1].createdSecondsAgo
                      }
                    />
                  </Link>
                )}
              </div>
              {/* Visible cards */}
              {limitedNotes
                .slice(startIdx, startIdx + maxVisible)
                .map((note, idx) => (
                  <Link
                    key={note.title + idx}
                    href={`/notes/${note.slug}`}
                    className="transition-all duration-500 shrink-0 focus:outline-none active:scale-95 hover:scale-105 hover:shadow-lg w-full max-w-[220px]"
                    style={{ transform: "scale(1)", opacity: 1 }}
                    prefetch={false}
                  >
                    <HistoryCard
                      imageSrc={note.imageSrc}
                      title={note.title}
                      createdSecondsAgo={note.createdSecondsAgo}
                    />
                  </Link>
                ))}
              {/* Next card (faded, if exists) */}
              <div className="opacity-30 scale-95 transition-all duration-500 shrink-0 hidden sm:block">
                {limitedNotes[startIdx + maxVisible] && (
                  <Link
                    href={`/notes/${limitedNotes[startIdx + maxVisible].slug}`}
                    className="transition-all duration-500 shrink-0"
                    prefetch={false}
                  >
                    <HistoryCard
                      imageSrc={limitedNotes[startIdx + maxVisible].imageSrc}
                      title={limitedNotes[startIdx + maxVisible].title}
                      createdSecondsAgo={
                        limitedNotes[startIdx + maxVisible].createdSecondsAgo
                      }
                    />
                  </Link>
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
        <h1
          className="text-2xl font-bold text-gray-400 text-center py-12"
          style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
        >
          No more recent subjects
        </h1>
      )}
    </div>
  );
}

export default NoteHistory;
