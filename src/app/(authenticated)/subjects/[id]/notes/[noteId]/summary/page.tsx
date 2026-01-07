"use client";
import { notFound, useRouter } from "next/navigation";
import { noteContent } from "@/lib/data/subjects";
import { use, useState } from "react";
import SummarySetup, { SummaryConfig } from "./components/SummarySetup";
import SummaryView from "./components/SummaryView";

interface SummaryPageProps {
  params: Promise<{ id: string; noteId: string }>;
}

function SummaryPage({ params }: SummaryPageProps) {
  const { id, noteId } = use(params);
  const router = useRouter();
  const [config, setConfig] = useState<SummaryConfig | null>(null);

  const noteKey = `${id}-${noteId}`;
  const note = noteContent[noteKey];

  if (!note) {
    return notFound();
  }

  const handleGenerate = (newConfig: SummaryConfig) => {
    setConfig(newConfig);
  };

  const handleBack = () => {
    if (config) {
      setConfig(null);
    } else {
      router.back();
    }
  };

  if (!config) {
    return (
      <SummarySetup
        noteTitle={note.title}
        onGenerate={handleGenerate}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <SummaryView
          noteTitle={note.title}
          noteContent={note.content}
          config={config}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}

export default SummaryPage;
