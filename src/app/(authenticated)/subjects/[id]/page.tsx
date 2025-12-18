"use client";
import { notFound, useRouter } from "next/navigation";
import { subjects, subjectNotes } from "@/lib/data/subjects";
import { use } from "react";
import PageLayout from "@/components/layouts/PageLayout";
import PageHeader from "@/components/ui/pageheader";
import NoteCard from "@/components/ui/NoteCard";
import EmptyState from "@/components/ui/EmptyState";
import { FiArrowLeft } from "react-icons/fi";

interface SubjectPageProps {
  params: Promise<{ id: string }>;
}

function SubjectPage({ params }: SubjectPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const subject = subjects.find((s) => s.id === Number(id));
  if (!subject) return notFound();

  const noteCards = subjectNotes[subject.id] || [];

  return (
    <PageLayout>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition group"
      >
        <FiArrowLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span className="font-medium">Back</span>
      </button>
      <PageHeader title={subject.name} centered={false} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {noteCards.length === 0 ? (
          <EmptyState message="No notes found." />
        ) : (
          noteCards.map((noteCard) => (
            <NoteCard
              key={noteCard.id}
              id={noteCard.id}
              title={noteCard.title}
              createdAt={noteCard.createdAt}
              lastOpened={noteCard.lastOpened}
              characterCount={noteCard.characterCount}
              onClick={() =>
                router.push(`/subjects/${id}/notes/${noteCard.id}`)
              }
              onView={() => router.push(`/subjects/${id}/notes/${noteCard.id}`)}
              onEdit={() => console.log("Edit note:", noteCard.id)}
              onDelete={() => console.log("Delete note:", noteCard.id)}
            />
          ))
        )}
      </div>
    </PageLayout>
  );
}

export default SubjectPage;
