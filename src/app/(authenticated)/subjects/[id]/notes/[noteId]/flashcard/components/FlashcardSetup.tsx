"use client";
import { useState, useTransition } from "react";
import {
  FiArrowLeft,
  FiLayers,
  FiSmile,
  FiMeh,
  FiZap,
  FiInfo,
} from "react-icons/fi";
import { useToast } from "@/../hook/useToast";

interface FlashcardSetupProps {
  noteId: string;
  noteTitle: string;
  onStart: (config: FlashcardConfig) => void;
  onBack: () => void;
}

export interface FlashcardConfig {
  numberOfCards: number;
  difficulty: "easy" | "medium" | "hard";
  learningToolId: string;
}

export default function FlashcardSetup({
  noteId,
  noteTitle,
  onStart,
  onBack,
}: FlashcardSetupProps) {
  const [numberOfCards, setNumberOfCards] = useState(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleStart = async () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/learning-tools/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "FLASHCARDS",
            source: "SINGLE_NOTE",
            noteId,
            cardCount: numberOfCards,
            difficulty,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate flashcards");
        }

        const data = await response.json();

        onStart({
          numberOfCards,
          difficulty,
          learningToolId: data.data.id,
        });
      } catch (error) {
        console.error("Error generating flashcards:", error);
        showToast("Failed to generate flashcards. Please try again.", "error");
      }
    });
  };

  const difficultyOptions = [
    {
      value: "easy" as const,
      label: "Easy",
      description: "Basic concepts and definitions",
      color: "green",
      icon: FiSmile,
    },
    {
      value: "medium" as const,
      label: "Medium",
      description: "Moderate understanding required",
      color: "yellow",
      icon: FiMeh,
    },
    {
      value: "hard" as const,
      label: "Hard",
      description: "Advanced analysis and application",
      color: "red",
      icon: FiZap,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group mb-6"
        >
          <FiArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="font-medium">Back to Note</span>
        </button>

        {/* Setup Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
              <FiLayers className="text-purple-600" size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Flashcard Setup
            </h1>
            <p className="text-gray-600">
              Customize your flashcards for{" "}
              <span className="font-semibold">{noteTitle}</span>
            </p>
          </div>

          {/* Number of Cards */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Number of Flashcards
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {[5, 10, 15, 20, 25].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumberOfCards(num)}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                    numberOfCards === num
                      ? "bg-[#615FFF] text-white shadow-md scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Difficulty Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {difficultyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDifficulty(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    difficulty === option.value
                      ? option.color === "green"
                        ? "border-green-500 bg-green-50 shadow-md scale-105"
                        : option.color === "yellow"
                          ? "border-yellow-500 bg-yellow-50 shadow-md scale-105"
                          : "border-red-500 bg-red-50 shadow-md scale-105"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <option.icon
                      className={`text-2xl ${
                        difficulty === option.value
                          ? option.color === "green"
                            ? "text-green-600"
                            : option.color === "yellow"
                              ? "text-yellow-600"
                              : "text-red-600"
                          : "text-gray-600"
                      }`}
                      size={24}
                    />
                    <span className="font-bold text-gray-900">
                      {option.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={isPending}
            className="w-full py-4 bg-[#615FFF] text-white rounded-xl hover:bg-[#524CE5] transition font-bold text-lg shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Generating Flashcards..." : "Generate Flashcards"}
          </button>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800 text-center flex items-center justify-center gap-2">
              <FiInfo className="text-blue-600" size={16} />
              <span className="font-semibold">Tip:</span> Flashcards will be
              AI-generated based on your note content
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
