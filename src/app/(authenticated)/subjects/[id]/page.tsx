"use client";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { use, useState, useTransition, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  LuArrowLeft,
  LuBookOpen,
  LuLayers,
  LuListChecks,
  LuPlus,
} from "react-icons/lu";
import PageHeader from "@/components/ui/pageheader";
import NoteCard from "@/components/ui/NoteCard";
import Button, { Spinner } from "@/components/ui/button";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import CreateNoteModal from "./notes/components/CreateNoteModal";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

// Dynamically import UploadPDF to prevent SSR issues with pdfjs
const UploadPDF = dynamic(() => import("./notes/components/UploadPDF"), {
  ssr: false,
  loading: () => (
    <div className="grid place-items-center py-16">
      <Spinner className="h-10 w-10 text-orange-500" />
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
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
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
          console.error("Failed to fetch subject");

          if (subjectResponse.status === 404) {
            showToast("Subject not found. It may have been deleted.", "error");
            router.push("/subjects");
            return;
          }

          const errorMessage =
            errorData.error?.message ||
            errorData.message ||
            "Failed to fetch subject";
          throw new Error(errorMessage);
        }
        const subjectData = await subjectResponse.json();
        setSubject(subjectData.data);

        // Fetch notes for this subject
        const notesResponse = await fetch(`/api/notes?subjectId=${id}`);
        if (!notesResponse.ok) {
          const errorData = await notesResponse.json();
          const errorMessage =
            errorData.error?.message ||
            errorData.message ||
            "Failed to fetch notes";
          throw new Error(errorMessage);
        }
        const notesData = await notesResponse.json();
        setNotes(notesData.data.notes || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        showToast(
          error instanceof Error ? error.message : "Failed to load data",
          "error",
        );
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

  // Study tools, in the order students reach for them
  const actionButtons = [
    {
      id: "quiz",
      label: "Quiz me",
      description: "Answer multiple-choice questions based on your notes",
      route: `/subjects/${id}/quiz`,
      disabledTooltip: "Add notes first to take a quiz",
      icon: LuListChecks,
      tone: "bg-orange-100 text-orange-700",
    },
    {
      id: "flashcard",
      label: "Flashcards",
      description: "Review Q&A cards for quick memorization and recall",
      route: `/subjects/${id}/flashcard`,
      disabledTooltip: "Add notes first to create flashcards",
      icon: LuLayers,
      tone: "bg-indigo-100 text-indigo-700",
    },
    {
      id: "summary",
      label: "Summarize",
      description: "Get concise summaries of key concepts and main ideas",
      route: `/subjects/${id}/summary`,
      disabledTooltip: "Add notes first to generate a summary",
      icon: LuBookOpen,
      tone: "bg-green-100 text-green-700",
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
    setIsDeletingNote(true);
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
    } finally {
      setIsDeletingNote(false);
      setNoteToDelete(null);
    }
  };

  if (isLoadingNotes) {
    return (
      <div aria-busy="true" className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-2/3" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-[24px]" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-[22px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!subject) {
    return notFound();
  }

  const hasNotes = notes.length > 0;

  return (
    <div>
      <Link
        href="/subjects"
        className="group -ml-2 mb-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-[15px] font-bold text-gray-600 hover:text-ink"
      >
        <LuArrowLeft
          className="h-5 w-5 transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        />
        Subjects
      </Link>

      <PageHeader
        centered={false}
        title={subject.title}
        subtitle={subject.description || undefined}
        actions={
          <Button
            className="hidden sm:inline-flex"
            onClick={() => setShowCreateNoteModal(true)}
          >
            <LuPlus className="h-5 w-5" aria-hidden />
            Add note
          </Button>
        }
      />
      <p className="mt-3">
        <span className="chip chip-neutral">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </span>
      </p>

      {/* Study tools */}
      <section aria-labelledby="study-title" className="mt-8">
        <h2
          id="study-title"
          className="mb-3.5 text-xl font-semibold text-ink sm:text-2xl"
        >
          Study
        </h2>
        <ul className="grid gap-3.5 sm:grid-cols-3 sm:gap-4">
          {actionButtons.map((action) => {
            const isDisabled = !hasNotes || navigatingTo === action.id;
            const isLoading = navigatingTo === action.id;
            const Icon = action.icon;
            return (
              <li key={action.id}>
                <button
                  type="button"
                  onClick={() => handleActionClick(action.route, action.id)}
                  disabled={isDisabled}
                  className={cn(
                    "card flex min-h-[88px] w-full items-center gap-4 rounded-[24px] p-4 text-left sm:min-h-[150px] sm:flex-col sm:items-start sm:justify-between sm:p-5",
                    !isDisabled && "card-interactive",
                    !hasNotes &&
                      "cursor-not-allowed bg-gray-50 opacity-70 shadow-none",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
                      action.tone,
                    )}
                  >
                    {isLoading ? (
                      <Spinner className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-xl font-semibold text-ink">
                      {action.label}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold leading-snug text-gray-600">
                      {hasNotes ? action.description : action.disabledTooltip}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Notes */}
      <section aria-labelledby="notes-title" className="mt-10">
        <h2
          id="notes-title"
          className="mb-3.5 text-xl font-semibold text-ink sm:text-2xl"
        >
          Notes
        </h2>

        {!hasNotes ? (
          <EmptyState
            mascot="read"
            title="No notes yet"
            message="Add your first note, or upload a PDF or slides and Wisker will read them for you."
            action={
              <Button size="lg" onClick={() => setShowCreateNoteModal(true)}>
                <LuPlus className="h-5 w-5" aria-hidden />
                Add your first note
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                id={parseInt(note.id, 10) || 0}
                title={note.title}
                createdAt={new Date(note.createdAt)}
                lastOpened={new Date(note.updatedAt)}
                characterCount={note.rawContent.length}
                href={`/subjects/${id}/notes/${note.id}`}
                onView={() => router.push(`/subjects/${id}/notes/${note.id}`)}
                onEdit={() => router.push(`/subjects/${id}/notes/${note.id}`)}
                onDelete={() => setNoteToDelete(note.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Phone: floating add button above the bottom navigation */}
      {hasNotes && (
        <button
          type="button"
          className="btn btn-primary fixed bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom,0px)+16px)] right-4 z-30 h-14 rounded-full px-5 sm:hidden"
          onClick={() => setShowCreateNoteModal(true)}
        >
          <LuPlus className="h-6 w-6" aria-hidden />
          Add note
        </button>
      )}

      <Modal
        open={showCreateNoteModal && !showUploadPDF}
        onClose={() => setShowCreateNoteModal(false)}
        title="Add a note"
        description="Choose how you'd like to bring your material in."
      >
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
      </Modal>

      <Modal
        open={showUploadPDF}
        onClose={() => {
          setShowUploadPDF(false);
          setShowCreateNoteModal(true);
        }}
        title="Upload material"
        description="Wisker turns your files into a note you can study from."
      >
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
      </Modal>

      <ConfirmDialog
        open={!!noteToDelete}
        title="Delete this note?"
        description="This can't be undone."
        confirmLabel="Delete note"
        busy={isDeletingNote}
        onClose={() => !isDeletingNote && setNoteToDelete(null)}
        onConfirm={() => noteToDelete && handleDeleteNote(noteToDelete)}
      />
    </div>
  );
};

export default SubjectPage;
