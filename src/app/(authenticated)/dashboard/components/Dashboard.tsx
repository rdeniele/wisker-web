"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuBookOpen,
  LuChevronRight,
  LuFlame,
  LuLayers,
  LuLibrary,
  LuListChecks,
  LuNotebookText,
  LuPlus,
  LuSparkles,
} from "react-icons/lu";
import { useAuth } from "@/lib/AuthContext";
import { SHOW_SUBSCRIPTION_UI } from "@/lib/subscription-ui-visibility";
import { daysUntil, examCountdown, relativeTime } from "@/lib/format";
import { buttonClasses } from "@/components/ui/button";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import Mascot from "@/components/ui/Mascot";
import Skeleton from "@/components/ui/Skeleton";
import { BottomAd } from "@/components/ui/AdSenseAd";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ types */

interface Subject {
  id: string;
  title: string;
  description?: string;
  examDate?: string | null;
  updatedAt: string;
  _count?: { notes: number; learningTools: number };
}

interface LearningTool {
  id: string;
  type: string;
  createdAt: string;
  subject?: { id: string; title: string };
  note?: { id: string; title: string };
}

interface Streak {
  currentStreak: number;
  longestStreak: number;
}

const toolMeta: Record<
  string,
  { label: string; icon: React.ReactNode; tone: string }
> = {
  QUIZ: {
    label: "Quiz",
    icon: <LuListChecks className="h-5 w-5" aria-hidden />,
    tone: "bg-orange-100 text-orange-700",
  },
  FLASHCARD: {
    label: "Flashcards",
    icon: <LuLayers className="h-5 w-5" aria-hidden />,
    tone: "bg-indigo-100 text-indigo-700",
  },
  SUMMARY: {
    label: "Summary",
    icon: <LuBookOpen className="h-5 w-5" aria-hidden />,
    tone: "bg-green-100 text-green-700",
  },
};

/* ------------------------------------------------------------ data loading */

function useDashboardData() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [tools, setTools] = useState<LearningTool[] | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [subjectsRes, toolsRes, streakRes] = await Promise.allSettled([
      fetch("/api/subjects", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("subjects");
        return r.json();
      }),
      fetch("/api/learning-tools?pageSize=5").then((r) => r.json()),
      fetch("/api/streak").then((r) => r.json()),
    ]);

    if (subjectsRes.status === "fulfilled") {
      setSubjects(subjectsRes.value?.data?.subjects ?? []);
    } else {
      console.error("Error fetching subjects:", subjectsRes.reason);
      setSubjects([]);
      setError("We couldn't load your subjects.");
    }
    if (toolsRes.status === "fulfilled") {
      setTools(toolsRes.value?.data?.learningTools ?? []);
    } else {
      setTools([]);
    }
    if (streakRes.status === "fulfilled" && streakRes.value?.success) {
      setStreak({
        currentStreak: streakRes.value.data.currentStreak,
        longestStreak: streakRes.value.data.longestStreak,
      });
    } else {
      setStreak({ currentStreak: 0, longestStreak: 0 });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { subjects, tools, streak, error, reload: load };
}

/* ------------------------------------------------------------- Up next hero */

type NextStep =
  | { kind: "exam"; subject: Subject; days: number }
  | { kind: "resume"; subject: Subject }
  | { kind: "addNotes"; subject: Subject }
  | { kind: "empty" };

