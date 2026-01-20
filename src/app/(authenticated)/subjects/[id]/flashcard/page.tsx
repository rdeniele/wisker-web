"use client";
import { notFound, useRouter } from "next/navigation";
import { use, useState, useEffect } from "react";
import NoteSelector from "./components/NoteSelector";
import FlashcardSetup, { FlashcardConfig } from "./components/FlashcardSetup";
import FlashcardView from "./components/FlashcardView";

interface SubjectFlashcardPageProps {
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

function SubjectFlashcardPage({ params }: SubjectFlashcardPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [config, setConfig] = useState<FlashcardConfig | null>(null);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!subject) {
    return notFound();
  }

  const handleNotesSelected = (noteIds: string[]) => {
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
        subjectName={subject.title}
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
        subjectName={subject.title}
        selectedNotesCount={selectedNoteIds.length}
        selectedNoteIds={selectedNoteIds}
        subjectId={id}
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
          subjectName={subject.title}
          config={config}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}

export default SubjectFlashcardPage;
