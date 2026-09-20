"use client";
import ResultsScreen from "@/components/study/ResultsScreen";

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
  return (
    <ResultsScreen
      title={subjectName}
      score={score}
      total={total}
      onRetry={onRetry}
      onBack={onBack}
      backLabel="Back to subject"
    />
  );
}
