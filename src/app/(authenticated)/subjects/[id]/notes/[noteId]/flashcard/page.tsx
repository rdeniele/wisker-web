"use client";
import { notFound, useRouter } from "next/navigation";
import { noteContent } from "@/lib/data/subjects";
import { use, useState } from "react";
import FlashcardView from "./components/FlashcardView";
import FlashcardSetup, { FlashcardConfig } from "./components/FlashcardSetup";

interface FlashcardPageProps {
  params: Promise<{ id: string; noteId: string }>;
}

function FlashcardPage({ params }: FlashcardPageProps) {
  const { id, noteId } = use(params);
  const router = useRouter();
  const [config, setConfig] = useState<FlashcardConfig | null>(null);

  const noteKey = `${id}-${noteId}`;
  const note = noteContent[noteKey];

  if (!note) {
    return notFound();
  }

  const handleStart = (newConfig: FlashcardConfig) => {
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
      <FlashcardSetup
        noteTitle={note.title}
        onStart={handleStart}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <FlashcardView
          noteTitle={note.title}
          noteContent={note.content}
          config={config}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}

export default FlashcardPage;
