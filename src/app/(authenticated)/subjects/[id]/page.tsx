"use client";
import { notFound, useRouter } from "next/navigation";
import { subjects, subjectNotes } from "@/lib/data/subjects";
import { use } from "react";
import PageLayout from "@/components/layouts/PageLayout";
import PageHeader from "@/components/ui/pageheader";
import NoteCard from "@/components/ui/NoteCard";
import EmptyState from "@/components/ui/EmptyState";
import { FiArrowLeft } from "react-icons/fi";
import { useState } from "react";
import CreateNoteModal from "./notes/components/CreateNoteModal";
import UploadPDF from "./notes/components/UploadPDF";

interface SubjectPageProps {
  params: Promise<{ id: string }>;
}

const SubjectPage = ({ params }: SubjectPageProps) => {
  const { id } = use(params);
  const router = useRouter();
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  const [showUploadPDF, setShowUploadPDF] = useState(false);

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
      
      <div className="flex items-center justify-between mb-6">
        <PageHeader title={subject.name} centered={false} />
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/subjects/${id}/summary`)}
            disabled={noteCards.length === 0}
            className={`px-4 py-2 rounded-[5px] transition font-medium text-sm text-center shadow-[0_3px_0_#615FFF] ${
              noteCards.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                : "bg-[#615FFF] text-white hover:bg-[#524CE5]"
            }`}
            title={noteCards.length === 0 ? "Add notes first to generate a summary" : "Generate a summary from your notes"}
          >
            Summarize
          </button>
          <button
            onClick={() => router.push(`/subjects/${id}/quiz`)}
            disabled={noteCards.length === 0}
            className={`px-4 py-2 rounded-[5px] transition font-medium text-sm text-center shadow-[0_3px_0_#615FFF] ${
              noteCards.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                : "bg-[#615FFF] text-white hover:bg-[#524CE5]"
            }`}
            title={noteCards.length === 0 ? "Add notes first to take a quiz" : "Take a quiz on your notes"}
          >
            Quiz Me
          </button>
          <button
            onClick={() => router.push(`/subjects/${id}/flashcard`)}
            disabled={noteCards.length === 0}
            className={`px-4 py-2 rounded-[5px] transition font-medium text-sm text-center shadow-[0_3px_0_#615FFF] ${
              noteCards.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                : "bg-[#615FFF] text-white hover:bg-[#524CE5]"
            }`}
            title={noteCards.length === 0 ? "Add notes first to create flashcards" : "Create flashcards from your notes"}
          >
            Flashcards
          </button>
        </div>
      </div>
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

      {/* Add Note Floating Button */}
      <button
        className="fixed bottom-8 right-8 bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-2xl shadow-lg flex items-center gap-2 text-lg z-50 transition active:scale-95"
        onClick={() => setShowCreateNoteModal(true)}
      >
        <span className="text-2xl">+</span> Add Note
      </button>

      {/* Create Note Modal Popup */}
      {showCreateNoteModal && !showUploadPDF && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          onClick={() => setShowCreateNoteModal(false)}
        >
          <div className="relative" onClick={e => e.stopPropagation()}>
            <CreateNoteModal
              onClose={() => setShowCreateNoteModal(false)}
              onCreateNote={() => {
                setShowCreateNoteModal(false);
                // Add create note logic here
              }}
              onUpload={() => {
                setShowUploadPDF(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Upload PDF Modal Popup */}
      {showUploadPDF && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          onClick={() => {
            setShowUploadPDF(false);
            setShowCreateNoteModal(false);
          }}
        >
          <div className="relative" onClick={e => e.stopPropagation()}>
            <UploadPDF
              onClose={() => {
                setShowUploadPDF(false);
                setShowCreateNoteModal(true);
              }}
              onFileSelect={() => {
                setShowUploadPDF(false);
                setShowCreateNoteModal(false);
                // Handle file upload logic here
              }}
              onGoogleDrive={() => {
                // Handle Google Drive upload logic here
              }}
            />
          </div>
        </div>
      )}
    </PageLayout>
  );
};


export default SubjectPage;
