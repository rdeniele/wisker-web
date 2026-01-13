"use client";
import { useState, useEffect } from "react";
import { FiRotateCw, FiChevronLeft, FiChevronRight, FiArrowLeft } from "react-icons/fi";
import { FlashcardConfig } from "./FlashcardSetup";

interface Flashcard {
  id: number;
  front: string;
  back: string;
  difficulty: "easy" | "medium" | "hard";
  noteTitle: string;
}

interface Note {
  id: number;
  title: string;
  createdAt: Date;
  lastOpened: Date;
  characterCount: number;
}

interface FlashcardViewProps {
  subjectName: string;
  selectedNoteIds: number[];
  notes: Note[];
  config: FlashcardConfig;
  onBack: () => void;
}

export default function FlashcardView({
  subjectName,
  selectedNoteIds,
  notes,
  config,
  onBack,
}: FlashcardViewProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const selectedNotes = notes.filter((note) => selectedNoteIds.includes(note.id));

  // Generate flashcards from selected notes
  useEffect(() => {
    const generateFlashcards = () => {
      const mockCards: Flashcard[] = [];

      const questionTemplates = {
        easy: [
          "What is the main topic of {title}?",
          "Define key terms from {title}",
          "What are the basic concepts in {title}?",
        ],
        medium: [
          "Explain the relationship between concepts in {title}",
          "How do the ideas in {title} apply in practice?",
          "Compare and contrast the main points in {title}",
        ],
        hard: [
          "Analyze the implications discussed in {title}",
          "Synthesize information from {title} to create new understanding",
          "Evaluate the strengths and limitations in {title}",
        ],
      };

      const cardsPerNote = Math.ceil(config.numberOfCards / selectedNotes.length);

      selectedNotes.forEach((note) => {
        const templates = questionTemplates[config.difficulty];
        
        for (let i = 0; i < cardsPerNote && mockCards.length < config.numberOfCards; i++) {
          const template = templates[i % templates.length];
          const question = template.replace("{title}", note.title);
          
          mockCards.push({
            id: mockCards.length + 1,
            front: question,
            back: `This is the answer based on the content from "${note.title}". In a real application, this would be generated from the actual note content.`,
            difficulty: config.difficulty,
            noteTitle: note.title,
          });
        }
      });

      setFlashcards(mockCards);
      setIsLoading(false);
    };

    generateFlashcards();
  }, [selectedNotes, config]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group"
        >
          <FiArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="font-medium">Back to Setup</span>
        </button>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Generating flashcards...</div>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group"
        >
          <FiArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="font-medium">Back to Setup</span>
        </button>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Flashcards Available
          </h3>
          <p className="text-gray-600">
            Could not generate flashcards from the selected notes.
          </p>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group"
      >
        <FiArrowLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span className="font-medium">Back to Setup</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold font-fredoka text-gray-900 mb-2">
          {subjectName} - Flashcards
        </h1>
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <p className="text-gray-600">
            Card {currentIndex + 1} of {flashcards.length}
          </p>
          <span className="text-gray-400">•</span>
          <p className={`font-semibold ${
            config.difficulty === "easy"
              ? "text-green-600"
              : config.difficulty === "medium"
              ? "text-yellow-600"
              : "text-red-600"
          }`}>
            {config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1)} Mode
          </p>
          <span className="text-gray-400">•</span>
          <p className="text-purple-600 font-semibold">
            From: {currentCard.noteTitle}
          </p>
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex flex-col items-center">
        <div
          className="relative w-full max-w-2xl h-96 cursor-pointer perspective-1000"
          onClick={handleFlip}
        >
          <div
            className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
              transition: "transform 0.6s",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front of card */}
            <div
              className="absolute w-full h-full bg-white rounded-lg shadow-lg p-8 flex flex-col items-center justify-center backface-hidden"
              style={{
                backfaceVisibility: "hidden",
              }}
            >
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4 uppercase tracking-wide">
                  Question
                </p>
                <p className="text-xl md:text-2xl font-medium text-gray-900">
                  {currentCard.front}
                </p>
              </div>
              <p className="text-sm text-gray-400 mt-8">Click to flip</p>
            </div>

            {/* Back of card */}
            <div
              className="absolute w-full h-full bg-[#615FFF] rounded-lg shadow-lg p-8 flex flex-col items-center justify-center backface-hidden"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="text-center">
                <p className="text-sm text-white/80 mb-4 uppercase tracking-wide">
                  Answer
                </p>
                <p className="text-xl md:text-2xl font-medium text-white">
                  {currentCard.back}
                </p>
              </div>
              <p className="text-sm text-white/60 mt-8">Click to flip</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft size={20} />
            Previous
          </button>

          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            title="Restart"
          >
            <FiRotateCw size={20} />
            Restart
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <FiChevronRight size={20} />
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center gap-2 mt-6">
          {flashcards.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsFlipped(false);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-8 bg-[#615FFF]"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
