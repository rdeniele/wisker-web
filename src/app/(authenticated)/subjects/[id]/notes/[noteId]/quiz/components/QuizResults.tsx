"use client";
import ResultsScreen from "@/components/study/ResultsScreen";

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  noteTitle: string;
  onRetake: () => void;
  onBackToNote: () => void;
}

export default function QuizResults({
  score,
  totalQuestions,
  noteTitle,
  onRetake,
  onBackToNote,
}: QuizResultsProps) {
  return (
    <ResultsScreen
      title={noteTitle}
      score={score}
      total={totalQuestions}
      onRetry={onRetake}
      onBack={onBackToNote}
      backLabel="Back to note"
    />
  );
}
