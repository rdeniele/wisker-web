import React from "react";
import HorizontalCard from "@/components/ui/HorizontalCard";

// Example data, replace with backend fetch later
const exams = [
  {
    title: "Programming",
    day: "Today",
    date: "September 8, 2025",
    time: "50 mins",
    notes: 5,
    image: "/images/ui/paw-book.png",
  },
  {
    title: "Mathematics",
    day: "Saturday",
    date: "September 13, 2025",
    time: "5 days",
    notes: 14,
    image: "/images/ui/paw-book.png",
  },
  {
    title: "Biology",
    day: "Monday",
    date: "September 15, 2025",
    time: "7 days",
    notes: 0,
    image: "/images/ui/paw-book.png",
  },
  // ...more exams
];

function UpcomingExam() {
  // Limit to top 3 most recent
  const topExams = exams.slice(0, 3);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h1
          className="text-3xl font-extrabold text-gray-900"
          style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
        >
          Upcoming Exam
        </h1>
        <button
          className="text-xl font-bold text-[#231F20] opacity-60 hover:opacity-100 transition-all"
          style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
        >
          See all
        </button>
      </div>
      <div className="space-y-6">
        {topExams.map((exam, idx) => (
          <div key={idx} style={{ fontFamily: "Fredoka, Arial, sans-serif" }}>
            <HorizontalCard
              title={exam.title}
              day={exam.day}
              date={exam.date}
              time={exam.time}
              notes={exam.notes}
              image={exam.image}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default UpcomingExam;
