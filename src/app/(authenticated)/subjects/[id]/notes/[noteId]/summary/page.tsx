"use client";
import PageLoading from "@/components/ui/PageLoading";
import { notFound, useRouter } from "next/navigation";
import { use, useState, useEffect } from "react";
import SummarySetup, { SummaryConfig } from "./components/SummarySetup";
import SummaryView from "./components/SummaryView";

interface SummaryPageProps {
  params: Promise<{ id: string; noteId: string }>;
}

interface Note {
  id: string;
  title: string;
  rawContent: string;
}

function SummaryPage({ params }: SummaryPageProps) {
  const { noteId } = use(params);
  const router = useRouter();
  const [config, setConfig] = useState<SummaryConfig | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await fetch(`/api/notes/${noteId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch note");
        }
        const data = await response.json();
        setNote(data.data);
      } catch (error) {
        console.error("Error fetching note:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

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

  if (isLoading) {
    return <PageLoading />;
  }

  if (!note) {
    return notFound();
  }

  if (!config) {
    return (
      <SummarySetup
        noteId={noteId}
        noteTitle={note.title}
        onGenerate={handleGenerate}
        onBack={handleBack}
      />
    );
  }

  return (
    <SummaryView
      noteTitle={note.title}
      config={config}
      onBack={handleBack}
    />
  );
}

export default SummaryPage;
