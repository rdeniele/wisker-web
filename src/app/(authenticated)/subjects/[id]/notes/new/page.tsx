"use client";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import RichTextEditor from "@/components/ui/RichTextEditor";
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
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

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
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-orange-400 text-white rounded-[5px] hover:bg-orange-500 transition font-medium text-sm text-center shadow-[0_3px_0_#FFA726] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
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
export default NewNotePage;
