"use client";
import { FiArrowLeft, FiAward, FiThumbsUp, FiTrendingUp, FiBook } from "react-icons/fi";

interface QuizResultsProps {
  subjectName: string;
  score: number;
  total: number;
  onRetry: () => void;
  onBack: () => void;
}

export default function QuizResults({
  subjectName,
  score,
  total,
  onRetry,
  onBack,
}: QuizResultsProps) {
  const percentage = Math.round((score / total) * 100);

  const getPerformanceMessage = () => {
    if (percentage >= 90) return { message: "Outstanding!", icon: FiAward, color: "text-green-600" };
    if (percentage >= 70) return { message: "Great job!", icon: FiThumbsUp, color: "text-blue-600" };
    if (percentage >= 50) return { message: "Good effort!", icon: FiTrendingUp, color: "text-yellow-600" };
    return { message: "Keep practicing!", icon: FiBook, color: "text-orange-600" };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group mb-6"
        >
          <FiArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="font-medium">Back to Subject</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-4">
              <performance.icon className="text-orange-500" size={40} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Quiz Complete!
            </h1>
            <p className="text-gray-600">
              You finished the quiz on <span className="font-semibold">{subjectName}</span>
            </p>
          </div>

          <div className="bg-linear-to-br from-orange-50 to-yellow-50 rounded-xl p-8 mb-6">
            <div className="text-6xl font-bold text-orange-500 mb-2">
              {percentage}%
            </div>
            <p className="text-xl text-gray-700 mb-3">
              You scored {score} out of {total}
            </p>
            <p className={`text-lg font-semibold ${performance.color}`}>
              {performance.message}
            </p>
          </div>

          {/* Performance Breakdown */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{score}</p>
              <p className="text-sm text-gray-600">Correct</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-red-600">{total - score}</p>
              <p className="text-sm text-gray-600">Incorrect</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-orange-600">{total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold shadow-md hover:shadow-lg active:scale-95"
            >
              Retake Quiz
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold active:scale-95"
            >
              Back to Subject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
