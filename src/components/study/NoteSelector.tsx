"use client";
import { useState, useMemo } from "react";
import { LuArrowLeft, LuCheck, LuTriangleAlert, LuCircleAlert } from "react-icons/lu";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/EmptyState";
import { TOOL_META, type StudyTool } from "./ToolSetupFrame";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  rawContent: string;
  knowledgeBase?: string | null;
}

interface NoteSelectorProps {
  tool: StudyTool;
  subjectName: string;
  notes: Note[];
  onNotesSelected: (noteIds: string[]) => void;
  onBack: () => void;
}

// Content size thresholds (in characters)
const WARNING_THRESHOLD = 20000; // ~5,000 tokens
const ERROR_THRESHOLD = 40000; // ~10,000 tokens

const formatSize = (size: number) =>
  size < 1000 ? `${size} chars` : `${(size / 1000).toFixed(1)}K chars`;

const noun: Record<StudyTool, string> = {
  quiz: "your quiz",
  flashcard: "your flashcards",
  summary: "your summary",
};

/** Step one of the subject-level flows: pick which notes feed the generator. */
export default function NoteSelector({
  tool,
  subjectName,
  notes,
  onNotesSelected,
  onBack,
}: NoteSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const meta = TOOL_META[tool];
  const Icon = meta.icon;

  const totalSize = useMemo(() => {
    let total = 0;
    selected.forEach((id) => {
      const note = notes.find((n) => n.id === id);
      if (note) total += (note.knowledgeBase || note.rawContent).length;
    });
    return total;
  }, [selected, notes]);

  const level =
    totalSize > ERROR_THRESHOLD ? "error" : totalSize > WARNING_THRESHOLD ? "warning" : null;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = notes.length > 0 && selected.size === notes.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(notes.map((n) => n.id)));

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={onBack}
        className="group -ml-2 mb-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-[15px] font-bold text-gray-600 hover:text-ink"
      >
        <LuArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
        Back to subject
      </button>

      <header className="flex items-start gap-4">
        <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl", meta.tone)}>
          <Icon className="h-7 w-7" aria-hidden />
        </span>
        <div>
          <h1 className="text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-4xl">
            Select notes
          </h1>
          <p className="mt-1.5 text-base font-semibold leading-snug text-gray-600 sm:text-lg">
            Choose notes from <span className="font-extrabold text-ink">{subjectName}</span> to
            include in {noun[tool]}.
          </p>
        </div>
      </header>

      <section className="card mt-6 rounded-[28px] p-5 sm:p-7" aria-label="Notes">
        {notes.length === 0 ? (
          <EmptyState
            variant="plain"
            mascot="read"
            title="No notes available"
            message="Create some notes first, then come back to build study tools from them."
          />
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-line pb-3">
              <p className="text-[15px] font-bold text-gray-600" aria-live="polite">
                {selected.size} of {notes.length} selected
              </p>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {allSelected ? "Deselect all" : "Select all"}
              </Button>
            </div>

            <ul className="max-h-[52vh] space-y-2.5 overflow-y-auto overscroll-contain pr-0.5">
              {notes.map((note) => {
                const isSel = selected.has(note.id);
                const length = (note.knowledgeBase || note.rawContent).length;
                return (
                  <li key={note.id}>
                    <label
                      className={cn(
                        "flex min-h-[68px] cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-3.5 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-500/55",
                        isSel
                          ? "border-orange-400 bg-orange-50"
                          : "border-line bg-white hover:border-[#f3cfa0]",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggle(note.id)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className={cn(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 transition-colors",
                          isSel
                            ? "border-orange-500 bg-orange-500 text-ink"
                            : "border-gray-300 bg-white text-transparent",
                        )}
                      >
                        <LuCheck className="h-4 w-4" strokeWidth={3.5} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-ink">{note.title}</span>
                        <span className="block text-sm font-semibold text-gray-600">
                          {formatSize(length)}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            {selected.size > 0 && level && (
              <div
                role="status"
                className={cn(
                  "mt-5 flex items-start gap-3 rounded-2xl border-2 p-4",
                  level === "error" ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50",
                )}
              >
                {level === "error" ? (
                  <LuCircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
                ) : (
                  <LuTriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" aria-hidden />
                )}
                <div className="text-sm font-semibold text-gray-700">
                  <p className={cn("font-display text-base font-semibold", level === "error" ? "text-red-700" : "text-yellow-700")}>
                    {level === "error" ? "Content size too large" : "Large content size"}
                  </p>
                  <p className="mt-0.5">
                    {level === "error"
                      ? "Generation may take longer or fail. Consider selecting fewer notes."
                      : "Generation may take a bit longer."}
                  </p>
                  <p className="mt-1 text-gray-600">
                    Total {formatSize(totalSize)} (recommended under {formatSize(WARNING_THRESHOLD)})
                  </p>
                </div>
              </div>
            )}

            {selected.size > 0 && !level && (
              <p className="mt-5 rounded-2xl bg-sand px-4 py-3 text-sm font-bold text-gray-700">
                Total content size: {formatSize(totalSize)}
              </p>
            )}

            <Button
              className="mt-5"
              size="lg"
              fullWidth
              disabled={selected.size === 0}
              onClick={() => selected.size > 0 && onNotesSelected(Array.from(selected))}
            >
              Continue with {selected.size} note{selected.size !== 1 ? "s" : ""}
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
