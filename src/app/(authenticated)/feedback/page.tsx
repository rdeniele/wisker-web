"use client";

import React, { useState } from "react";
import type { IconType } from "react-icons";
import {
  LuBug,
  LuHeart,
  LuLightbulb,
  LuMessageCircle,
  LuSend,
  LuSparkles,
  LuStar,
} from "react-icons/lu";
import PageHeader from "@/components/ui/pageheader";
import Mascot from "@/components/ui/Mascot";
import Button from "@/components/ui/button";
import Alert from "@/components/ui/Alert";
import { cn } from "@/lib/utils";
import { readJson, SERVICE_UNAVAILABLE_MESSAGE } from "@/lib/http";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_MESSAGE_MAX,
  FEEDBACK_MESSAGE_MIN,
  type FeedbackCategoryValue,
} from "@/lib/feedback";

const CATEGORY_ICONS: Record<FeedbackCategoryValue, IconType> = {
  BUG: LuBug,
  FEATURE_REQUEST: LuLightbulb,
  IMPROVEMENT: LuSparkles,
  PRAISE: LuHeart,
  OTHER: LuMessageCircle,
};

const RATING_LABELS = ["Poor", "Fair", "Okay", "Good", "Great"];

interface FeedbackResponse {
  success: boolean;
  error?: { message?: string };
}

export default function FeedbackPage() {
  const [category, setCategory] = useState<FeedbackCategoryValue | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedLength = message.trim().length;
  const canSubmit = category !== null && trimmedLength >= FEEDBACK_MESSAGE_MIN;

  const reset = () => {
    setCategory(null);
    setRating(null);
    setMessage("");
    setError(null);
    setSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          ...(rating ? { rating } : {}),
        }),
      });

      const data = await readJson<FeedbackResponse>(res);

      if (!data) {
        setError(SERVICE_UNAVAILABLE_MESSAGE);
        return;
      }
      if (!res.ok || !data.success) {
        setError(data.error?.message || "Couldn't send your feedback. Please try again.");
        return;
      }

      setSent(true);
    } catch {
      setError("Couldn't reach Wisker. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="card mt-6 flex flex-col items-center px-6 py-12 text-center">
          <Mascot name="happy" size={128} float />
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">
            Thanks for telling us!
          </h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-gray-600">
            Your feedback went straight to the Wisker team. We read every
            message and use it to decide what to build next.
          </p>
          <Button className="mt-6" variant="secondary" onClick={reset}>
            Send more feedback
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-4">
        <Mascot name="hi" size={84} className="hidden shrink-0 sm:block" />
        <PageHeader
          centered={false}
          title="Share your feedback"
          subtitle="Help us improve Wisker by sharing your thoughts and suggestions."
        />
      </div>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-7 p-5 sm:p-8">
        {/* Category */}
        <fieldset>
          <legend className="mb-3 text-base font-bold text-ink">
            What kind of feedback is it?
          </legend>
          <div
            role="radiogroup"
            aria-label="Feedback type"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {FEEDBACK_CATEGORIES.map((value) => {
              const Icon = CATEGORY_ICONS[value];
              const selected = category === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setCategory(value)}
                  className={cn(
                    "flex min-h-[52px] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition-colors",
                    selected
                      ? "border-[#615fff] bg-[#eeedff] text-[#3d3bc4]"
                      : "border-[#efe2d2] bg-[#fffdfa] text-ink hover:border-[#e2d3bf]",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  {FEEDBACK_CATEGORY_LABELS[value]}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Rating */}
        <fieldset>
          <legend className="mb-1 text-base font-bold text-ink">
            How&apos;s your experience with Wisker?{" "}
            <span className="font-medium text-gray-500">(optional)</span>
          </legend>
          <div
            role="radiogroup"
            aria-label="Rating"
            className="mt-2 flex items-center gap-1"
          >
            {[1, 2, 3, 4, 5].map((n) => {
              const active = rating !== null && n <= rating;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} out of 5, ${RATING_LABELS[n - 1]}`}
                  // Tapping the current rating again clears it.
                  onClick={() => setRating(rating === n ? null : n)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform hover:scale-110 active:scale-95"
                >
                  <LuStar
                    className={cn(
                      "h-7 w-7 transition-colors",
                      active
                        ? "fill-[#fbb040] text-[#fbb040]"
                        : "text-[#d8cbbb]",
                    )}
                    aria-hidden
                  />
                </button>
              );
            })}
            {rating && (
              <span className="ml-2 text-sm font-semibold text-gray-600">
                {RATING_LABELS[rating - 1]}
              </span>
            )}
          </div>
        </fieldset>

        {/* Message */}
        <div>
          <label
            htmlFor="feedback-message"
            className="mb-2 block text-base font-bold text-ink"
          >
            Tell us more
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={FEEDBACK_MESSAGE_MAX}
            rows={6}
            placeholder={
              category === "BUG"
                ? "What happened, and what did you expect to happen?"
                : category === "FEATURE_REQUEST"
                  ? "What would you like Wisker to do?"
                  : "Share your thoughts, ideas, or suggestions…"
            }
            className="field resize-y"
            required
          />
          <div className="mt-1.5 flex items-center justify-between text-sm text-gray-500">
            <span>
              {trimmedLength > 0 && trimmedLength < FEEDBACK_MESSAGE_MIN
                ? `At least ${FEEDBACK_MESSAGE_MIN} characters`
                : " "}
            </span>
            <span>
              {message.length}/{FEEDBACK_MESSAGE_MAX}
            </span>
          </div>
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            isLoading={submitting}
            disabled={!canSubmit}
          >
            {!submitting && <LuSend className="h-5 w-5" aria-hidden />}
            Send feedback
          </Button>
        </div>
      </form>
    </div>
  );
}
