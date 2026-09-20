"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use, useState } from "react";
import { LuArrowLeft } from "react-icons/lu";
import RichTextEditor from "@/components/ui/RichTextEditor";
import Button from "@/components/ui/button";
import { useToast } from "@/contexts/ToastContext";

type NotePageProps = {
  params: Promise<{ id: string }>;
};

function NewNotePage({ params }: NotePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      showToast("Please enter a note title", "error");
      return;
    }

    if (!content.trim()) {
      showToast("Please enter some content", "error");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/notes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId: id,
          title: title.trim(),
          rawContent: content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to create note");
      }

      showToast("Note created successfully!", "success");

      // Redirect to the newly created note or back to subject page
      router.push(`/subjects/${id}`);
    } catch (error) {
      console.error("Error creating note:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to create note",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href={`/subjects/${id}`}
          className="group -ml-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-[15px] font-bold text-gray-600 hover:text-ink"
        >
          <LuArrowLeft
            className="h-5 w-5 transition-transform group-hover:-translate-x-0.5"
            aria-hidden
          />
          Back
        </Link>
        <Button onClick={handleSave} isLoading={isSaving}>
          {isSaving ? "Saving..." : "Save note"}
        </Button>
      </div>

      <div className="card overflow-hidden rounded-[24px] shadow-[0_4px_0_#efe0cc]">
        {/* Editable Title */}
        <div className="border-b border-line px-5 pb-4 pt-6 sm:px-8 sm:pt-8">
          <label htmlFor="new-note-title" className="sr-only">
            Note title
          </label>
          <input
            id="new-note-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-none bg-transparent font-display text-2xl font-semibold text-ink placeholder:text-gray-500 focus:outline-none sm:text-4xl"
            placeholder="Untitled document"
          />
        </div>

        {/* Rich Text Editor */}
        <RichTextEditor content={content} onChange={setContent} editable={true} />
      </div>
    </div>
  );
}
export default NewNotePage;
