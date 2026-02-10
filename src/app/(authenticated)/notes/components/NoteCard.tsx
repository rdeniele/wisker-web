"use client";
import { useState } from "react";
import type { Note, Subject } from "@/types/note";

interface NoteCardProps {
  note: Note;
  subjects: Subject[];
  onNoteClick: (note: Note) => void;
  onSubjectAssigned: () => void;
  getRelativeTime: (date: string) => string;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  subjects,
  onNoteClick,
  onSubjectAssigned,
  getRelativeTime,
}) => {
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [newSubjectTitle, setNewSubjectTitle] = useState("");

  const handleAssignSubject = async (subjectId: string) => {
    try {
      setIsAssigning(true);

      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subjectId }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign subject");
      }

      setShowSubjectPicker(false);
      onSubjectAssigned();
    } catch (error) {
      console.error("Error assigning subject:", error);
      alert("Failed to assign subject");
    } finally {
      setIsAssigning(false);
    }
  };

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
      await handleAssignSubject(newSubject.id);
      setNewSubjectTitle("");
      setShowCreateSubject(false);
    } catch (error) {
      console.error("Error creating subject:", error);
      alert("Failed to create subject");
    }
  };

  // Truncate content for preview
  const contentPreview =
    note.rawContent.length > 150
      ? note.rawContent.substring(0, 150) + "..."
      : note.rawContent;

  return (
    <div className="relative group">
      <div
        className={`bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all cursor-pointer border-2 ${
          note.subjectId ? "border-transparent" : "border-orange-200 bg-orange-50/30"
        }`}
        onClick={() => !showSubjectPicker && onNoteClick(note)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex-1 line-clamp-2">
            {note.title}
          </h3>
        </div>

        {/* Content Preview */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {contentPreview}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Subject Tag */}
          {note.subject ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-xs font-medium">
              📘 {note.subject.title}
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSubjectPicker(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-xl text-xs font-medium transition-colors"
            >
              📝 Add to subject
            </button>
          )}

          {/* Time */}
          <span className="text-xs text-gray-500">
            {getRelativeTime(note.updatedAt)}
          </span>
        </div>
      </div>

      {/* Subject Picker Dropdown */}
      {showSubjectPicker && (
        <div
          className="absolute inset-0 bg-white rounded-2xl shadow-xl border-2 border-purple-500 p-4 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Add to subject</h4>
            <button
              onClick={() => setShowSubjectPicker(false)}
              className="text-gray-400 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {!showCreateSubject ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => handleAssignSubject(subject.id)}
                  disabled={isAssigning}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-50 transition-colors text-sm disabled:opacity-50"
                >
                  📘 {subject.title}
                </button>
              ))}
              <button
                onClick={() => setShowCreateSubject(true)}
                className="w-full text-left px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium transition-colors text-sm"
              >
                + Create new subject
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={newSubjectTitle}
                onChange={(e) => setNewSubjectTitle(e.target.value)}
                placeholder="Subject name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateSubject();
                  } else if (e.key === "Escape") {
                    setShowCreateSubject(false);
                    setNewSubjectTitle("");
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateSubject}
                  disabled={!newSubjectTitle.trim() || isAssigning}
                  className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-50"
                >
                  Create & Assign
                </button>
                <button
                  onClick={() => {
                    setShowCreateSubject(false);
                    setNewSubjectTitle("");
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NoteCard;
