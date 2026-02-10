"use client";
import { notFound, useRouter } from "next/navigation";
import { use, useState, useTransition, useEffect } from "react";
import dynamic from "next/dynamic";
import PageLayout from "@/components/layouts/PageLayout";
import PageHeader from "@/components/ui/pageheader";
import NoteCard from "@/components/ui/NoteCard";
import { FiArrowLeft } from "react-icons/fi";
import CreateNoteModal from "./notes/components/CreateNoteModal";
import { useToast } from "@/contexts/ToastContext";

// Dynamically import UploadPDF to prevent SSR issues with pdfjs
const UploadPDF = dynamic(() => import("./notes/components/UploadPDF"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
      </div>
    </div>
  ),
});

interface SubjectPageProps {
  params: Promise<{ id: string }>;
}

interface Note {
  id: string;
  title: string;
  rawContent: string;
  createdAt: string;
  updatedAt: string;
}

const SubjectPage = ({ params }: SubjectPageProps) => {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  const [showUploadPDF, setShowUploadPDF] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [subject, setSubject] = useState<{
    id: string;
    title: string;
    description?: string;
  } | null>(null);

  // Fetch subject and notes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingNotes(true);
      try {
        // Fetch subject details
        const subjectResponse = await fetch(`/api/subjects/${id}`);
        if (!subjectResponse.ok) {
          const errorData = await subjectResponse.json();
          console.error("Subject fetch error:", {
            status: subjectResponse.status,
            statusText: subjectResponse.statusText,
            errorData
          });
          
          if (subjectResponse.status === 404) {
            showToast("Subject not found. It may have been deleted.", "error");
            router.push("/subjects");
            return;
          }
          
          const errorMessage = errorData.error?.message || errorData.message || "Failed to fetch subject";
          throw new Error(errorMessage);
        }
        const subjectData = await subjectResponse.json();
        setSubject(subjectData.data);

        // Fetch notes for this subject
        const notesResponse = await fetch(`/api/notes?subjectId=${id}`);
        if (!notesResponse.ok) {
          const errorData = await notesResponse.json();
          const errorMessage = errorData.error?.message || errorData.message || "Failed to fetch notes";
          throw new Error(errorMessage);
        }
        const notesData = await notesResponse.json();
        setNotes(notesData.data.notes || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        showToast(error instanceof Error ? error.message : "Failed to load data", "error");
      } finally {
        setIsLoadingNotes(false);
      }
    };

    fetchData();
  }, [id, router, showToast]);

  // Function to refresh notes without full page reload
  const refreshNotes = async () => {
    try {
      const notesResponse = await fetch(`/api/notes?subjectId=${id}`);
      if (!notesResponse.ok) {
        throw new Error("Failed to fetch notes");
      }
      const notesData = await notesResponse.json();
      setNotes(notesData.data.notes || []);
    } catch (error) {
      console.error("Error refreshing notes:", error);
    }
  };

  // Action buttons configuration
  const actionButtons = [
    {
      id: "summary",
      label: "Summarize",
      description: "Get concise summaries of key concepts and main ideas",
      route: `/subjects/${id}/summary`,
      disabledTooltip: "Add notes first to generate a summary",
      enabledTooltip: "Generate a summary from your notes",
    },
    {
      id: "quiz",
      label: "Quiz Me",
      description: "Answer multiple-choice questions based on your notes",
      route: `/subjects/${id}/quiz`,
      disabledTooltip: "Add notes first to take a quiz",
      enabledTooltip: "Take a quiz on your notes",
    },
    {
      id: "flashcard",
      label: "Flashcards",
      description: "Review Q&A cards for quick memorization and recall",
      route: `/subjects/${id}/flashcard`,
      disabledTooltip: "Add notes first to create flashcards",
      enabledTooltip: "Create flashcards from your notes",
    },
  ];

  const handleActionClick = (route: string, actionId: string) => {
    if (notes.length > 0) {
      setNavigatingTo(actionId);
      startTransition(() => {
        router.push(route);
        setNavigatingTo(null);
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      showToast("Note deleted successfully", "success");
      // Remove the note from state
      setNotes(notes.filter((note) => note.id !== noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
      showToast("Failed to delete note", "error");
    }
  };

  if (isLoadingNotes) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
        </div>
      </PageLayout>
    );
  }

  if (!subject) {
    return notFound();
  }

  return (
    <PageLayout>
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition group"
      >
        <FiArrowLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span className="font-medium">Back to Subjects</span>
      </button>

      {/* Header Section with better spacing */}
      <div className="mb-6">
        <PageHeader title={subject.title} centered={false} />
        {subject.description && (
          <p className="text-gray-700 mt-3 text-base">{subject.description}</p>
        )}
        <p className="text-gray-600 mt-2 text-sm">
          {notes.length} {notes.length === 1 ? "note" : "notes"} • Manage your
          learning materials
        </p>
      </div>

      {/* Action Buttons - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        {actionButtons.map((action) => {
          const isDisabled = notes.length === 0 || navigatingTo === action.id;
          const isLoading = navigatingTo === action.id;

          return (
            <div key={action.id} className="flex flex-col">
              <button
                onClick={() => handleActionClick(action.route, action.id)}
                disabled={isDisabled}
                className={`w-full h-12 sm:h-10 rounded-lg transition-all font-medium text-sm text-center flex items-center justify-center gap-2 ${
                  isDisabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                    : "bg-[#615FFF] text-white hover:bg-[#524CE5] active:translate-y-0.5 active:shadow-none"
                }`}
                style={{
                  boxShadow: isDisabled
                    ? "none"
                    : "0 4px 0 0 rgba(97, 95, 255, 0.3)",
                }}
                title={
                  notes.length === 0
                    ? action.disabledTooltip
                    : action.enabledTooltip
                }
              >
                {isLoading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {action.label}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center px-2">
                {action.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Notes Section with Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Your Notes</h2>
          {notes.length > 0 && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </span>
          )}
        </div>
      </div>

      {/* Notes Grid or Empty State */}
      {notes.length === 0 ? (
        <div className="flex items-center justify-center py-20 px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No notes yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start building your knowledge base by adding your first note.
            </p>
            <button
              onClick={() => setShowCreateNoteModal(true)}
              className="bg-orange-400 hover:bg-orange-500 text-white font-medium py-3 px-6 rounded-xl transition-all active:scale-95 inline-flex items-center gap-2"
              style={{ boxShadow: "0 4px 0 0 rgba(251, 146, 60, 0.18)" }}
            >
              <span className="text-xl">+</span> Create Your First Note
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              id={parseInt(note.id, 10) || 0}
              title={note.title}
              createdAt={new Date(note.createdAt)}
              lastOpened={new Date(note.updatedAt)}
              characterCount={note.rawContent.length}
              onClick={() => router.push(`/subjects/${id}/notes/${note.id}`)}
              onView={() => router.push(`/subjects/${id}/notes/${note.id}`)}
              onEdit={() => router.push(`/subjects/${id}/notes/${note.id}`)}
              onDelete={() => handleDeleteNote(note.id)}
            />
          ))}
        </div>
      )}

      {/* Add Note Floating Button - Only show when notes exist */}
      {notes.length > 0 && (
        <button
          className="fixed bottom-8 right-8 bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 px-6 sm:px-8 rounded-2xl flex items-center gap-2 text-base sm:text-lg z-50 transition-all hover:scale-105 active:scale-95 shadow-lg"
          onClick={() => setShowCreateNoteModal(true)}
          style={{ boxShadow: "0 8px 0 0 rgba(251, 146, 60, 0.18)" }}
        >
          <span className="text-xl sm:text-2xl">+</span>
          <span className="hidden sm:inline">Add Note</span>
          <span className="sm:hidden">Add</span>
        </button>
      )}

      {/* Create Note Modal Popup */}
      {showCreateNoteModal && !showUploadPDF && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => setShowCreateNoteModal(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
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
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <UploadPDF
              subjectId={id}
              onClose={() => {
                setShowUploadPDF(false);
                setShowCreateNoteModal(true);
              }}
              onFileSelect={() => {
                setShowUploadPDF(false);
                setShowCreateNoteModal(false);
                // Refresh notes list
                refreshNotes();
              }}
              onGoogleDrive={() => {
                showToast("Google Drive integration coming soon!", "info");
              }}
            />
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default SubjectPage;
