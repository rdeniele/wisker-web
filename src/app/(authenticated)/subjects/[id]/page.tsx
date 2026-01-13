"use client";
import { notFound, useRouter } from "next/navigation";
import { subjects, subjectNotes } from "@/lib/data/subjects";
import { use, useState, useTransition, useEffect } from "react";
import PageLayout from "@/components/layouts/PageLayout";
import PageHeader from "@/components/ui/pageheader";
import NoteCard from "@/components/ui/NoteCard";
import EmptyState from "@/components/ui/EmptyState";
import { FiArrowLeft } from "react-icons/fi";
import CreateNoteModal from "./notes/components/CreateNoteModal";
import UploadPDF from "./notes/components/UploadPDF";

interface SubjectPageProps {
  params: Promise<{ id: string }>;
}

const SubjectPage = ({ params }: SubjectPageProps) => {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  const [showUploadPDF, setShowUploadPDF] = useState(false);

  const subject = subjects.find((s) => s.id === Number(id));

  // Remove effect that synchronously resets navigatingTo to avoid cascading renders

  if (!subject) return notFound();

  const noteCards = subjectNotes[subject.id] || [];

  // Action buttons configuration
  const actionButtons = [
    {
      id: 'summary',
      label: 'Summarize',
      route: `/subjects/${id}/summary`,
      disabledTooltip: 'Add notes first to generate a summary',
      enabledTooltip: 'Generate a summary from your notes',
    },
    {
      id: 'quiz',
      label: 'Quiz Me',
      route: `/subjects/${id}/quiz`,
      disabledTooltip: 'Add notes first to take a quiz',
      enabledTooltip: 'Take a quiz on your notes',
    },
    {
      id: 'flashcard',
      label: 'Flashcards',
      route: `/subjects/${id}/flashcard`,
      disabledTooltip: 'Add notes first to create flashcards',
      enabledTooltip: 'Create flashcards from your notes',
    },
  ];

  const handleActionClick = (route: string, actionId: string) => {
    if (noteCards.length > 0) {
      setNavigatingTo(actionId);
      startTransition(() => {
        router.push(route);
        setNavigatingTo(null); // Reset navigatingTo after navigation
      });
    }
  };

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
          {actionButtons.map((action) => {
            const isDisabled = noteCards.length === 0 || navigatingTo === action.id;
            const isLoading = navigatingTo === action.id;
            
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.route, action.id)}
                disabled={isDisabled}
                className={`w-32 h-10 rounded-lg transition-all font-medium text-sm text-center flex items-center justify-center gap-2 ${
                  isDisabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                    : "bg-[#615FFF] text-white hover:bg-[#524CE5] active:translate-y-0.5 active:shadow-none"
                }`}
                style={{ boxShadow: isDisabled ? 'none' : '0 4px 0 0 rgba(97, 95, 255, 0.3)' }}
                title={noteCards.length === 0 ? action.disabledTooltip : action.enabledTooltip}
              >
                {isLoading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {action.label}
              </button>
            );
          })}
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
        className="fixed bottom-8 right-8 bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-2xl flex items-center gap-2 text-lg z-50 transition active:scale-95"
        onClick={() => setShowCreateNoteModal(true)}
        style={{ boxShadow: '0 8px 0 0 rgba(251, 146, 60, 0.18)' }}
      >
        <span className="text-2xl">+</span> Add Note
      </button>

      {/* Create Note Modal Popup */}
      {showCreateNoteModal && !showUploadPDF && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/20 backdrop-blur-sm"
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
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/20 backdrop-blur-sm"
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
