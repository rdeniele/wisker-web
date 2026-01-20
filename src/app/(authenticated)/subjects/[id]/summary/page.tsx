"use client";
import { notFound, useRouter } from "next/navigation";
import { use, useState, useEffect } from "react";
import NoteSelector from "./components/NoteSelector";
import SummarySetup, { SummaryConfig } from "./components/SummarySetup";
import SummaryView from "./components/SummaryView";

interface SubjectSummaryPageProps {
  params: Promise<{ id: string }>;
}

interface Subject {
  id: string;
  title: string;
}

interface Note {
  id: string;
  title: string;
  rawContent: string;
}

function SubjectSummaryPage({ params }: SubjectSummaryPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [config, setConfig] = useState<SummaryConfig | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch subject
        const subjectRes = await fetch(`/api/subjects/${id}`);
        if (!subjectRes.ok) {
          notFound();
        }
        const subjectData = await subjectRes.json();
        setSubject(subjectData.data);

        // Fetch notes for this subject
        const notesRes = await fetch(`/api/notes?subjectId=${id}`);
        if (notesRes.ok) {
          const notesData = await notesRes.json();
          setNotes(notesData.data.notes || []);
        }
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!subject) {
    return notFound();
  }

  const handleNotesSelected = (noteIds: string[]) => {
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
        subjectId={id}
        subjectName={subject.title}
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
        subjectId={id}
        subjectName={subject.title}
        selectedNoteIds={selectedNoteIds}
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
          subjectName={subject.title}
          config={config}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}

export default SubjectSummaryPage;
