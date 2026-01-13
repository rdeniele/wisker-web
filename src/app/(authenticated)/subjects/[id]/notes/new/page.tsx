"use client";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import RichTextEditor from "@/components/ui/RichTextEditor";

type NotePageProps = {
  params: Promise<{ id: string }>;
};


function NewNotePage({ params }: NotePageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSave = () => {
    // TODO: Replace with actual save logic (API call, etc.)
    console.log("Saving new note", { subjectId: id, title, content });
    // After save, redirect to the new note page or notes list
    // router.push(`/subjects/${id}/notes/[newNoteId]`);
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
                className="px-4 py-2 bg-orange-400 text-white rounded-[5px] hover:bg-orange-500 transition font-medium text-sm text-center shadow-[0_3px_0_#FFA726]"
              >
                Save
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
