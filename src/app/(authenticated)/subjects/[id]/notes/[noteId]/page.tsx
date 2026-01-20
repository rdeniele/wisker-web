"use client";
import { notFound, useRouter } from "next/navigation";
import { use, useState, useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useToast } from "@/contexts/ToastContext";

interface NotePageProps {
  params: Promise<{ id: string; noteId: string }>;
}

function NotePage({ params }: NotePageProps) {
  const { id, noteId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [note, setNote] = useState<any>(null);

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
      }
    };

    fetchNote();
  }, [noteId, showToast]);

  const handleSave = async () => {
    if (!title.trim()) {
      showToast("Please enter a note title", "error");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          rawContent: content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to update note");
      }

      showToast("Note saved successfully!", "success");
    } catch (error) {
      console.error("Error saving note:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to save note",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

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
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group"
              >
                <FiArrowLeft
                  size={20}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                <span className="font-medium">Back</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-orange-400 text-white rounded-[5px] hover:bg-orange-500 transition font-medium text-sm text-center shadow-[0_3px_0_#FFA726] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => router.push(`/subjects/${id}/notes/${noteId}/summary`)}
                  className="px-4 py-2 bg-[#615FFF] text-white rounded-[5px] hover:bg-[#524CE5] transition font-medium text-sm text-center shadow-[0_3px_0_#615FFF]"
                >
                  Summarize
                </button>
                <button
                  onClick={() => router.push(`/subjects/${id}/notes/${noteId}/quiz`)}
                  className="px-4 py-2 bg-[#615FFF] text-white rounded-[5px] hover:bg-[#524CE5] transition font-medium text-sm text-center shadow-[0_3px_0_#615FFF]"
                >
                  Quiz Me
                </button>
                <button
                  onClick={() => router.push(`/subjects/${id}/notes/${noteId}/flashcard`)}
                  className="px-4 py-2 bg-[#615FFF] text-white rounded-[5px] hover:bg-[#524CE5] transition font-medium text-sm text-center shadow-[0_3px_0_#615FFF]"
                >
                  Flashcards
                </button>
              </div>
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
