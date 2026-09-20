"use client";
import { QuizConfig } from "./QuizSetup";
import QuizPlayer from "@/components/study/QuizPlayer";

interface QuizPlayProps {
  noteTitle: string;
  config: QuizConfig;
  onBack: () => void;
  onComplete: (score: number) => void;
}

export default function QuizPlay({
  noteTitle,
  config,
  onBack,
  onComplete,
}: QuizPlayProps) {
  return (
    <QuizPlayer
      title={noteTitle}
      learningToolId={config.learningToolId}
      onBack={onBack}
      onComplete={(correct) => onComplete(correct)}
    />
  );
}
