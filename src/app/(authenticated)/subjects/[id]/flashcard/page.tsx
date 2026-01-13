"use client";
import { notFound, useRouter } from "next/navigation";
import { subjects, subjectNotes } from "@/lib/data/subjects";
import { use, useState } from "react";
import NoteSelector from "./components/NoteSelector";
import FlashcardSetup, { FlashcardConfig } from "./components/FlashcardSetup";
import FlashcardView from "./components/FlashcardView";

interface SubjectFlashcardPageProps {
  params: Promise<{ id: string }>;
}

function SubjectFlashcardPage({ params }: SubjectFlashcardPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [config, setConfig] = useState<FlashcardConfig | null>(null);

  const subject = subjects.find((s) => s.id === Number(id));
  const notes = subjectNotes[Number(id)] || [];

  if (!subject) {
    return notFound();
  }

  const handleNotesSelected = (noteIds: number[]) => {
    setSelectedNoteIds(noteIds);
  };

  const handleStart = (newConfig: FlashcardConfig) => {
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

  // Step 2: Configure flashcards
  if (!config) {
    return (
      <FlashcardSetup
        subjectName={subject.name}
        selectedNotesCount={selectedNoteIds.length}
        onStart={handleStart}
        onBack={handleBack}
      />
    );
  }

  // Step 3: View flashcards
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <FlashcardView
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

export default SubjectFlashcardPage;
