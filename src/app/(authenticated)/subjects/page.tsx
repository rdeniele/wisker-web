"use client";
import { useState, useTransition, useEffect } from "react";
import { LuPlus } from "react-icons/lu";
import CreateSubject from "./components/CreateSubject";
import UpdateSubject from "./components/UpdateSubject";
import SubjectCard from "./components/SubjectCard";
import { BottomAd } from "@/components/ui/AdSenseAd";
import Button from "@/components/ui/button";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import PageHeader from "@/components/ui/pageheader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { relativeTime } from "@/lib/format";

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

  // Transform subjects to match the format expected by SubjectCard
  const transformedSubjects = subjects.map((subject) => ({
    id: subject.id,
    name: subject.title,
    notes: subject._count?.notes || 0,
    time: relativeTime(subject.updatedAt),
    img: "/images/wisky-laptop.png",
  }));

  const count = transformedSubjects.length;

  return (
    <div>
      <PageHeader
        centered={false}
        title="Your subjects"
        subtitle={
          isLoading
            ? "Loading your study spaces..."
            : count === 0
              ? "Create a subject to start organising your notes."
              : `${count} ${count === 1 ? "subject" : "subjects"} to explore`
        }
        actions={
          <Button className="hidden sm:inline-flex" onClick={() => setShowModal(true)}>
            <LuPlus className="h-5 w-5" aria-hidden />
            New subject
          </Button>
        }
      />

      <div className="mt-6 sm:mt-8">
        {/* Error Display */}
        {error && (
          <Alert
            tone="error"
            className="mb-6"
            action={
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="danger" onClick={fetchSubjects}>
                  Try again
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => (window.location.href = "/api/auth/login")}
                >
                  Re-authenticate
                </Button>
              </div>
            }
          >
            {error}
          </Alert>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[236px] rounded-[26px]" />
            ))}
          </div>
        ) : count === 0 && !error ? (
          <EmptyState
            mascot="hi"
            title="No subjects yet"
            message="A subject is a folder for one course. Add notes to it and Wisker builds quizzes, flashcards and summaries."
            action={
              <Button size="lg" onClick={() => setShowModal(true)}>
                <LuPlus className="h-5 w-5" aria-hidden />
                Create your first subject
              </Button>
            }
          />
        ) : (
          <div>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
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

            {/* Ad placement - after subjects grid */}
            <div className="mt-12 border-t border-line pt-8">
              <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                Sponsored
              </p>
              <BottomAd />
            </div>
          </div>
        )}
      </div>

      {/* Phone: floating add button, parked above the bottom navigation */}
      <button
        type="button"
        className="btn btn-primary fixed bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom,0px)+16px)] right-4 z-30 h-14 w-14 rounded-full p-0 sm:hidden"
        onClick={() => setShowModal(true)}
        aria-label="New subject"
      >
        <LuPlus className="h-7 w-7" aria-hidden />
      </button>

      {showModal && (
        <CreateSubject
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchSubjects(); // Refresh the subjects list
          }}
        />
      )}

      {showUpdateModal && selectedSubjectId && (
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
      )}

      <ConfirmDialog
        open={!!deleteConfirmId}
        title="Delete this subject?"
        description="This can't be undone. All notes and study tools inside it will be deleted too."
        confirmLabel="Delete subject"
        busy={isDeleting}
        onClose={() => !isDeleting && setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDeleteSubject(deleteConfirmId)}
      />
    </div>
  );
}

export default SubjectsPage;
