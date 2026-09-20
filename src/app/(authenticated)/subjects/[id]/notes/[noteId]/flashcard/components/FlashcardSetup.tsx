"use client";
import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { generateLearningTool } from "@/lib/generate-tool";
import ToolSetupFrame, {
  CountPicker,
  OptionCards,
} from "@/components/study/ToolSetupFrame";
import { DIFFICULTY_OPTIONS, type Difficulty } from "@/components/study/options";

interface FlashcardSetupProps {
  noteId: string;
  noteTitle: string;
  onStart: (config: FlashcardConfig) => void;
  onBack: () => void;
}

export interface FlashcardConfig {
  numberOfCards: number;
  difficulty: Difficulty;
  learningToolId: string;
}

export default function FlashcardSetup({
  noteId,
  noteTitle,
  onStart,
  onBack,
}: FlashcardSetupProps) {
  const [numberOfCards, setNumberOfCards] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();

  const handleStart = async () => {
    setIsGenerating(true);
    try {
      const learningToolId = await generateLearningTool(
        {
          type: "FLASHCARDS",
          source: "SINGLE_NOTE",
          noteId,
          cardCount: numberOfCards,
          difficulty,
        },
        "flashcards",
      );
      showToast("Flashcards generated successfully!", "success");
      onStart({ numberOfCards, difficulty, learningToolId });
    } catch (error) {
      console.error("Error generating flashcards:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to generate flashcards. Please try again.",
        "error",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ToolSetupFrame
      tool="flashcard"
      subtitle={
        <>
          Customize your flashcards on <span className="font-extrabold text-ink">{noteTitle}</span>
        </>
      }
      backLabel="Back to note"
      onBack={onBack}
      submitLabel="Generate flashcards"
      generatingLabel="Generating flashcards..."
      isGenerating={isGenerating}
      onSubmit={handleStart}
      tip={`AI will generate ${numberOfCards} ${difficulty} flashcards from this note.`}
    >
      <CountPicker
        legend="Number of cards"
        values={[5, 10, 15, 20, 25]}
        value={numberOfCards}
        onChange={setNumberOfCards}
      />
      <OptionCards
        legend="Difficulty"
        options={DIFFICULTY_OPTIONS}
        value={difficulty}
        onChange={setDifficulty}
      />
    </ToolSetupFrame>
  );
}
