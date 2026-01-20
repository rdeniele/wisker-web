"use client";
import { use, useState, useEffect } from "react";
import { useRouter, notFound } from "next/navigation";
import QuizSetup, { QuizConfig } from "./components/QuizSetup";
import QuizPlay from "./components/QuizPlay";
import QuizResults from "./components/QuizResults";

interface QuizPageProps {
  params: Promise<{ id: string; noteId: string }>;
}

interface Note {
  id: string;
  title: string;
  rawContent: string;
}

type QuizState = "setup" | "playing" | "results";

export default function QuizPage({ params }: QuizPageProps) {
  const { noteId } = use(params);
  const router = useRouter();
  
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quizState, setQuizState] = useState<QuizState>("setup");
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await fetch(`/api/notes/${noteId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch note');
        }
        const data = await response.json();
        setNote(data.data);
      } catch (error) {
        console.error('Error fetching note:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

  const handleStartQuiz = (newConfig: QuizConfig) => {
    setConfig(newConfig);
    setQuizState("playing");
  };

  const handleQuizComplete = (score: number) => {
    setFinalScore(score);
    setQuizState("results");
  };

  const handleRetake = () => {
    setQuizState("setup");
    setConfig(null);
    setFinalScore(0);
  };

  const handleBackToNote = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!note) {
    return notFound();
  }

  // Render based on quiz state
  if (quizState === "setup") {
    return (
      <QuizSetup
        noteId={noteId}
        noteTitle={note.title}
        onStart={handleStartQuiz}
        onBack={handleBackToNote}
      />
    );
  }

  if (quizState === "results") {
    return (
      <QuizResults
        score={finalScore}
        totalQuestions={config?.numberOfQuestions || 0}
        noteTitle={note.title}
        onRetake={handleRetake}
        onBackToNote={handleBackToNote}
      />
    );
  }

  // Playing state
  if (!config) {
    return notFound();
  }

  return (
    <QuizPlay
      noteTitle={note.title}
      config={config}
      onBack={handleBackToNote}
      onComplete={handleQuizComplete}
    />
  );
}
