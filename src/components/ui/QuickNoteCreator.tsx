"use client";
import React, { useState, useEffect } from "react";

interface Subject {
  id: string;
  title: string;
}

interface QuickNoteCreatorProps {
  onClose: () => void;
  onSuccess?: (noteId: string) => void;
  defaultSubjectId?: string | null;
}

/**
 * Quick Note Creator - Fast note creation with optional subject tagging
 * Features:
 * - Can create notes without subject (untagged/inbox)
 * - Inline subject selection with dropdown
 * - Option to create new subject on the fly
 */
const QuickNoteCreator: React.FC<QuickNoteCreatorProps> = ({
  onClose,
  onSuccess,
  defaultSubjectId = null,
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    defaultSubjectId,
  );
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [newSubjectTitle, setNewSubjectTitle] = useState("");

  // Load subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setIsLoadingSubjects(true);
        const response = await fetch("/api/subjects", {
          credentials: "include",
        });
        const result = await response.json();

        if (response.ok) {
          setSubjects(result.data.subjects || []);
        }
      } catch (err) {
        console.error("Failed to load subjects:", err);
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleCreateSubject = async () => {
    if (!newSubjectTitle.trim()) return;

    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: newSubjectTitle }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to create subject");
      }

      const newSubject = result.data.subject;
      setSubjects((prev) => [...prev, newSubject]);
      setSelectedSubjectId(newSubject.id);
      setNewSubjectTitle("");
      setShowCreateSubject(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create subject");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          rawContent: content.trim(),
          subjectId: selectedSubjectId || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to create note");
      }

      if (onSuccess) {
        onSuccess(result.data.note.id);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-lg p-6 sm:p-8 relative">
      {/* Close Button */}
      <button
        className="absolute right-6 top-6 text-2xl text-gray-400 hover:text-gray-700 focus:outline-none"
        aria-label="Close"
        type="button"
        onClick={onClose}
      >
        &#10005;
      </button>

      {/* Header */}
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Quick Note</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title Input */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter note title..."
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            autoFocus
            disabled={isLoading}
          />
        </div>

        {/* Subject Selection */}
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Subject (optional)
          </label>
          {!showCreateSubject ? (
            <div className="flex gap-2">
              <select
                id="subject"
                value={selectedSubjectId || ""}
                onChange={(e) =>
                  setSelectedSubjectId(e.target.value || null)
                }
                className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isLoading || isLoadingSubjects}
              >
                <option value="">📝 No subject (Inbox)</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    📘 {subject.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCreateSubject(true)}
                className="px-4 py-3 bg-purple-50 text-purple-600 rounded-2xl hover:bg-purple-100 transition-colors font-medium whitespace-nowrap"
                disabled={isLoading}
              >
                + New
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubjectTitle}
                onChange={(e) => setNewSubjectTitle(e.target.value)}
                placeholder="Subject name..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateSubject();
                  } else if (e.key === "Escape") {
                    setShowCreateSubject(false);
                    setNewSubjectTitle("");
                  }
                }}
              />
              <button
                type="button"
                onClick={handleCreateSubject}
                className="px-4 py-3 bg-purple-500 text-white rounded-2xl hover:bg-purple-600 transition-colors font-medium"
                disabled={!newSubjectTitle.trim()}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateSubject(false);
                  setNewSubjectTitle("");
                }}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Content Textarea */}
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note content..."
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-3 rounded-2xl font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !title.trim() || !content.trim()}
            className="px-6 py-3 rounded-2xl font-medium bg-purple-500 hover:bg-purple-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              "Create Note"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuickNoteCreator;