function pickNextStep(subjects: Subject[]): NextStep {
  const upcoming = subjects
    .filter((s) => s.examDate && daysUntil(s.examDate) >= 0)
    .sort(
      (a, b) =>
        new Date(a.examDate as string).getTime() -
        new Date(b.examDate as string).getTime(),
    );
  const soon = upcoming.find(
    (s) => daysUntil(s.examDate as string) <= 30 && (s._count?.notes ?? 0) > 0,
  );
  if (soon) {
    return { kind: "exam", subject: soon, days: daysUntil(soon.examDate as string) };
  }
  const byRecent = [...subjects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const withNotes = byRecent.find((s) => (s._count?.notes ?? 0) > 0);
  if (withNotes) return { kind: "resume", subject: withNotes };
  if (byRecent[0]) return { kind: "addNotes", subject: byRecent[0] };
  return { kind: "empty" };
}

function UpNext({ subjects }: { subjects: Subject[] | null }) {
  if (!subjects) {
    return <Skeleton className="h-[248px] w-full rounded-[28px] sm:h-[220px]" />;
  }
  const step = pickNextStep(subjects);

  let eyebrow = "Start here";
  let title = "Create your first subject";
  let body =
    "Group your notes by course, then Wisker can turn them into quizzes, flashcards and summaries.";
  let actions: React.ReactNode = (
    <Link href="/subjects" className={buttonClasses({ size: "lg" })}>
      <LuPlus className="h-5 w-5" aria-hidden />
      Create a subject
    </Link>
  );
  let mascot: "hi" | "point" | "run" | "read" = "hi";

  if (step.kind === "exam") {
    const s = step.subject;
    eyebrow = examCountdown(s.examDate as string) === "Today" ? "Exam today" : "Exam coming up";
    title = `${s.title} ${
      step.days === 0
        ? "is today"
        : step.days === 1
          ? "is tomorrow"
          : `is in ${step.days} days`
    }`;
    body = "A quick quiz now beats a long re-read later. Test yourself on what you've got.";
    mascot = "run";
  } else if (step.kind === "resume") {
    title = `Keep going with ${step.subject.title}`;
    eyebrow = "Up next";
    body = `${step.subject._count?.notes ?? 0} ${
      (step.subject._count?.notes ?? 0) === 1 ? "note" : "notes"
    } ready. Last touched ${relativeTime(step.subject.updatedAt)}.`;
    mascot = "point";
  } else if (step.kind === "addNotes") {
    title = `Add notes to ${step.subject.title}`;
    eyebrow = "Up next";
    body = "Upload a PDF or write a note and you can start quizzing yourself straight away.";
    mascot = "read";
  }

  if (step.kind === "exam" || step.kind === "resume") {
    const id = step.subject.id;
    actions = (
      <>
        <Link href={`/subjects/${id}/quiz`} className={buttonClasses({ size: "lg" })}>
          <LuListChecks className="h-5 w-5" aria-hidden />
          Take a quiz
        </Link>
        <Link
          href={`/subjects/${id}/flashcard`}
          className={buttonClasses({ variant: "secondary", size: "lg" })}
        >
          <LuLayers className="h-5 w-5" aria-hidden />
          Flashcards
        </Link>
      </>
    );
  } else if (step.kind === "addNotes") {
    actions = (
      <Link href={`/subjects/${step.subject.id}`} className={buttonClasses({ size: "lg" })}>
        <LuPlus className="h-5 w-5" aria-hidden />
        Add a note
      </Link>
    );
  }

  return (
    <section
      aria-labelledby="up-next-title"
      className="relative overflow-hidden rounded-[28px] border border-[#f3d6ae] bg-[#ffefd9] p-6 shadow-[0_5px_0_#f6d3a4] sm:p-8"
    >
      <div className="relative z-10 max-w-[30rem] pr-0 sm:pr-24 md:pr-32">
        <p className="eyebrow">{eyebrow}</p>
        <h2
          id="up-next-title"
          className="mt-1.5 text-[1.65rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[2rem]"
        >
          {title}
        </h2>
        <p className="mt-2.5 text-base leading-relaxed text-gray-700">{body}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">{actions}</div>
      </div>
      <Mascot
        name={mascot}
        size={150}
        float
        className="pointer-events-none absolute -bottom-3 -right-2 hidden h-[130px] w-[130px] sm:block md:h-[160px] md:w-[160px]"
      />
    </section>
  );
}

/* --------------------------------------------------------------- Streak card */

function StreakCard({ streak }: { streak: Streak | null }) {
  if (!streak) return <Skeleton className="h-[92px] w-full rounded-[28px] lg:h-full lg:min-h-[140px]" />;
  const active = streak.currentStreak > 0;
  const days = streak.currentStreak === 1 ? "day" : "days";
  const longest = `Longest: ${streak.longestStreak} ${streak.longestStreak === 1 ? "day" : "days"}`;
  const flame = (
    <span
      className={cn(
        "grid h-14 w-14 shrink-0 place-items-center rounded-2xl lg:h-11 lg:w-11",
        active ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500",
      )}
    >
      <LuFlame className="h-7 w-7 lg:h-6 lg:w-6" aria-hidden />
    </span>
  );
  return (
    <section
      aria-labelledby="streak-title"
      className="card rounded-[28px] p-4 sm:p-5 lg:flex lg:h-full lg:flex-col lg:justify-between lg:p-6"
    >
      {/* Compact row on phones and tablets */}
      <div className="flex items-center gap-4 lg:hidden">
        {flame}
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold leading-tight text-ink">
            {streak.currentStreak}-{days.replace("days", "day")} streak
          </p>
          <p className="text-sm font-semibold leading-snug text-gray-600">
            {active ? "Study today to keep it alive." : "Study today to start one."}{" "}
            <span className="text-gray-500">{longest}</span>
          </p>
        </div>
      </div>

      {/* Full card on desktop */}
      <div className="hidden items-center justify-between gap-3 lg:flex">
        <h2 id="streak-title" className="text-lg font-semibold text-ink">
          Study streak
        </h2>
        {flame}
      </div>
      <div className="mt-4 hidden lg:block">
        <p className="font-display text-5xl font-semibold leading-none text-ink">
          {streak.currentStreak}
          <span className="ml-2 text-xl font-medium text-gray-600">{days}</span>
        </p>
        <p className="mt-3 text-[15px] font-semibold leading-snug text-gray-600">
          {active
            ? "Study today to keep your streak alive."
            : "Study today to start your streak."}
        </p>
        <p className="mt-1 text-sm font-semibold text-gray-500">{longest}</p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Stat tiles */

function StatTiles({ subjects }: { subjects: Subject[] | null }) {
  const stats = useMemo(() => {
    const list = subjects ?? [];
    return [
      {
        label: "Subjects",
        value: list.length,
        icon: <LuLibrary className="h-5 w-5" aria-hidden />,
        tone: "bg-red-100 text-red-700",
      },
      {
        label: "Notes",
        value: list.reduce((n, s) => n + (s._count?.notes ?? 0), 0),
        icon: <LuNotebookText className="h-5 w-5" aria-hidden />,
        tone: "bg-indigo-100 text-indigo-700",
      },
      {
        label: "Study tools",
        value: list.reduce((n, s) => n + (s._count?.learningTools ?? 0), 0),
        icon: <LuSparkles className="h-5 w-5" aria-hidden />,
        tone: "bg-green-100 text-green-700",
      },
    ];
  }, [subjects]);

  return (
    <dl className="grid grid-cols-3 gap-2.5 sm:gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="card flex flex-col gap-3 rounded-[22px] p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
        >
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl",
              s.tone,
            )}
          >
            {s.icon}
          </span>
          <div className="min-w-0">
            <dd className="order-2 font-display text-[1.65rem] font-semibold leading-none text-ink sm:text-3xl">
              {subjects ? s.value : <Skeleton className="h-7 w-10" />}
            </dd>
            <dt className="mt-1 truncate text-[13px] font-bold text-gray-600 sm:text-sm">
              {s.label}
            </dt>
          </div>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------ Subjects grid */

function SectionHeader({
  title,
  href,
  linkLabel = "See all",
  id,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  id: string;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-3">
      <h2 id={id} className="text-xl font-semibold text-ink sm:text-2xl">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="-mr-2 inline-flex min-h-11 items-center gap-0.5 rounded-xl px-2 text-[15px] font-bold text-gray-600 hover:text-ink"
        >
          {linkLabel}
          <LuChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function SubjectsGrid({ subjects }: { subjects: Subject[] | null }) {
  const recent = useMemo(
    () =>
      [...(subjects ?? [])]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 4),
    [subjects],
  );

  return (
    <section aria-labelledby="subjects-title">
      <SectionHeader id="subjects-title" title="Your subjects" href="/subjects" />
      {!subjects ? (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[112px] rounded-[22px]" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <EmptyState
          mascot="idle"
          title="No subjects yet"
          message="Create one to start organising your notes."
          action={
            <Link href="/subjects" className={buttonClasses()}>
              <LuPlus className="h-5 w-5" aria-hidden />
              Create a subject
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3.5 sm:grid-cols-2">
          {recent.map((s) => {
            const notes = s._count?.notes ?? 0;
            return (
              <li key={s.id}>
                <Link
                  href={`/subjects/${s.id}`}
                  className="card card-interactive flex min-h-[92px] items-center gap-4 rounded-[22px] p-4 sm:min-h-[112px] sm:p-5"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-indigo-100">
                    <Mascot name="laptop" size={40} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-display text-lg font-semibold leading-tight text-ink">
                      {s.title}
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-gray-600">
                      {notes} {notes === 1 ? "note" : "notes"} · {relativeTime(s.updatedAt)}
                    </span>
                  </span>
                  <LuChevronRight className="h-5 w-5 shrink-0 text-gray-500" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ Upcoming exams */

function UpcomingExams({ subjects }: { subjects: Subject[] | null }) {
  const exams = useMemo(
    () =>
      (subjects ?? [])
        .filter((s) => s.examDate && daysUntil(s.examDate) >= 0)
        .sort(
          (a, b) =>
            new Date(a.examDate as string).getTime() -
            new Date(b.examDate as string).getTime(),
        )
        .slice(0, 3),
    [subjects],
  );

  // Exam dates aren't stored by the backend yet, so this panel only appears once
  // subjects actually carry one. No dead-end "add an exam date" prompt.
  if (!subjects || exams.length === 0) return null;

  return (
    <section aria-labelledby="exams-title">
      <SectionHeader id="exams-title" title="Upcoming exams" href="/subjects" />
      <div className="card rounded-[24px] p-2">
        <ul>
          {exams.map((exam) => {
            const days = daysUntil(exam.examDate as string);
            const urgent = days <= 3;
            const d = new Date(exam.examDate as string);
            return (
              <li key={exam.id}>
                <Link
                  href={`/subjects/${exam.id}`}
                  className="flex min-h-[68px] items-center gap-3.5 rounded-2xl p-2.5 hover:bg-sand"
                >
                  <span
                    className={cn(
                      "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl leading-none",
                      urgent ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-800",
                    )}
                  >
                    <span className="text-[11px] font-extrabold uppercase tracking-wide">
                      {d.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className="font-display text-lg font-semibold">
                      {d.getDate()}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[17px] font-semibold text-ink">
                      {exam.title}
                    </span>
                    <span className="block text-sm font-semibold text-gray-600">
                      {exam._count?.notes ?? 0}{" "}
                      {(exam._count?.notes ?? 0) === 1 ? "note" : "notes"}
                    </span>
                  </span>
                  <span className={cn("chip", urgent ? "chip-danger" : "chip-neutral")}>
                    {examCountdown(exam.examDate as string)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- Recent activity */

function RecentActivity({ tools }: { tools: LearningTool[] | null }) {
  return (
    <section aria-labelledby="activity-title">
      <SectionHeader id="activity-title" title="Recent activity" />
      <div className="card rounded-[24px] p-2">
        {!tools ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : tools.length === 0 ? (
          <div className="flex items-center gap-4 p-4">
            <Mascot name="idle" size={56} />
            <p className="text-[15px] font-semibold leading-snug text-gray-600">
              Nothing yet. Generate a quiz, flashcards or a summary and it will show up here.
            </p>
          </div>
        ) : (
          <ul>
            {tools.slice(0, 4).map((tool) => {
              const meta = toolMeta[tool.type] ?? toolMeta.SUMMARY;
              const href = tool.subject?.id ? `/subjects/${tool.subject.id}` : "/subjects";
              return (
                <li key={tool.id}>
                  <Link
                    href={href}
                    className="flex min-h-[64px] items-center gap-3.5 rounded-2xl p-2.5 hover:bg-sand"
                  >
                    <span
                      className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", meta.tone)}
                    >
                      {meta.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-ink">{meta.label}</span>
                      <span className="block truncate text-sm font-semibold text-gray-600">
                        {tool.subject?.title || tool.note?.title || "Unknown"}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-bold text-gray-500">
                      {relativeTime(tool.createdAt)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Free trial */

function TrialStrip() {
  return (
    <div className="flex flex-col gap-3 rounded-[22px] border border-[#fad9a8] bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <p className="font-display text-lg font-semibold text-ink">
          Not ready to commit? 30 days on us.
        </p>
        <p className="text-[15px] font-semibold text-gray-700">
          Use promo code <span className="font-extrabold text-orange-700">WISKERTRIAL30</span> at checkout.
        </p>
      </div>
      <Link href="/upgrade" className={buttonClasses({ size: "sm" })}>
        Upgrade
      </Link>
    </div>
  );
}

/* --------------------------------------------------------------------- Page */

export default function Dashboard() {
  const { user } = useAuth();
  const { subjects, tools, streak, error, reload } = useDashboardData();
  const firstName = (user?.user_metadata?.first_name as string | undefined) || "";

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-[1.9rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[2.5rem]">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-base font-semibold text-gray-600 sm:text-lg">
          Here&apos;s what to focus on today.
        </p>
      </header>

      {error && (
        <Alert
          tone="error"
          action={
            <button
              type="button"
              onClick={reload}
              className="btn btn-danger btn-sm shrink-0"
            >
              Try again
            </button>
          }
        >
          {error}
        </Alert>
      )}

      {SHOW_SUBSCRIPTION_UI && <TrialStrip />}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <UpNext subjects={subjects} />
        <StreakCard streak={streak} />
      </div>

      <StatTiles subjects={subjects} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <SubjectsGrid subjects={subjects} />
        <div className="space-y-8">
          <UpcomingExams subjects={subjects} />
          <RecentActivity tools={tools} />
        </div>
      </div>

      {/* Ad placement - bottom of dashboard */}
      <div className="border-t border-line pt-6">
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
          Sponsored
        </p>
        <BottomAd />
      </div>
    </div>
  );
}
