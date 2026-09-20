"use client";
import SharedNoteSelector from "@/components/study/NoteSelector";

interface NoteSelectorProps {
  subjectId?: string;
  subjectName: string;
  notes: {
    id: string;
    title: string;
    rawContent: string;
    knowledgeBase?: string | null;
  }[];
  onNotesSelected: (noteIds: string[]) => void;
  onBack: () => void;
}

export default function NoteSelector({
  subjectName,
  notes,
  onNotesSelected,
  onBack,
}: NoteSelectorProps) {
  return (
    <SharedNoteSelector
      tool="summary"
      subjectName={subjectName}
      notes={notes}
      onNotesSelected={onNotesSelected}
      onBack={onBack}
    />
  );
}
