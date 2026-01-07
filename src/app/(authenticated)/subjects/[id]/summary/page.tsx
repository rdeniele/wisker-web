"use client";
import { notFound, useRouter } from "next/navigation";
import { subjects, subjectNotes } from "@/lib/data/subjects";
import { use, useState } from "react";
import NoteSelector from "./components/NoteSelector";
import SummarySetup, { SummaryConfig } from "./components/SummarySetup";
import SummaryView from "./components/SummaryView";

interface SubjectSummaryPageProps {
  params: Promise<{ id: string }>;
}

function SubjectSummaryPage({ params }: SubjectSummaryPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [config, setConfig] = useState<SummaryConfig | null>(null);

  const subject = subjects.find((s) => s.id === Number(id));
  const notes = subjectNotes[Number(id)] || [];

  if (!subject) {
    return notFound();
  }

  const handleNotesSelected = (noteIds: number[]) => {
    setSelectedNoteIds(noteIds);
  };

  const handleGenerate = (newConfig: SummaryConfig) => {
    setConfig(newConfig);
  };

  const handleBack = () => {
    if (config) {
      setConfig(null);
    } else if (selectedNoteIds.length > 0) {
      setSelectedNoteIds([]);
    } else {
      router.back();
    }
  };

  // Step 1: Select notes
  if (selectedNoteIds.length === 0) {
    return (
      <NoteSelector
        subjectName={subject.name}
        notes={notes}
        onNotesSelected={handleNotesSelected}
        onBack={() => router.back()}
      />
    );
  }

  // Step 2: Configure summary
  if (!config) {
    return (
      <SummarySetup
        subjectName={subject.name}
        selectedNotesCount={selectedNoteIds.length}
        onGenerate={handleGenerate}
        onBack={handleBack}
      />
    );
  }

  // Step 3: View summary
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <SummaryView
          subjectName={subject.name}
          selectedNoteIds={selectedNoteIds}
          notes={notes}
          config={config}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}

export default SubjectSummaryPage;
