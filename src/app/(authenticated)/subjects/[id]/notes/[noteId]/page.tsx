"use client";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { use, useState, useEffect, useRef, useCallback } from "react";
import {
  LuArrowLeft,
  LuBookOpen,
  LuCheck,
  LuCircleAlert,
  LuLayers,
  LuListChecks,
  LuLightbulb,
} from "react-icons/lu";
import RichTextEditor from "@/components/ui/RichTextEditor";
import EditorToolbar from "@/components/ui/EditorToolbar";
import BubbleToolbar from "@/components/ui/BubbleToolbar";
import Button, { Spinner } from "@/components/ui/button";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
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

  // Scroll detection for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const saveNote = useCallback(
    async (titleToSave: string, contentToSave: string) => {
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
    },
    [noteId, showToast],
  );

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

  const saveStatusDisplay = (
    <span role="status" aria-live="polite" className="min-h-6 text-sm font-bold">
      {saveStatus === "saving" && (
        <span className="flex items-center gap-2 text-gray-600">
          <Spinner className="h-4 w-4" />
          Saving...
        </span>
      )}
      {saveStatus === "saved" && (
        <span className="flex items-center gap-1.5 text-green-700">
          <LuCheck className="h-4 w-4" strokeWidth={3} aria-hidden />
          Saved
        </span>
      )}
      {saveStatus === "error" && (
        <span className="flex items-center gap-1.5 text-red-700">
          <LuCircleAlert className="h-4 w-4" aria-hidden />
          Save failed
        </span>
      )}
    </span>
  );

  const actionButtons = [
    {
      id: "quiz",
      label: "Quiz me",
      route: `/subjects/${id}/notes/${noteId}/quiz`,
      icon: LuListChecks,
      tone: "bg-orange-100 text-orange-700",
    },
    {
      id: "flashcard",
      label: "Flashcards",
      route: `/subjects/${id}/notes/${noteId}/flashcard`,
      icon: LuLayers,
      tone: "bg-indigo-100 text-indigo-700",
    },
    {
      id: "summary",
      label: "Summarize",
      route: `/subjects/${id}/notes/${noteId}/summary`,
      icon: LuBookOpen,
      tone: "bg-green-100 text-green-700",
    },
  ];

  if (isLoading) {
    return (
      <div aria-busy="true" className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-[420px] w-full rounded-[24px]" />
      </div>
    );
  }

  if (!note) {
    return notFound();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/subjects/${id}`}
        className="group -ml-2 mb-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-[15px] font-bold text-gray-600 hover:text-ink"
      >
        <LuArrowLeft
          className="h-5 w-5 transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        />
        Back to subject
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="min-w-0 break-words text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-4xl">
          {title || "Untitled Note"}
        </h1>
        <div className="flex shrink-0 items-center gap-4">
          {saveStatusDisplay}
          <Button
            size="sm"
            onClick={handleManualSave}
            disabled={saveStatus === "saving"}
          >
            Save now
          </Button>
        </div>
      </header>

      {/* Study tools */}
      <ul className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-4">
        {actionButtons.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.id}>
              <button
                type="button"
                onClick={() => router.push(action.route)}
                className="card card-interactive flex min-h-[84px] w-full flex-col items-center justify-center gap-2 rounded-[20px] px-2 py-3 text-center sm:min-h-[72px] sm:flex-row sm:gap-3 sm:px-5"
              >
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    action.tone,
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-display text-[15px] font-semibold leading-tight text-ink sm:text-lg">
                  {action.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Editor */}
      <div className="card mt-6 rounded-[24px] shadow-[0_4px_0_#efe0cc]">
        {/* Sticky title: slides under the app header */}
        <div
          className={cn(
            "sticky top-[calc(var(--mobile-header-h)+env(safe-area-inset-top,0px))] z-30 rounded-t-[24px] border-b border-line bg-white transition-shadow duration-300 lg:top-[var(--topbar-h)]",
            isScrolled ? "shadow-md" : "shadow-none",
          )}
        >
          <div
            className={cn(
              "px-5 transition-all duration-300 sm:px-8",
              isScrolled ? "pb-2 pt-2" : "pb-4 pt-6 sm:pt-8",
            )}
          >
            <label htmlFor="note-title" className="sr-only">
              Note title
            </label>
            <input
              id="note-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(
                "w-full border-none bg-transparent font-display font-semibold text-ink placeholder:text-gray-500 focus:outline-none",
                isScrolled ? "text-lg" : "text-2xl sm:text-4xl",
              )}
              placeholder="Untitled document"
            />
          </div>
        </div>

        {/* Hidden main toolbar - keeping for reference but not displayed */}
        <div className="hidden">
          <EditorToolbar editor={editor} />
        </div>

        <div className="flex items-start gap-2.5 border-b border-[#fad9a8] bg-orange-50 px-5 py-3 text-sm font-semibold text-gray-700 sm:px-8">
          <LuLightbulb className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" aria-hidden />
          <p>
            <span className="font-extrabold">Tip:</span> select any text to see
            formatting options.
          </p>
        </div>

        {/* Editor Content Area */}
        <RichTextEditor
          content={content}
          onChange={setContent}
          editable={true}
          onEditorReady={setEditor}
        />

        {/* Bubble Toolbar - Appears on text selection with all features */}
        <BubbleToolbar editor={editor} />
      </div>
    </div>
  );
}

export default NotePage;
