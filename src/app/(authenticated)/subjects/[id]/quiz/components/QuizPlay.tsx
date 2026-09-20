"use client";
import { QuizConfig } from "./QuizSetup";
import QuizPlayer from "@/components/study/QuizPlayer";

interface QuizPlayProps {
  subjectName: string;
  config: QuizConfig;
  onBack: () => void;
  onComplete: (correct: number, total: number) => void;
}

export default function QuizPlay({
  subjectName,
  config,
  onBack,
  onComplete,
}: QuizPlayProps) {
  return (
    <QuizPlayer
      title={subjectName}
      learningToolId={config.learningToolId}
      onBack={onBack}
      onComplete={onComplete}
    />
  );
}
