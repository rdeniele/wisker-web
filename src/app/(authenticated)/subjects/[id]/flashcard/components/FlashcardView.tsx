"use client";
import { FlashcardConfig } from "./FlashcardSetup";
import FlashcardPlayer from "@/components/study/FlashcardPlayer";

interface FlashcardViewProps {
  subjectName: string;
  config: FlashcardConfig;
  onBack: () => void;
}

export default function FlashcardView({
  subjectName,
  config,
  onBack,
}: FlashcardViewProps) {
  return (
    <FlashcardPlayer
      title={subjectName}
      learningToolId={config.learningToolId}
      difficulty={config.difficulty}
      onBack={onBack}
    />
  );
}
