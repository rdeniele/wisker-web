"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NoteCard from "./components/NoteCard";
import QuickNoteCreator from "@/components/ui/QuickNoteCreator";
import type { Note, Subject } from "@/types/note";

function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuickNote, setShowQuickNote] = useState(false);
  
  // Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showUntaggedOnly, setShowUntaggedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "title">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch subjects and notes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch subjects for filter
        const subjectsResponse = await fetch("/api/subjects", {
          credentials: "include",
        });
        
        if (subjectsResponse.ok) {
          const subjectsResult = await subjectsResponse.json();
          setSubjects(subjectsResult.data.subjects || []);
        }

        // Fetch notes
        const params = new URLSearchParams();
        if (selectedSubjectId) params.append("subjectId", selectedSubjectId);
        if (showUntaggedOnly) params.append("untaggedOnly", "true");
        if (searchQuery) params.append("search", searchQuery);
        params.append("sortBy", sortBy);
        params.append("sortOrder", sortOrder);

        const notesResponse = await fetch(`/api/notes?${params.toString()}`, {
          credentials: "include",
        });

        const notesResult = await notesResponse.json();

        if (!notesResponse.ok) {
          throw new Error(notesResult.error?.message || "Failed to fetch notes");
        }

        setNotes(notesResult.data.notes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedSubjectId, showUntaggedOnly, searchQuery, sortBy, sortOrder]);

  // Count untagged notes
  const untaggedCount = notes.filter((note) => !note.subjectId).length;

  const handleFilterChange = (subjectId: string | null, untaggedOnly: boolean = false) => {
    setSelectedSubjectId(subjectId);
    setShowUntaggedOnly(untaggedOnly);
  };

  const handleNoteClick = (note: Note) => {
    if (note.subjectId) {
      router.push(`/subjects/${note.subjectId}/notes/${note.id}`);
    } else {
      // For untagged notes, we might need a different route or assign subject first
      router.push(`/notes/${note.id}`);
    }
  };

  const handleSubjectAssigned = () => {
    // Refresh notes after subject assignment
    setSelectedSubjectId(null);
    setShowUntaggedOnly(false);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${diffWeeks}w ago`;
  };

  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            All Notes
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
            {untaggedCount > 0 && (
              <span className="ml-2 text-orange-600">
                · {untaggedCount} untagged
              </span>
            )}
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowQuickNote(true)}
              className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-medium transition-colors whitespace-nowrap"
            >
              + New Note
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Subject Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <button
                onClick={() => handleFilterChange(null, false)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  !selectedSubjectId && !showUntaggedOnly
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Notes
              </button>
              <button
                onClick={() => handleFilterChange(null, true)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  showUntaggedOnly
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                📥 Inbox ({untaggedCount})
              </button>
              {subjects.slice(0, 5).map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => handleFilterChange(subject.id, false)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    selectedSubjectId === subject.id
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  📘 {subject.title}
                </button>
              ))}
              {subjects.length > 5 && (
                <select
                  value={selectedSubjectId || ""}
                  onChange={(e) => handleFilterChange(e.target.value || null, false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">More subjects...</option>
                  {subjects.slice(5).map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Sort Options */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "createdAt" | "updatedAt" | "title")}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="updatedAt">Last Updated</option>
                <option value="createdAt">Date Created</option>
                <option value="title">Title</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-500">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500 text-lg mb-6">
              {searchQuery
                ? "No notes found"
                : showUntaggedOnly
                  ? "No untagged notes"
                  : selectedSubjectId
                    ? "No notes in this subject"
                    : "No notes yet"}
            </p>
            <button
              onClick={() => setShowQuickNote(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-2xl font-medium transition-colors"
            >
              Create your first note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                subjects={subjects}
                onNoteClick={handleNoteClick}
                onSubjectAssigned={handleSubjectAssigned}
                getRelativeTime={getRelativeTime}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Note Modal */}
      {showQuickNote && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => setShowQuickNote(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <QuickNoteCreator
              onClose={() => setShowQuickNote(false)}
              onSuccess={() => {
                setShowQuickNote(false);
                // Refresh will happen automatically via useEffect
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default NotesPage;
