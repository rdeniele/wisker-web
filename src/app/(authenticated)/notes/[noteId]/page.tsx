"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Note {
  id: string;
  title: string;
  rawContent: string;
  subjectId: string | null;
  subject?: {
    id: string;
    title: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Subject {
  id: string;
  title: string;
}

export default function NotePage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params?.noteId as string;

  const [note, setNote] = useState<Note | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch note
        const noteResponse = await fetch(`/api/notes/${noteId}`, {
          credentials: "include",
        });

        if (!noteResponse.ok) {
          throw new Error("Failed to fetch note");
        }

        const noteResult = await noteResponse.json();
        setNote(noteResult.data);

        // If note doesn't have a subject, fetch subjects for assignment
        if (!noteResult.data.subjectId) {
          const subjectsResponse = await fetch("/api/subjects", {
            credentials: "include",
          });

          if (subjectsResponse.ok) {
            const subjectsResult = await subjectsResponse.json();
            setSubjects(subjectsResult.data.subjects || []);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load note");
      } finally {
        setIsLoading(false);
      }
    };

    if (noteId) {
      fetchData();
    }
  }, [noteId]);

  const handleAssignSubject = async (subjectId: string) => {
    try {
      setIsAssigning(true);

      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subjectId }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign subject");
      }

      
      // Redirect to the note in its subject
      router.push(`/subjects/${subjectId}/notes/${noteId}`);
    } catch (error) {
      console.error("Error assigning subject:", error);
      alert("Failed to assign subject");
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-500">Loading note...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <p className="text-red-600 text-lg mb-4">{error || "Note not found"}</p>
            <button
              onClick={() => router.push("/notes")}
              className="text-purple-600 hover:text-purple-700 underline"
            >
              Back to Notes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <button
          onClick={() => router.push("/notes")}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Back to Notes
        </button>

        {/* Note Card */}
        <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {note.title}
          </h1>

          {/* Subject Assignment Banner (if untagged) */}
          {!note.subject && (
            <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">
                    📥 Untagged Note
                  </h3>
                  <p className="text-sm text-orange-700">
                    This note isn&apos;t organized in a subject yet. Add it to a subject for better organization.
                  </p>
                </div>
                <button
                  onClick={() => setShowSubjectPicker(!showSubjectPicker)}
                  className="ml-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors whitespace-nowrap"
                >
                  Add to Subject
                </button>
              </div>

              {/* Subject Picker */}
              {showSubjectPicker && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-orange-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Choose a subject:</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {subjects.map((subject) => (
                      <button
                        key={subject.id}
                        onClick={() => handleAssignSubject(subject.id)}
                        disabled={isAssigning}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-orange-50 transition-colors border border-gray-200 hover:border-orange-300 disabled:opacity-50"
                      >
                        📘 {subject.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subject Badge (if tagged) */}
          {note.subject && (
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl font-medium">
                📘 {note.subject.title}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {note.rawContent}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <span>
              Created: {new Date(note.createdAt).toLocaleDateString()}
            </span>
            <span>
              Updated: {new Date(note.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
