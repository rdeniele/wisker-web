"use client";
import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { generateLearningTool } from "@/lib/generate-tool";
import ToolSetupFrame from "@/components/study/ToolSetupFrame";
import SummaryOptions from "@/components/study/SummaryOptions";
import type { SummaryLength, SummaryType } from "@/components/study/options";

interface SummarySetupProps {
  noteId: string;
  noteTitle: string;
  onGenerate: (config: SummaryConfig) => void;
  onBack: () => void;
}

export interface SummaryConfig {
  learningToolId: string;
  summaryLength: SummaryLength;
  summaryType: SummaryType;
}

export default function SummarySetup({
  noteId,
  noteTitle,
  onGenerate,
  onBack,
}: SummarySetupProps) {
  const [summaryLength, setSummaryLength] = useState<SummaryLength>("medium");
  const [summaryType, setSummaryType] = useState<SummaryType>("paragraph");
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const learningToolId = await generateLearningTool(
        {
          type: "SUMMARY",
          source: "SINGLE_NOTE",
          noteId,
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
          Generate a summary for <span className="font-extrabold text-ink">{noteTitle}</span>
        </>
      }
      backLabel="Back to note"
      onBack={onBack}
      submitLabel="Generate summary"
      generatingLabel="Generating summary..."
      isGenerating={isGenerating}
      onSubmit={handleGenerate}
      tip="The summary is generated from your note content."
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
