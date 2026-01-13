import React, { useState } from "react";

const quizFrequencies = ["Daily", "Weekly", "Bi-Weekly", "Monthly"];

interface CreateSubjectProps {
  onClose?: () => void;
}

function CreateSubject({ onClose }: CreateSubjectProps) {
  const [subjectName, setSubjectName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [quizFrequency, setQuizFrequency] = useState(quizFrequencies[0]);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add actual API call here
    console.log("Creating subject:", { subjectName, examDate, quizFrequency });
    
    setIsCreating(false);
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 relative font-sans transition-colors">
      {/* Close Button */}
      <button
        className="absolute left-4 top-4 text-2xl text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="Close"
        type="button"
        onClick={onClose}
        disabled={isCreating}
      >
        &#10005;
      </button>

      {/* Header */}
      <div className="flex items-center justify-center mb-2">
        <h2 className="text-2xl font-bold text-center w-full mt-2 mb-2 text-gray-900">
          Add Subject
        </h2>
        <button
          className="absolute right-4 top-4 bg-orange-400 hover:bg-orange-500 text-white font-semibold px-5 py-1.5 rounded-lg shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          type="submit"
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </>
          ) : (
            "Create"
          )}
        </button>
      </div>

      {/* Description */}
      <p className="text-gray-700 text-base mb-4 mt-2">
        Create a new subject to organize your study materials
      </p>

      {/* Subject Name */}
      <div className="mb-4">
        <label
          className="block text-sm font-semibold mb-1 text-gray-900"
          htmlFor="subjectName"
        >
          Subject Name
        </label>
        <input
          id="subjectName"
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 text-base bg-white text-gray-900"
          placeholder="e.g~ Mathematics, Biology"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
        />
      </div>

      {/* Exam Date */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1 text-gray-900" htmlFor="examDate">
          Exam Date{" "}
          <span className="text-gray-500 font-normal">(Optional)</span>
        </label>
        <div className="relative">
          <input
            id="examDate"
            type="date"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 text-base pr-10 bg-white text-gray-900"
            placeholder="mm/dd/yyyy"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10m-9 4h6m2 5a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2h10z"
              />
            </svg>
          </span>
        </div>
      </div>

      {/* Quiz Frequency */}
      <div className="mb-2">
        <label
          className="block text-sm font-semibold mb-1 text-gray-900"
          htmlFor="quizFrequency"
        >
          Quiz Frequency
        </label>
        <div className="relative">
          <select
            id="quizFrequency"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 text-base appearance-none bg-white text-gray-900"
            value={quizFrequency}
            onChange={(e) => setQuizFrequency(e.target.value)}
          >
            {quizFrequencies.map((freq) => (
              <option key={freq} value={freq}>
                {freq}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </div>
      </div>
    </form>
  );
}

export default CreateSubject;
