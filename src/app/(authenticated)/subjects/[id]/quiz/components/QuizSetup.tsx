"use client";
import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { generateLearningTool } from "@/lib/generate-tool";
import ToolSetupFrame, {
  CountPicker,
  OptionCards,
} from "@/components/study/ToolSetupFrame";
import { DIFFICULTY_OPTIONS, type Difficulty } from "@/components/study/options";

interface QuizSetupProps {
  subjectName: string;
  selectedNotesCount: number;
  selectedNoteIds: string[];
  subjectId: string;
  onStart: (config: QuizConfig) => void;
  onBack: () => void;
}

export interface QuizConfig {
  numberOfQuestions: number;
  difficulty: Difficulty;
  learningToolId: string;
}

export default function QuizSetup({
  subjectName,
  selectedNotesCount,
  selectedNoteIds,
  subjectId,
  onStart,
  onBack,
}: QuizSetupProps) {
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();

  const handleStart = async () => {
    setIsGenerating(true);
    try {
      const learningToolId = await generateLearningTool(
        {
          type: "QUIZ",
          source: "SUBJECT",
          subjectId,
          noteIds: selectedNoteIds,
          questionCount: numberOfQuestions,
          difficulty,
        },
        "quiz",
      );
      showToast("Quiz generated successfully!", "success");
      onStart({ numberOfQuestions, difficulty, learningToolId });
    } catch (error) {
      console.error("Error generating quiz:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to generate quiz. Please try again.",
        "error",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ToolSetupFrame
      tool="quiz"
      subtitle={
        <>
          Customize your quiz on <span className="font-extrabold text-ink">{subjectName}</span>
        </>
      }
      context={`Based on ${selectedNotesCount} selected note${selectedNotesCount !== 1 ? "s" : ""}`}
      backLabel="Back to note selection"
      onBack={onBack}
      submitLabel="Start quiz"
      generatingLabel="Generating quiz..."
      isGenerating={isGenerating}
      onSubmit={handleStart}
      tip={`AI will generate ${numberOfQuestions} ${difficulty} questions from your selected notes.`}
    >
      <CountPicker
        legend="Number of questions"
        values={[3, 5, 10, 15, 20]}
        value={numberOfQuestions}
        onChange={setNumberOfQuestions}
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
