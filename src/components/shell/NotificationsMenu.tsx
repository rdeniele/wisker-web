"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuBell,
  LuBookOpen,
  LuLayers,
  LuListChecks,
} from "react-icons/lu";
import { useAuth } from "@/lib/AuthContext";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  subjectId?: string;
  subjectName: string;
  createdAt: string;
}

interface LearningToolResponse {
  id: string;
  type: string;
  createdAt: string;
  subject?: { id?: string; title: string };
  note?: { title: string };
}

const SEEN_KEY = "wisker:notifications-seen";

const typeMeta: Record<
  string,
  { label: string; icon: React.ReactNode; tone: string }
> = {
  QUIZ: {
    label: "quiz",
    icon: <LuListChecks className="h-5 w-5" aria-hidden />,
    tone: "bg-orange-100 text-orange-700",
  },
  FLASHCARD: {
    label: "flashcard deck",
    icon: <LuLayers className="h-5 w-5" aria-hidden />,
    tone: "bg-indigo-100 text-indigo-700",
  },
  SUMMARY: {
    label: "summary",
    icon: <LuBookOpen className="h-5 w-5" aria-hidden />,
    tone: "bg-green-100 text-green-700",
  },
};

function readSeen(): number {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

/** Recent study-tool activity. The dot only shows for items you haven't opened the menu for. */
export default function NotificationsMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [seenAt, setSeenAt] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => setSeenAt(readSeen()), []);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/learning-tools?pageSize=5");
        const result = await response.json();
        if (!cancelled && response.ok && result.data?.learningTools) {
          setItems(
            result.data.learningTools.map((tool: LearningToolResponse) => ({
              id: tool.id,
              type: tool.type,
              subjectId: tool.subject?.id,
              subjectName: tool.subject?.title || tool.note?.title || "Unknown",
              createdAt: tool.createdAt,
            })),
          );
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hasUnseen = items.some((n) => new Date(n.createdAt).getTime() > seenAt);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const now = Date.now();
      setSeenAt(now);
      try {
        localStorage.setItem(SEEN_KEY, String(now));
      } catch {
        /* storage unavailable: dot simply reappears next visit */
      }
    }
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-label={hasUnseen ? "Notifications, new activity" : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="btn btn-icon relative h-11 w-11 rounded-full border border-line bg-white text-ink"
      >
        <LuBell className="h-5 w-5" aria-hidden />
        {hasUnseen && (
          <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-orange-500" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Recent activity"
          className="animate-pop-in absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-line bg-white shadow-xl"
        >
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-lg font-semibold text-ink">Recent activity</h2>
          </div>
          <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
            {loading ? (
              <div className="space-y-2 p-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : items.length > 0 ? (
              <ul>
                {items.map((n) => {
                  const meta = typeMeta[n.type] ?? typeMeta.SUMMARY;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          router.push(
                            n.subjectId ? `/subjects/${n.subjectId}` : "/subjects",
                          );
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-sand"
                      >
                        <span
                          className={cn(
                            "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                            meta.tone,
                          )}
                        >
                          {meta.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-bold text-ink">
                            New {meta.label} created
                          </span>
                          <span className="block truncate text-sm font-semibold text-gray-600">
                            {n.subjectName}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-gray-500">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-4 py-8 text-center text-[15px] font-semibold text-gray-600">
                Nothing new yet. Generate a quiz to get going.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
