"use client";
import { FlashcardConfig } from "./FlashcardSetup";
import FlashcardPlayer from "@/components/study/FlashcardPlayer";

interface FlashcardViewProps {
  noteTitle: string;
  config: FlashcardConfig;
  onBack: () => void;
}

export default function FlashcardView({
  noteTitle,
  config,
  onBack,
}: FlashcardViewProps) {
  return (
    <FlashcardPlayer
      title={noteTitle}
      learningToolId={config.learningToolId}
      difficulty={config.difficulty}
      onBack={onBack}
    />
  );
}
