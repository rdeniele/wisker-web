"use client";
import { notFound, useRouter } from "next/navigation";
import { use, useState, useEffect, useRef, useCallback } from "react";
import { FiArrowLeft } from "react-icons/fi";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useToast } from "@/contexts/ToastContext";

interface NotePageProps {
  params: Promise<{ id: string; noteId: string }>;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function NotePage({ params }: NotePageProps) {
  const { id, noteId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  
  interface Note {
    title: string;
    rawContent: string;
    // Add other fields as needed
  }

  const [note, setNote] = useState<Note | null>(null);

  // Fetch note data
  useEffect(() => {
    const fetchNote = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/notes/${noteId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch note");
        }
        const data = await response.json();
        const noteData = data.data;
        setNote(noteData);
        setTitle(noteData.title);
        setContent(noteData.rawContent);
      } catch (error) {
        console.error("Error fetching note:", error);
        showToast("Failed to load note", "error");
      } finally {
        setIsLoading(false);
        isInitialLoadRef.current = false;
      }
    };

    fetchNote();
  }, [noteId, showToast]);

  const saveNote = useCallback(async (titleToSave: string, contentToSave: string) => {
    if (!titleToSave.trim()) {
      return;
    }

    setSaveStatus("saving");
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: titleToSave.trim(),
          rawContent: contentToSave,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to update note");
      }

      setSaveStatus("saved");
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error saving note:", error);
      setSaveStatus("error");
      showToast(
        error instanceof Error ? error.message : "Failed to save note",
        "error",
      );
    }
  }, [noteId, showToast]);

  // Auto-save effect with debouncing
  useEffect(() => {
    // Skip auto-save on initial load
    if (isInitialLoadRef.current || isLoading) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (2 seconds after user stops typing)
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(title, content);
    }, 2000);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, isLoading, saveNote]);

  const handleManualSave = async () => {
    if (!title.trim()) {
      showToast("Please enter a note title", "error");
      return;
    }

    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    await saveNote(title, content);
    showToast("Note saved successfully!", "success");
  };

  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <span className="flex items-center gap-2 text-sm text-gray-500">
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
            Saving...
          </span>
        );
      case "saved":
        return (
          <span className="flex items-center gap-2 text-sm text-green-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        );
      case "error":
        return (
          <span className="flex items-center gap-2 text-sm text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Save failed
          </span>
        );
      default:
        return null;
    }
  };

  const actionButtons = [
    {
      id: "summary",
      label: "Summarize",
      description: "Get concise summaries of key concepts and main ideas",
      route: `/subjects/${id}/notes/${noteId}/summary`,
    },
    {
      id: "quiz",
      label: "Quiz Me",
      description: "Answer multiple-choice questions based on your notes",
      route: `/subjects/${id}/notes/${noteId}/quiz`,
    },
    {
      id: "flashcard",
      label: "Flashcards",
      description: "Review Q&A cards for quick memorization and recall",
      route: `/subjects/${id}/notes/${noteId}/flashcard`,
    },
  ];

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
        </div>
      </div>
    );
  }

  if (!note) {
    return notFound();
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition group"
        >
          <FiArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="font-medium">Back to Notes</span>
        </button>

        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {title || "Untitled Note"}
          </h1>
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={handleManualSave}
              disabled={saveStatus === "saving"}
              className="bg-orange-400 hover:bg-orange-500 text-white font-medium py-2.5 px-6 rounded-lg transition-all active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                boxShadow: saveStatus === "saving"
                  ? "none"
                  : "0 4px 0 0 rgba(251, 146, 60, 0.3)",
              }}
            >
              {saveStatus === "saving" && (
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
              Save Now
            </button>
            {getSaveStatusDisplay()}
          </div>
        </div>

        {/* Action Buttons - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {actionButtons.map((action) => (
            <div key={action.id} className="flex flex-col">
              <button
                onClick={() => router.push(action.route)}
                className="w-full h-12 sm:h-10 rounded-lg transition-all font-medium text-sm text-center flex items-center justify-center gap-2 bg-[#615FFF] text-white hover:bg-[#524CE5] active:translate-y-0.5 active:shadow-none"
                style={{
                  boxShadow: "0 4px 0 0 rgba(97, 95, 255, 0.3)",
                }}
              >
                {action.label}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center px-2">
                {action.description}
              </p>
            </div>
          ))}
        </div>

        {/* Google Docs style container */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden transition-colors">
          {/* Editable Title */}
          <div className="border-b border-gray-200 px-8 pt-8 pb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-4xl font-extrabold font-fredoka text-gray-900 focus:outline-none bg-transparent border-none"
              placeholder="Untitled document"
            />
          </div>

          {/* Rich Text Editor */}
          <RichTextEditor
            content={content}
            onChange={setContent}
            editable={true}
          />
        </div>
      </div>
    </div>
  );
}

export default NotePage;
