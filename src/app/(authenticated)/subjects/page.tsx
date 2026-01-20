"use client";
import { useState, useTransition, useEffect } from "react";
import { IoBookSharp } from "react-icons/io5";
import CreateSubject from "./components/CreateSubject";
import UpdateSubject from "./components/UpdateSubject";
import SubjectCard from "./components/SubjectCard";

interface Subject {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    notes: number;
    learningTools: number;
  };
}

function SubjectsPage() {
  const [, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null,
  );
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync user to database on mount
  useEffect(() => {
    const syncUser = async () => {
      try {
        await fetch("/api/user/sync", { method: "POST" });
      } catch {
        // Silently fail - user sync will be retried on next page load
      }
    };

    syncUser().then(() => fetchSubjects());
  }, []);

  // Fetch subjects from API
  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/subjects", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error occurred. Please try again later.");
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to fetch subjects");
      }

      setSubjects(result.data.subjects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subjects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigationStart = (id: string) => {
    setNavigatingTo(id);
    startTransition(() => {
      // Navigation will be handled by SubjectCard/SubjectActionButtons
      setNavigatingTo(null); // Reset after transition
    });
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/subjects/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to delete subject");
      }

      // Remove the subject from the local state
      setSubjects((prev) => prev.filter((subject) => subject.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete subject");
    } finally {
      setIsDeleting(false);
    }
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

  // Transform subjects to match the format expected by SubjectCard
  const transformedSubjects = subjects.map((subject) => ({
    id: subject.id,
    name: subject.title,
    notes: subject._count?.notes || 0,
    time: getRelativeTime(subject.updatedAt),
    img: "/images/wisky-read.png",
  }));

  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Minimalistic Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            My Subjects
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {transformedSubjects.length}{" "}
            {transformedSubjects.length === 1 ? "subject" : "subjects"} to
            explore
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-600 font-semibold mb-2">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={fetchSubjects}
                className="text-red-700 underline hover:no-underline text-sm"
              >
                Try again
              </button>
              <button
                onClick={() => (window.location.href = "/api/auth/login")}
                className="text-red-700 underline hover:no-underline text-sm"
              >
                Re-authenticate
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-500">Loading subjects...</p>
          </div>
        ) : transformedSubjects.length === 0 ? (
          <div className="text-center py-20">
            <IoBookSharp className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-6">No subjects yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-2xl font-medium transition-colors"
            >
              Create your first subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {transformedSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                navigatingTo={navigatingTo}
                onNavigationStart={handleNavigationStart}
                onEdit={(id) => {
                  setSelectedSubjectId(id);
                  setShowUpdateModal(true);
                }}
                onDelete={(id) => {
                  setDeleteConfirmId(id);
                }}
              />
            ))}
          </div>
        )}

        {/* Minimalistic Floating Add Button */}
        <button
          className="fixed bottom-8 right-8 w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-full flex items-center justify-center text-2xl sm:text-3xl z-50 transition-all hover:scale-110 active:scale-95"
          onClick={() => setShowModal(true)}
          aria-label="Add Subject"
          style={{ boxShadow: "0 8px 0 0 rgba(139, 92, 246, 0.18)" }}
        >
          +
        </button>
      </div>

      {/* Modal Overlay - Cleaner backdrop */}
      {showModal && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <CreateSubject
              onClose={() => setShowModal(false)}
              onSuccess={() => {
                fetchSubjects(); // Refresh the subjects list
              }}
            />
          </div>
        </div>
      )}

      {/* Update Subject Modal Overlay */}
      {showUpdateModal && selectedSubjectId && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => {
            setShowUpdateModal(false);
            setSelectedSubjectId(null);
          }}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <UpdateSubject
              subjectId={selectedSubjectId}
              onClose={() => {
                setShowUpdateModal(false);
                setSelectedSubjectId(null);
              }}
              onSuccess={() => {
                fetchSubjects(); // Refresh the subjects list
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => !isDeleting && setDeleteConfirmId(null)}
        >
          <div
            className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "0 8px 0 #ececec" }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Delete Subject?
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this subject? This action cannot
              be undone and will delete all associated notes and learning tools.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="px-6 py-2.5 rounded-2xl font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSubject(deleteConfirmId)}
                disabled={isDeleting}
                className="px-6 py-2.5 rounded-2xl font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubjectsPage;
