import React, { useState } from "react";
import { useRouter } from "next/navigation";

const quizFrequencies = ["Daily", "Weekly", "Bi-Weekly", "Monthly"];

interface CreateSubjectProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

function CreateSubject({ onClose, onSuccess }: CreateSubjectProps) {
  const router = useRouter();
  const [subjectName, setSubjectName] = useState("");
  const [description, setDescription] = useState("");
  const [examDate, setExamDate] = useState("");
  const [quizFrequency, setQuizFrequency] = useState(quizFrequencies[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subjectName.trim()) {
      setError("Subject name is required");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/subjects/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: subjectName.trim(),
          description: description.trim() || undefined,
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error occurred. Please try again.");
      }

      const result = await response.json();

      if (!response.ok) {
        const errorMessage =
          result.error?.message || "Failed to create subject";
        throw new Error(errorMessage);
      }

      // Success - refresh and close
      onSuccess?.();
      router.refresh();
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create subject");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 relative font-sans transition-colors"
    >
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
      </div>

      {/* Description */}
      <p className="text-gray-700 text-base mb-4 mt-2">
        Create a new subject to organize your study materials
      </p>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

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
          required
          disabled={isCreating}
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label
          className="block text-sm font-semibold mb-1 text-gray-900"
          htmlFor="description"
        >
          Description{" "}
          <span className="text-gray-500 font-normal">(Optional)</span>
        </label>
        <textarea
          id="description"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 text-base bg-white text-gray-900 resize-none"
          placeholder="Add a brief description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={1000}
          disabled={isCreating}
        />
      </div>

      {/* Exam Date */}
      <div className="mb-4">
        <label
          className="block text-sm font-semibold mb-1 text-gray-900"
          htmlFor="examDate"
        >
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

      {/* Create Button */}
      <div className="mt-6">
        <button
          className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          type="submit"
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
              Creating...
            </>
          ) : (
            "Create Subject"
          )}
        </button>
      </div>
    </form>
  );
}

export default CreateSubject;
