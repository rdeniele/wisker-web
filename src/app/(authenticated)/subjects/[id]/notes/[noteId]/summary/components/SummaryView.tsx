"use client";
import { SummaryConfig } from "./SummarySetup";
import SummaryReader from "@/components/study/SummaryReader";

interface SummaryViewProps {
  noteTitle: string;
  config: SummaryConfig;
  onBack: () => void;
}

export default function SummaryView({
  noteTitle,
  config,
  onBack,
}: SummaryViewProps) {
  return (
    <SummaryReader
      title={noteTitle}
      learningToolId={config.learningToolId}
      summaryLength={config.summaryLength}
      summaryType={config.summaryType}
      onBack={onBack}
    />
  );
}
