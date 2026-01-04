"use client";
import { notFound, useRouter } from "next/navigation";
import { noteContent } from "@/lib/data/subjects";
import { use, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import RichTextEditor from "@/components/ui/RichTextEditor";

interface NotePageProps {
  params: Promise<{ id: string; noteId: string }>;
}

function NotePage({ params }: NotePageProps) {
  const { id, noteId } = use(params);
  const router = useRouter();

  const noteKey = `${id}-${noteId}`;
  const note = noteContent[noteKey];

  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");

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
                  onClick={() => console.log("Summarize")}
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
                  onClick={() => console.log("Flashcards")}
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
