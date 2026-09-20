"use client";
import Link from "next/link";
import { LuCalendar, LuClock, LuFileText, LuPencil, LuTrash2, LuEye } from "react-icons/lu";
import ActionMenu, { type ActionMenuItem } from "./ActionMenu";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  id: number;
  title: string;
  createdAt?: Date | string;
  lastOpened?: Date | string;
  characterCount?: number;
  /** Where the card goes when opened. Preferred: it renders a real link. */
  href?: string;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  className?: string;
}

const formatDate = (date: Date | string | undefined) => {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
};

/** A note in a subject. Whole card opens the note; the kebab holds edit/delete. */
export default function NoteCard({
  title,
  createdAt,
  lastOpened,
  characterCount,
  href,
  onClick,
  onEdit,
  onDelete,
  onView,
  className = "",
}: NoteCardProps) {
  const items: ActionMenuItem[] = [];
  if (onView) items.push({ label: "View", icon: <LuEye className="h-4 w-4" />, onSelect: onView });
  if (onEdit) items.push({ label: "Edit", icon: <LuPencil className="h-4 w-4" />, onSelect: onEdit });
  if (onDelete)
    items.push({
      label: "Delete",
      tone: "danger",
      icon: <LuTrash2 className="h-4 w-4" />,
      onSelect: onDelete,
    });

  const stretch =
    "rounded-lg after:absolute after:inset-0 after:rounded-[22px] after:content-['']";

  return (
    <article
      className={cn(
        "card card-interactive relative flex flex-col justify-between rounded-[22px] p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug text-ink">
            {href ? (
              <Link href={href} className={stretch}>
                {title}
              </Link>
            ) : (
              <button type="button" onClick={onClick} className={cn(stretch, "text-left")}>
                {title}
              </button>
            )}
          </h3>
          <dl className="mt-2.5 flex flex-col gap-1 text-[13px] font-semibold text-gray-600">
            {characterCount !== undefined && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Length</dt>
                <LuFileText className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                <dd>{characterCount.toLocaleString()} characters</dd>
              </div>
            )}
            {lastOpened && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Last opened</dt>
                <LuClock className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                <dd>Opened {relativeTime(lastOpened)}</dd>
              </div>
            )}
            {createdAt && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <dt className="sr-only">Created</dt>
                <LuCalendar className="h-4 w-4 shrink-0" aria-hidden />
                <dd>{formatDate(createdAt)}</dd>
              </div>
            )}
          </dl>
        </div>

        {items.length > 0 && (
          <ActionMenu
            className="relative z-10 -mr-2 -mt-2"
            label={`Options for ${title}`}
            items={items}
          />
        )}
      </div>
    </article>
  );
}
