"use client";
import { notFound, useRouter } from "next/navigation";
import { subjects, subjectNotes } from "@/lib/data/subjects";
import { use, useState } from "react";
import NoteSelector from "./components/NoteSelector";
import QuizSetup, { QuizConfig } from "./components/QuizSetup";
import QuizPlay from "./components/QuizPlay";
import QuizResults from "./components/QuizResults";

interface SubjectQuizPageProps {
  params: Promise<{ id: string }>;
}

type QuizState = "selecting" | "setup" | "playing" | "results";

function SubjectQuizPage({ params }: SubjectQuizPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [state, setState] = useState<QuizState>("selecting");
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const subject = subjects.find((s) => s.id === Number(id));
  const notes = subjectNotes[Number(id)] || [];

  if (!subject) {
    return notFound();
  }

  const handleNotesSelected = (noteIds: number[]) => {
    setSelectedNoteIds(noteIds);
    setState("setup");
  };

  const handleStart = (newConfig: QuizConfig) => {
    setConfig(newConfig);
    setState("playing");
  };

  const handleQuizComplete = (correct: number, total: number) => {
    setScore({ correct, total });
    setState("results");
  };

  const handleRetry = () => {
    setState("setup");
  };

  const handleBack = () => {
    if (state === "results" || state === "playing") {
      setState("setup");
    } else if (state === "setup") {
      setState("selecting");
    } else {
      router.back();
    }
  };

  if (state === "selecting") {
    return (
      <NoteSelector
        subjectName={subject.name}
        notes={notes}
        onNotesSelected={handleNotesSelected}
        onBack={() => router.back()}
      />
    );
  }

  if (state === "setup") {
    return (
      <QuizSetup
        subjectName={subject.name}
        selectedNotesCount={selectedNoteIds.length}
        onStart={handleStart}
        onBack={handleBack}
      />
    );
  }

  if (state === "playing" && config) {
    return (
      <QuizPlay
        subjectName={subject.name}
        selectedNoteIds={selectedNoteIds}
        notes={notes}
        config={config}
        onComplete={handleQuizComplete}
        onBack={handleBack}
      />
    );
  }

  if (state === "results") {
    return (
      <QuizResults
        subjectName={subject.name}
        score={score.correct}
        total={score.total}
        onRetry={handleRetry}
        onBack={() => router.back()}
      />
    );
  }

  return null;
}

export default SubjectQuizPage;
