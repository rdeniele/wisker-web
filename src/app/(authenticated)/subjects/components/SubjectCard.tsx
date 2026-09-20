"use client";
import Link from "next/link";
import { LuPencil, LuTrash2, LuLayers, LuListChecks, LuBookOpen } from "react-icons/lu";
import ActionMenu from "@/components/ui/ActionMenu";
import Mascot from "@/components/ui/Mascot";

interface Subject {
  id: string;
  name: string;
  notes: number;
  time: string;
  img: string;
}

interface SubjectCardProps {
  subject: Subject;
  navigatingTo: string | null;
  onNavigationStart: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * A subject as a card. The whole card opens the subject (a real link, so
 * middle-click and keyboard work); the kebab menu and quick actions sit above it.
 */
export default function SubjectCard({
  subject,
  navigatingTo,
  onNavigationStart,
  onEdit,
  onDelete,
}: SubjectCardProps) {
  const opening = navigatingTo === subject.id;
  const hasNotes = subject.notes > 0;

  return (
    <article className="card card-interactive group relative flex h-full flex-col rounded-[26px] p-5">
      <div className="flex items-start justify-between">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-indigo-100">
          <Mascot name="laptop" size={40} />
        </span>
        {/* Sits above the stretched link below */}
        <ActionMenu
          className="relative z-10 -mr-2 -mt-1.5"
          label={`Options for ${subject.name}`}
          items={[
            {
              label: "Edit",
              icon: <LuPencil className="h-4 w-4" />,
              onSelect: () => onEdit(subject.id),
            },
            {
              label: "Delete",
              tone: "danger",
              icon: <LuTrash2 className="h-4 w-4" />,
              onSelect: () => onDelete(subject.id),
            },
          ]}
        />
      </div>

      <h3 className="mt-3 line-clamp-2 sm:min-h-[2.6em] font-display text-xl font-semibold leading-[1.3] text-ink">
        <Link
          href={`/subjects/${subject.id}`}
          onClick={() => onNavigationStart(subject.id)}
          className="rounded-lg after:absolute after:inset-0 after:rounded-[26px] after:content-['']"
          aria-busy={opening || undefined}
        >
          {subject.name}
        </Link>
      </h3>
      <p className="mt-1 text-[15px] font-semibold text-gray-600">
        {subject.notes} {subject.notes === 1 ? "note" : "notes"} · {subject.time}
      </p>

      {/* Quick study shortcuts */}
      <div className="relative z-10 mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
        {hasNotes ? (
          <>
            <Link
              href={`/subjects/${subject.id}/quiz`}
              className="chip chip-accent min-h-9 px-3.5 hover:brightness-95"
            >
              <LuListChecks className="h-4 w-4" aria-hidden />
              Quiz
            </Link>
            <Link
              href={`/subjects/${subject.id}/flashcard`}
              className="chip min-h-9 px-3.5 hover:brightness-95"
            >
              <LuLayers className="h-4 w-4" aria-hidden />
              Cards
            </Link>
            <Link
              href={`/subjects/${subject.id}/summary`}
              className="chip chip-success min-h-9 px-3.5 hover:brightness-95"
            >
              <LuBookOpen className="h-4 w-4" aria-hidden />
              Summary
            </Link>
          </>
        ) : (
          <p className="py-1.5 text-sm font-semibold text-gray-500">
            Add a note to unlock study tools.
          </p>
        )}
      </div>
    </article>
  );
}
