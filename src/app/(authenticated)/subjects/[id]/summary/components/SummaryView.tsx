"use client";
import { SummaryConfig } from "./SummarySetup";
import SummaryReader from "@/components/study/SummaryReader";

interface SummaryViewProps {
  subjectName: string;
  config: SummaryConfig;
  onBack: () => void;
}

export default function SummaryView({
  subjectName,
  config,
  onBack,
}: SummaryViewProps) {
  return (
    <SummaryReader
      title={subjectName}
      learningToolId={config.learningToolId}
      summaryLength={config.summaryLength}
      summaryType={config.summaryType}
      onBack={onBack}
    />
  );
}
