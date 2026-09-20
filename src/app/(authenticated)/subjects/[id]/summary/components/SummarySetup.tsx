"use client";
import { useState, useMemo } from "react";
import { LuTriangleAlert, LuCircleAlert } from "react-icons/lu";
import { useToast } from "@/contexts/ToastContext";
import { generateLearningTool } from "@/lib/generate-tool";
import ToolSetupFrame from "@/components/study/ToolSetupFrame";
import SummaryOptions from "@/components/study/SummaryOptions";
import type { SummaryLength, SummaryType } from "@/components/study/options";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  rawContent: string;
  knowledgeBase?: string | null;
}

interface SummarySetupProps {
  subjectId: string;
  subjectName: string;
  selectedNoteIds: string[];
  selectedNotes: Note[];
  selectedNotesCount: number;
  onGenerate: (config: SummaryConfig) => void;
  onBack: () => void;
}

export interface SummaryConfig {
  learningToolId: string;
  summaryLength: SummaryLength;
  summaryType: SummaryType;
}

// Content size thresholds (in characters)
const WARNING_THRESHOLD = 20000; // ~5,000 tokens
const ERROR_THRESHOLD = 40000; // ~10,000 tokens

const formatSize = (size: number) =>
  size < 1000 ? `${size} chars` : `${(size / 1000).toFixed(1)}K chars`;

export default function SummarySetup({
  subjectId,
  subjectName,
  selectedNoteIds,
  selectedNotes,
  selectedNotesCount,
  onGenerate,
  onBack,
}: SummarySetupProps) {
  const [summaryLength, setSummaryLength] = useState<SummaryLength>("medium");
  const [summaryType, setSummaryType] = useState<SummaryType>("paragraph");
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();

  const totalContentSize = useMemo(
    () =>
      selectedNotes.reduce(
        (total, note) => total + (note.knowledgeBase || note.rawContent).length,
        0,
      ),
    [selectedNotes],
  );
  const level =
    totalContentSize > ERROR_THRESHOLD
      ? "error"
      : totalContentSize > WARNING_THRESHOLD
        ? "warning"
        : null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const learningToolId = await generateLearningTool(
        {
          type: "SUMMARY",
          source: "SUBJECT",
          subjectId,
          noteIds: selectedNoteIds,
          summaryLength,
          summaryType,
        },
        "summary",
      );
      showToast("Summary generated successfully!", "success");
      onGenerate({ learningToolId, summaryLength, summaryType });
    } catch (error) {
      console.error("Error generating summary:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to generate summary",
        "error",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ToolSetupFrame
      tool="summary"
      subtitle={
        <>
          Generate a summary for <span className="font-extrabold text-ink">{subjectName}</span>
        </>
      }
      context={`Based on ${selectedNotesCount} selected note${selectedNotesCount !== 1 ? "s" : ""}`}
      backLabel="Back to note selection"
      onBack={onBack}
      submitLabel="Generate summary"
      generatingLabel="Generating summary..."
      isGenerating={isGenerating}
      onSubmit={handleGenerate}
      tip="The summary is generated from your selected notes."
      notice={
        level && (
          <div
            role="status"
            className={cn(
              "flex items-start gap-3 rounded-2xl border-2 p-4",
              level === "error" ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50",
            )}
          >
            {level === "error" ? (
              <LuCircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
            ) : (
              <LuTriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" aria-hidden />
            )}
            <div className="text-sm font-semibold text-gray-700">
              <p className={cn("font-display text-base font-semibold", level === "error" ? "text-red-700" : "text-yellow-700")}>
                {level === "error" ? "Content size very large" : "Large content size"}
              </p>
              <p className="mt-0.5">
                {level === "error"
                  ? "Generation may take longer or fail."
                  : "Generation may take a bit longer."}
              </p>
              <p className="mt-1 text-gray-600">
                Total {formatSize(totalContentSize)} from {selectedNotesCount} note
                {selectedNotesCount !== 1 ? "s" : ""} (recommended under {formatSize(WARNING_THRESHOLD)})
              </p>
              {level === "error" && (
                <button type="button" onClick={onBack} className="link mt-2 min-h-9 text-sm">
                  Go back and select fewer notes
                </button>
              )}
            </div>
          </div>
        )
      }
    >
      <SummaryOptions
        length={summaryLength}
        type={summaryType}
        onLength={setSummaryLength}
        onType={setSummaryType}
      />
    </ToolSetupFrame>
  );
}
