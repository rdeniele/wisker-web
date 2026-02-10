"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QuickNoteCreator from "@/components/ui/QuickNoteCreator";
import CreateSubject from "@/app/(authenticated)/subjects/components/CreateSubject";

interface Note {
  id: string;
  title: string;
  rawContent: string;
  subjectId: string | null;
  subject?: {
    id: string;
    title: string;
  } | null;
  updatedAt: string;
}

interface Subject {
  id: string;
  title: string;
  _count?: {
    notes: number;
  };
}

function DashboardPage() {
  const router = useRouter();
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [untaggedNotes, setUntaggedNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [showCreateSubject, setShowCreateSubject] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch recent notes (last 10)
        const notesResponse = await fetch(
          "/api/notes?pageSize=10&sortBy=updatedAt&sortOrder=desc",
          { credentials: "include" }
        );

        if (notesResponse.ok) {
          const notesResult = await notesResponse.json();
          const notes = notesResult.data.notes || [];
          setRecentNotes(notes);
          setUntaggedNotes(notes.filter((n: Note) => !n.subjectId));
        }

        // Fetch subjects
        const subjectsResponse = await fetch("/api/subjects", {
          credentials: "include",
        });

        if (subjectsResponse.ok) {
          const subjectsResult = await subjectsResponse.json();
          setSubjects(subjectsResult.data.subjects || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleNoteClick = (note: Note) => {
    if (note.subjectId) {
      router.push(`/subjects/${note.subjectId}/notes/${note.id}`);
    } else {
      router.push(`/notes/${note.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Here's what's happening with your notes
          </p>
        </div>

        {/* Organization Alert Banner */}
        {untaggedNotes.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-3xl p-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-2xl">
                📥
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-orange-900 mb-2">
                  {untaggedNotes.length} {untaggedNotes.length === 1 ? "note needs" : "notes need"} organizing
                </h3>
                <p className="text-orange-700 mb-4">
                  You have untagged notes in your inbox. Organize them into subjects for better structure.
                </p>
                <button
                  onClick={() => router.push("/notes?filter=inbox")}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-medium transition-colors"
                >
                  Review & Organize →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setShowQuickNote(true)}
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-150 rounded-2xl transition-all group border-2 border-transparent hover:border-purple-300"
            >
              <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📝
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-lg">Quick Note</h3>
                <p className="text-sm text-gray-600">
                  Capture your thoughts instantly
                </p>
              </div>
            </button>

            <button
              onClick={() => setShowCreateSubject(true)}
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 rounded-2xl transition-all group border-2 border-transparent hover:border-blue-300"
            >
              <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📘
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-lg">
                  New Subject
                </h3>
                <p className="text-sm text-gray-600">Organize your knowledge</p>
              </div>
            </button>

            <button
              onClick={() => router.push("/notes")}
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-150 rounded-2xl transition-all group border-2 border-transparent hover:border-green-300"
            >
              <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📚
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-lg">All Notes</h3>
                <p className="text-sm text-gray-600">
                  Browse and search notes
                </p>
              </div>
            </button>

            <button
              onClick={() => router.push("/subjects")}
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-150 rounded-2xl transition-all group border-2 border-transparent hover:border-pink-300"
            >
              <div className="w-14 h-14 bg-pink-500 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🎯
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-lg">Subjects</h3>
                <p className="text-sm text-gray-600">
                  Manage your subjects
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Notes */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Recent Notes</h2>
            <button
              onClick={() => router.push("/notes")}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              View all →
            </button>
          </div>

          {recentNotes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No notes yet</p>
              <button
                onClick={() => setShowQuickNote(true)}
                className="text-purple-600 hover:text-purple-700 font-medium underline"
              >
                Create your first note
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotes.slice(0, 5).map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleNoteClick(note)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all hover:shadow-md ${
                    note.subject
                      ? "bg-white border-gray-200 hover:border-purple-300"
                      : "bg-orange-50 border-orange-200 hover:border-orange-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">
                        {note.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {note.rawContent.substring(0, 120)}
                        {note.rawContent.length > 120 ? "..." : ""}
                      </p>
                      <div className="flex items-center gap-3">
                        {note.subject ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                            📘 {note.subject.title}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                            📥 Untagged
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {getRelativeTime(note.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Your Subjects */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Your Subjects</h2>
            <button
              onClick={() => router.push("/subjects")}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              View all →
            </button>
          </div>

          {subjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No subjects yet</p>
              <button
                onClick={() => setShowCreateSubject(true)}
                className="text-purple-600 hover:text-purple-700 font-medium underline"
              >
                Create your first subject
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.slice(0, 6).map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => router.push(`/subjects/${subject.id}`)}
                  className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-200 hover:border-purple-300 transition-all hover:shadow-md text-left group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl">📘</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {subject._count?.notes || 0}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors line-clamp-2">
                    {subject.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {subject._count?.notes || 0}{" "}
                    {subject._count?.notes === 1 ? "note" : "notes"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
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
                window.location.reload(); // Refresh dashboard
              }}
            />
          </div>
        </div>
      )}

      {/* Create Subject Modal */}
      {showCreateSubject && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => setShowCreateSubject(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <CreateSubject
              onClose={() => setShowCreateSubject(false)}
              onSuccess={() => {
                setShowCreateSubject(false);
                window.location.reload(); // Refresh dashboard
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
