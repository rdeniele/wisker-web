"use client";
import { useState } from "react";
import { FiArrowLeft, FiCheck, FiX } from "react-icons/fi";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizPlayProps {
  questions: QuizQuestion[];
  noteTitle: string;
  onBack: () => void;
  onComplete: (score: number) => void;
}

export default function QuizPlay({ questions, noteTitle, onBack, onComplete }: QuizPlayProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const isAnswered = answeredQuestions.includes(currentQuestion);

  const handleAnswerSelect = (optionIndex: number) => {
    if (isAnswered) return;
    setSelectedAnswer(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || isAnswered) return;

    const isCorrect = selectedAnswer === question.correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }

    setAnsweredQuestions([...answeredQuestions, currentQuestion]);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      onComplete(score);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group"
          >
            <FiArrowLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Quiz Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          {/* Note Title */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <p className="text-sm text-gray-500">Quiz on:</p>
            <h2 className="text-lg font-semibold text-gray-900">
              {noteTitle}
            </h2>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              {question.question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = question.correctAnswer === index;
                const showCorrectAnswer = isAnswered && isCorrect;
                const showIncorrectAnswer = isAnswered && isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={isAnswered}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      showCorrectAnswer
                        ? "border-green-500 bg-green-50"
                        : showIncorrectAnswer
                        ? "border-red-500 bg-red-50"
                        : isSelected
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
                    } ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-medium ${
                          showCorrectAnswer
                            ? "text-green-900"
                            : showIncorrectAnswer
                            ? "text-red-900"
                            : isSelected
                            ? "text-orange-900"
                            : "text-gray-900"
                        }`}
                      >
                        {option}
                      </span>
                      {showCorrectAnswer && (
                        <FiCheck className="text-green-600" size={24} />
                      )}
                      {showIncorrectAnswer && (
                        <FiX className="text-red-600" size={24} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation (shown after answering) */}
          {isAnswered && question.explanation && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Explanation:
              </p>
              <p className="text-sm text-blue-800">{question.explanation}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isAnswered ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:shadow-md"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold shadow-md hover:shadow-lg"
              >
                {isLastQuestion ? "See Results" : "Next Question"}
              </button>
            )}
          </div>
        </div>

        {/* Score Indicator */}
        <div className="text-center text-gray-600">
          <p className="text-sm">
            Current Score: {score} / {answeredQuestions.length}
          </p>
        </div>
      </div>
    </div>
  );
}
