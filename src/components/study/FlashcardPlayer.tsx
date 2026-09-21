"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuRotateCcw } from "react-icons/lu";
import { useToast } from "@/contexts/ToastContext";
import StudyShell from "./StudyShell";
import StudyState from "./StudyState";
import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardPlayerProps {
  title: string;
  learningToolId: string;
  difficulty?: "easy" | "medium" | "hard";
  onBack: () => void;
}

const difficultyChip = {
  easy: "chip-success",
  medium: "",
  hard: "chip-danger",
} as const;

/**
 * Flashcard session. The card is a real button (Space / Enter flips it),
 * arrows or swipes move between cards, and the controls sit in the thumb zone.
 */
export default function FlashcardPlayer({
  title,
  learningToolId,
  difficulty,
  onBack,
}: FlashcardPlayerProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/learning-tools/${learningToolId}`);
        if (!response.ok) throw new Error("Failed to fetch flashcards");
        const data = await response.json();
        const content = JSON.parse(data.data.generatedContent);
        if (!content.cards || !Array.isArray(content.cards) || content.cards.length === 0) {
          throw new Error("No flashcards found");
        }
        if (!cancelled) setCards(content.cards);
      } catch (err) {
        console.error("Error fetching flashcards:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load flashcards");
          showToast("Failed to load flashcards", "error");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learningToolId, showToast]);

  const flip = useCallback(() => setFlipped((f) => !f), []);
  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const n = Math.min(Math.max(i + delta, 0), cards.length - 1);
        if (n !== i) setFlipped(false);
        return n;
      });
    },
    [cards.length],
  );
  const restart = () => {
    setIndex(0);
    setFlipped(false);
  };

  useEffect(() => {
    if (cards.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cards.length, go]);

  if (isLoading) {
    return (
      <StudyShell title={title} onExit={onBack} exitLabel="Back" centered>
        <StudyState kind="loading" message="Loading flashcards..." />
      </StudyShell>
    );
  }

  if (error || cards.length === 0) {
    return (
      <StudyShell title={title} onExit={onBack} exitLabel="Back" centered>
        <StudyState
          kind="error"
          title={error ? "We couldn't open these flashcards" : "No flashcards available"}
          message={error || "Could not generate flashcards from the selected notes."}
          onBack={onBack}
        />
      </StudyShell>
    );
  }

  const card = cards[index];
  const isFirst = index === 0;
  const isLast = index === cards.length - 1;

  return (
    <StudyShell
      title={title}
      subtitle={`Card ${index + 1} of ${cards.length}`}
      onExit={onBack}
      exitLabel="Exit flashcards"
      progress={((index + 1) / cards.length) * 100}
      progressLabel="Flashcard progress"
      tone="accent"
      aside={
        <>
          {difficulty && (
            <span className={cn("chip hidden capitalize sm:inline-flex", difficultyChip[difficulty])}>
              {difficulty}
            </span>
          )}
          <button
            type="button"
            onClick={restart}
            aria-label="Restart from the first card"
            className="btn btn-icon h-12 w-12 text-gray-700"
          >
            <LuRotateCcw className="h-5 w-5" aria-hidden />
          </button>
        </>
      }
      centered
      footer={
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Button variant="secondary" size="lg" onClick={() => go(-1)} disabled={isFirst}>
            <LuChevronLeft className="h-5 w-5" aria-hidden />
            <span className="hidden xs:inline">Previous</span>
            <span className="xs:hidden sr-only">Previous</span>
          </Button>
          <Button variant="accent" size="lg" onClick={flip} className="min-w-[112px]">
            Flip
          </Button>
          <Button variant="secondary" size="lg" onClick={() => go(1)} disabled={isLast}>
            <span className="hidden xs:inline">Next</span>
            <span className="xs:hidden sr-only">Next</span>
            <LuChevronRight className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      }
    >
      <div
        className="[perspective:1200px]"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchStart.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const s = touchStart.current;
          touchStart.current = null;
          if (!s) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - s.x;
          const dy = t.clientY - s.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
        }}
      >
        <button
          type="button"
          onClick={flip}
          aria-label={flipped ? "Showing the answer. Flip to the question" : "Showing the question. Flip to the answer"}
          className="relative block min-h-[min(56vh,420px)] w-full rounded-[32px] text-left [transform-style:preserve-3d] transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* Question */}
          <span
            aria-hidden={flipped}
            className="absolute inset-0 flex flex-col items-center justify-center rounded-[32px] border border-line bg-white p-7 text-center shadow-[0_8px_0_#efe0cc] [backface-visibility:hidden] motion-reduce:[backface-visibility:visible]"
            style={{ visibility: flipped ? "hidden" : "visible" }}
          >
            <span className="eyebrow">Question</span>
            <span className="mt-4 max-w-full break-words text-[1.5rem] font-medium leading-snug text-ink sm:text-[1.9rem]">
              {card.front}
            </span>
            <span className="mt-8 text-sm font-bold text-gray-500">Tap to flip</span>
          </span>
          {/* Answer */}
          <span
            aria-hidden={!flipped}
            className="absolute inset-0 flex flex-col items-center justify-center rounded-[32px] bg-indigo-500 p-7 text-center text-white shadow-[0_8px_0_#4341d6] [backface-visibility:hidden]"
            style={{
              transform: "rotateY(180deg)",
              visibility: flipped ? "visible" : "hidden",
            }}
          >
            <span className="font-display text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-indigo-100">
              Answer
            </span>
            <span className="mt-4 max-w-full break-words text-[1.4rem] font-medium leading-snug sm:text-[1.75rem]">
              {card.back}
            </span>
            <span className="mt-8 text-sm font-bold text-indigo-100">Tap to flip back</span>
          </span>
        </button>
      </div>
      <p className="mt-6 text-center text-sm font-semibold text-gray-500">
        Swipe or use the arrow keys to change cards.
      </p>
    </StudyShell>
  );
}
