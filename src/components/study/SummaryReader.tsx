"use client";

import React, { useEffect, useState } from "react";
import { LuCheck, LuCopy, LuDownload } from "react-icons/lu";
import StudyShell from "./StudyShell";
import StudyState from "./StudyState";
import Button from "@/components/ui/button";
import type { SummaryLength, SummaryType } from "./options";

interface SummaryReaderProps {
  title: string;
  learningToolId: string;
  summaryLength: SummaryLength;
  summaryType: SummaryType;
  onBack: () => void;
}

const typeLabel: Record<SummaryType, string> = {
  paragraph: "Paragraph",
  bullet: "Bullet points",
  keypoints: "Key points",
};

const bulletsOf = (text: string) =>
  text
    .split(/\n|•/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

const numberedOf = (text: string) =>
  text
    .split(/(?=\d+\.\s+)/) // split before each "1. ", "2. ", ...
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && /^\d+\.\s+/.test(l));

function PartHeading({ n }: { n: number }) {
  return (
    <h3 className="mb-2 font-display text-lg font-semibold text-indigo-700">Part {n}</h3>
  );
}

/** Renders the generated summary in the layout matching the chosen format. */
function SummaryBody({ summary, type }: { summary: string; type: SummaryType }) {
  const multi = summary.includes("**Part");
  const parts = multi ? summary.split(/\*\*Part \d+:\*\*/) : [];

  if (type === "bullet") {
    if (multi) {
      return (
        <div className="space-y-7">
          {parts.map((section, idx) =>
            idx === 0 ? null : (
              <div key={idx}>
                <PartHeading n={idx} />
                <ul className="list-disc space-y-2 pl-6">
                  {bulletsOf(section).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      );
    }
    return (
      <ul className="list-disc space-y-2 pl-6">
        {bulletsOf(summary).map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    );
  }

  if (type === "keypoints") {
    if (multi) {
      return (
        <div className="space-y-7">
          {parts.map((section, idx) => {
            if (idx === 0 && section.trim().length === 0) return null;
            const trimmed = section.trim();
            const points = numberedOf(trimmed);
            return (
              <div key={idx}>
                <PartHeading n={idx} />
                {points.length === 0 ? (
                  // Fallback: show the raw text if no numbered points were found
                  <div className="whitespace-pre-line">{trimmed}</div>
                ) : (
                  <ol className="list-decimal space-y-2 pl-6">
                    {points.map((p, i) => (
                      <li key={i}>{p.replace(/^\d+\.\s+/, "")}</li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return (
      <ol className="list-decimal space-y-2 pl-6">
        {numberedOf(summary).map((p, i) => (
          <li key={i}>{p.replace(/^\d+\.\s+/, "")}</li>
        ))}
      </ol>
    );
  }

  if (multi) {
    return (
      <div className="space-y-6">
        {parts.map((section, idx) =>
          idx === 0 ? null : (
            <div key={idx}>
              <PartHeading n={idx} />
              <p className="whitespace-pre-line">{section.trim()}</p>
            </div>
          ),
        )}
      </div>
    );
  }
  return <div className="whitespace-pre-line">{summary}</div>;
}

/** Distraction-free reading view for a generated summary. */
export default function SummaryReader({
  title,
  learningToolId,
  summaryLength,
  summaryType,
  onBack,
}: SummaryReaderProps) {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/learning-tools/${learningToolId}`);
        if (!response.ok) throw new Error("Failed to fetch summary");
        const data = await response.json();
        const content = JSON.parse(data.data.generatedContent);
        if (!content.summary) throw new Error("Invalid summary format");
        if (!cancelled) setSummary(content.summary);
      } catch (err) {
        console.error("Error fetching summary:", err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load summary");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learningToolId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([`${title} - Summary\n\n${summary}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}-summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <StudyShell title={title} onExit={onBack} exitLabel="Back" centered>
        <StudyState kind="loading" message="Loading your summary..." />
      </StudyShell>
    );
  }

  if (error) {
    return (
      <StudyShell title={title} onExit={onBack} exitLabel="Back" centered>
        <StudyState kind="error" title="We couldn't open this summary" message={error} onBack={onBack} />
      </StudyShell>
    );
  }

  return (
    <StudyShell
      title={title}
      subtitle="Summary"
      onExit={onBack}
      exitLabel="Close summary"
      tone="success"
      aside={
        <>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={isCopied ? "Copied" : "Copy summary"}
            className="btn btn-icon h-12 w-12 text-gray-700"
          >
            {isCopied ? (
              <LuCheck className="h-5 w-5 text-green-600" aria-hidden />
            ) : (
              <LuCopy className="h-5 w-5" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            aria-label="Download summary as text"
            className="btn btn-icon h-12 w-12 text-gray-700"
          >
            <LuDownload className="h-5 w-5" aria-hidden />
          </button>
        </>
      }
      footer={
        <Button size="lg" fullWidth variant="secondary" onClick={onBack}>
          Done
        </Button>
      }
    >
      <div role="status" aria-live="polite" className="sr-only">
        {isCopied ? "Summary copied to clipboard" : ""}
      </div>
      <h1 className="text-[1.75rem] font-semibold leading-tight text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 flex flex-wrap gap-2">
        <span className="chip chip-success capitalize">{summaryLength} length</span>
        <span className="chip chip-success">{typeLabel[summaryType]}</span>
      </p>

      <article className="prose-wisker mt-6 rounded-[28px] border border-line bg-white p-5 shadow-[0_4px_0_#efe0cc] sm:p-8">
        {!summary || summary.trim().length === 0 ? (
          <p className="py-8 text-center text-gray-500">No summary content available.</p>
        ) : (
          <SummaryBody summary={summary} type={summaryType} />
        )}
      </article>
    </StudyShell>
  );
}
