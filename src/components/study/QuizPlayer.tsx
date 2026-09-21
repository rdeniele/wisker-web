"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuCheck, LuX } from "react-icons/lu";
import { useToast } from "@/contexts/ToastContext";
import StudyShell from "./StudyShell";
import StudyState from "./StudyState";
import Button from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizPlayerProps {
  /** Subject or note name shown in the header. */
  title: string;
  learningToolId: string;
  onBack: () => void;
  onComplete: (correct: number, total: number) => void;
}

const KEYS = ["A", "B", "C", "D", "E", "F"];

/**
 * The quiz session: one question at a time, big tap targets, instant feedback.
 * Keys: A-D / 1-4 pick an answer, Enter checks or advances.
 */
export default function QuizPlayer({
  title,
  learningToolId,
  onBack,
  onComplete,
}: QuizPlayerProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const { showToast } = useToast();
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/learning-tools/${learningToolId}`);
        if (!response.ok) throw new Error("Failed to fetch quiz questions");
        const data = await response.json();
        const content = JSON.parse(data.data.generatedContent);
        if (!content.questions || !Array.isArray(content.questions) || content.questions.length === 0) {
          throw new Error("No questions found in quiz");
        }
        if (!cancelled) setQuestions(content.questions);
      } catch (err) {
        console.error("Error fetching quiz:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load quiz");
          showToast("Failed to load quiz questions", "error");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learningToolId, showToast]);

  const question = questions[current];
  const isLast = current === questions.length - 1;
  const isAnswered = answered.includes(current);
  const isCorrect = isAnswered && selected === question?.correctAnswer;

  const submit = useCallback(() => {
    if (selected === null || isAnswered || !question) return;
    if (selected === question.correctAnswer) setScore((s) => s + 1);
    setAnswered((a) => [...a, current]);
  }, [selected, isAnswered, question, current]);

  const next = useCallback(() => {
    if (isLast) {
      onComplete(score, questions.length);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }, [isLast, onComplete, score, questions.length]);

  // Bring the explanation into view once an answer is checked.
  useEffect(() => {
    if (isAnswered) feedbackRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isAnswered]);

  // Keyboard: letters / digits choose, Enter submits or advances.
  useEffect(() => {
    if (!question) return;
    const onKey = (e: KeyboardEvent) => {
      if (confirmExit || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      const k = e.key.toUpperCase();
      const idx = KEYS.indexOf(k) >= 0 ? KEYS.indexOf(k) : Number(k) - 1;
      if (!isAnswered && idx >= 0 && idx < question.options.length) {
        setSelected(idx);
      } else if (e.key === "Enter" && t.tagName !== "BUTTON") {
        e.preventDefault();
        if (isAnswered) next();
        else submit();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [question, isAnswered, submit, next, confirmExit]);

  const requestExit = () => {
    if (answered.length > 0 && !isLast) setConfirmExit(true);
    else onBack();
  };

  if (isLoading) {
    return (
      <StudyShell title={title} onExit={onBack} exitLabel="Back" centered>
        <StudyState kind="loading" message="Loading quiz questions..." />
      </StudyShell>
    );
  }

  if (error || questions.length === 0 || !question) {
    return (
      <StudyShell title={title} onExit={onBack} exitLabel="Back" centered>
        <StudyState
          kind="error"
          title="We couldn't open this quiz"
          message={error || "No questions available"}
          onBack={onBack}
        />
      </StudyShell>
    );
  }

  return (
    <>
      <StudyShell
        title={title}
        subtitle={`Question ${current + 1} of ${questions.length}`}
        onExit={requestExit}
        exitLabel="Exit quiz"
        progress={(answered.length / questions.length) * 100}
        progressLabel="Quiz progress"
        aside={
          <span className="chip chip-accent" aria-label={`Score ${score} of ${answered.length}`}>
            {score}/{answered.length}
          </span>
        }
        footer={
          <div className="flex items-center gap-3">
            {!isAnswered ? (
              <Button size="lg" fullWidth onClick={submit} disabled={selected === null}>
                Check answer
              </Button>
            ) : (
              <Button size="lg" fullWidth onClick={next}>
                {isLast ? "See results" : "Next question"}
              </Button>
            )}
          </div>
        }
      >
        <h2 className="break-words text-[1.45rem] font-medium leading-[1.25] text-ink sm:text-[1.9rem]">
          {question.question}
        </h2>

        <div role="radiogroup" aria-label="Answer choices" className="mt-6 grid gap-3">
          {question.options.map((option, index) => {
            const isSel = selected === index;
            const correct = question.correctAnswer === index;
            const showCorrect = isAnswered && correct;
            const showWrong = isAnswered && isSel && !correct;
            return (
              <button
                key={index}
                type="button"
                role="radio"
                aria-checked={isSel}
                disabled={isAnswered}
                onClick={() => setSelected(index)}
                className={cn(
                  "flex min-h-[60px] w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3 text-left text-[17px] font-semibold leading-snug transition-[background-color,border-color,transform] duration-150 active:scale-[0.985] disabled:cursor-default",
                  showCorrect && "border-green-300 bg-green-50 text-ink",
                  showWrong && "border-red-300 bg-red-50 text-ink",
                  !showCorrect && !showWrong && isSel && "border-orange-400 bg-orange-50 text-ink",
                  !showCorrect && !showWrong && !isSel &&
                    (isAnswered
                      ? "border-line bg-white text-gray-500"
                      : "border-line bg-white text-ink hover:border-[#f3cfa0] hover:bg-orange-50/60"),
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-sm font-extrabold",
                    showCorrect && "bg-green-500 text-white",
                    showWrong && "bg-red-500 text-white",
                    !showCorrect && !showWrong && isSel && "bg-orange-500 text-ink",
                    !showCorrect && !showWrong && !isSel && "bg-gray-100 text-gray-600",
                  )}
                  aria-hidden
                >
                  {showCorrect ? (
                    <LuCheck className="h-5 w-5" strokeWidth={3} />
                  ) : showWrong ? (
                    <LuX className="h-5 w-5" strokeWidth={3} />
                  ) : (
                    KEYS[index]
                  )}
                </span>
                <span className="min-w-0 flex-1 break-words">{option}</span>
                {showCorrect && <span className="sr-only">Correct answer</span>}
                {showWrong && <span className="sr-only">Your answer, incorrect</span>}
              </button>
            );
          })}
        </div>

        <div ref={feedbackRef} aria-live="polite" className="mt-5">
          {isAnswered && (
            <div
              className={cn(
                "animate-fade-up rounded-2xl border p-4",
                isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50",
              )}
            >
              <p className={cn("font-display text-lg font-semibold", isCorrect ? "text-green-700" : "text-red-700")}>
                {isCorrect ? "Correct!" : "Not quite."}
              </p>
              {question.explanation && (
                <p className="mt-1 break-words text-[15px] font-semibold leading-relaxed text-gray-700">
                  {question.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      </StudyShell>

      <ConfirmDialog
        open={confirmExit}
        title="Leave this quiz?"
        description="Your answers so far won't be saved."
        confirmLabel="Leave quiz"
        cancelLabel="Keep going"
        onClose={() => setConfirmExit(false)}
        onConfirm={() => {
          setConfirmExit(false);
          onBack();
        }}
      />
    </>
  );
}
