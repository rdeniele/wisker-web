"use client";
import { notFound, useRouter } from "next/navigation";
import { use, useState, useEffect } from "react";
import NoteSelector from "./components/NoteSelector";
import QuizSetup, { QuizConfig } from "./components/QuizSetup";
import QuizPlay from "./components/QuizPlay";
import QuizResults from "./components/QuizResults";

interface SubjectQuizPageProps {
  params: Promise<{ id: string }>;
}

interface Note {
  id: string;
  title: string;
  rawContent: string;
}

interface Subject {
  id: string;
  title: string;
}

type QuizState = "selecting" | "setup" | "playing" | "results";

function SubjectQuizPage({ params }: SubjectQuizPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [state, setState] = useState<QuizState>("selecting");
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [subject, setSubject] = useState<Subject | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch subject and notes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch subject details
        const subjectResponse = await fetch(`/api/subjects/${id}`);
        if (!subjectResponse.ok) {
          throw new Error("Failed to fetch subject");
        }
        const subjectData = await subjectResponse.json();
        setSubject(subjectData.data);

        // Fetch notes for this subject
        const notesResponse = await fetch(`/api/notes?subjectId=${id}`);
        if (!notesResponse.ok) {
          throw new Error("Failed to fetch notes");
        }
        const notesData = await notesResponse.json();
        setNotes(notesData.data.notes || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
      </div>
    );
  }

  if (!subject) {
    return notFound();
  }

  const handleNotesSelected = (noteIds: string[]) => {
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
        subjectName={subject.title}
        notes={notes}
        onNotesSelected={handleNotesSelected}
        onBack={() => router.back()}
      />
    );
  }

  if (state === "setup") {
    return (
      <QuizSetup
        subjectName={subject.title}
        selectedNotesCount={selectedNoteIds.length}
        selectedNoteIds={selectedNoteIds}
        subjectId={id}
        onStart={handleStart}
        onBack={handleBack}
      />
    );
  }

  if (state === "playing" && config) {
    return (
      <QuizPlay
        subjectName={subject.title}
        config={config}
        onComplete={handleQuizComplete}
        onBack={handleBack}
      />
    );
  }

  if (state === "results") {
    return (
      <QuizResults
        subjectName={subject.title}
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
