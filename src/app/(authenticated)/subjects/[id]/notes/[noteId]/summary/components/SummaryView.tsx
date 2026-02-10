"use client";
import { useState, useEffect } from "react";
import { FiArrowLeft, FiCopy, FiCheck, FiDownload } from "react-icons/fi";
import { SummaryConfig } from "./SummarySetup";

interface SummaryViewProps {
  noteTitle: string;
  config: SummaryConfig;
  onBack: () => void;
}

export default function SummaryView({
  noteTitle,
  config,
  onBack,
}: SummaryViewProps) {
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch summary from learning tool API
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/learning-tools/${config.learningToolId}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch summary");
        }

        const data = await response.json();
        const summaryContent = JSON.parse(data.data.generatedContent);

        console.log("Summary content received:", {
          hasSummary: !!summaryContent.summary,
          summaryLength: summaryContent.summary?.length,
          summaryPreview: summaryContent.summary?.substring(0, 200),
          fullSummary: summaryContent.summary,
          hasPartMarkers: summaryContent.summary?.includes("**Part"),
        });

        // Extract the summary text based on the type
        if (summaryContent.summary) {
          setSummary(summaryContent.summary);
        } else {
          console.error("No summary field in summaryContent:", summaryContent);
          throw new Error("Invalid summary format");
        }
      } catch (err) {
        console.error("Error fetching summary:", err);
        setError(err instanceof Error ? err.message : "Failed to load summary");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [config.learningToolId]);

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
    const blob = new Blob([`${noteTitle} - Summary\n\n${summary}`], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${noteTitle}-summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group"
        >
          <FiArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="font-medium">Back to Setup</span>
        </button>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Generating summary...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group"
        >
          <FiArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="font-medium">Back to Setup</span>
        </button>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Error Loading Summary
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group"
      >
        <FiArrowLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span className="font-medium">Back to Setup</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold font-fredoka text-gray-900">
            {noteTitle} - Summary
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium text-sm"
            >
              {isCopied ? (
                <>
                  <FiCheck size={16} />
                  Copied!
                </>
              ) : (
                <>
                  <FiCopy size={16} />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm"
            >
              <FiDownload size={16} />
              Download
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <p className="text-blue-600 font-semibold">
            {config.summaryLength.charAt(0).toUpperCase() +
              config.summaryLength.slice(1)}{" "}
            Length
          </p>
          <span className="text-gray-400">•</span>
          <p className="text-blue-600 font-semibold">
            {config.summaryType === "paragraph"
              ? "Paragraph"
              : config.summaryType === "bullet"
                ? "Bullet Points"
                : "Key Points"}{" "}
            Format
          </p>
        </div>
      </div>

      {/* Summary Content */}
      <div className="bg-white rounded-lg shadow-md p-8">
        {!summary || summary.trim().length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No summary content available.</p>
          </div>
        ) : (
          <div className="prose max-w-none">
            {config.summaryType === "bullet" ? (
              <div className="text-gray-900 space-y-6">
                {summary.includes("**Part") ? (
                  /* Multi-part summary - split and display with headers */
                  (() => {
                    const parts = summary.split(/\*\*Part \d+:\*\*/);
                    console.log("Split parts:", parts.length, parts);
                    return parts.map((section, idx) => {
                      // Skip empty first element (before first "Part")
                      if (idx === 0) {
                        console.log(`Skipping idx ${idx}: "${section.substring(0, 50)}..."`);
                        return null;
                      }
                      
                      console.log(`Rendering Part ${idx}: "${section.substring(0, 50)}..."`);
                      
                      return (
                        <div key={idx}>
                          <h3 className="text-lg font-bold text-blue-600 mb-3">
                            Part {idx}
                          </h3>
                          <ul className="list-disc ml-6">
                            {section
                              .split(/\n|•/)
                              .map((line) => line.trim())
                              .filter((line) => line.length > 0)
                              .map((point, pointIdx) => (
                                <li key={pointIdx} className="mb-2">{point}</li>
                              ))}
                          </ul>
                        </div>
                      );
                    });
                  })()
                ) : (
                  /* Single summary */
                  <ul className="list-disc ml-6">
                    {summary
                      .split(/\n|•/)
                      .map((line) => line.trim())
                      .filter((line) => line.length > 0)
                      .map((point, idx) => (
                        <li key={idx} className="mb-2">{point}</li>
                      ))}
                  </ul>
                )}
              </div>
            ) : config.summaryType === "keypoints" ? (
              <div className="text-gray-900 space-y-6">
                {summary.includes("**Part") ? (
                  /* Multi-part summary */
                  (() => {
                    const parts = summary.split(/\*\*Part \d+:\*\*/);
                    console.log("Keypoints - Split parts:", parts.length, parts);
                    return parts.map((section, idx) => {
                      // Skip empty first element
                      if (idx === 0 && section.trim().length === 0) return null;
                      
                      const trimmedSection = section.trim();
                      console.log(`Processing keypoints Part ${idx}:`, trimmedSection.substring(0, 100));
                      
                      // Split on numbered patterns (handles both newline-separated and inline keypoints)
                      const points = trimmedSection
                        .split(/(?=\d+\.\s+)/)  // Split before each "1. ", "2. ", etc.
                        .map((line) => line.trim())
                        .filter((line) => line.length > 0 && /^\d+\.\s+/.test(line));
                      
                      console.log(`Found ${points.length} keypoints in Part ${idx}:`, points);
                      
                      if (points.length === 0) {
                        // Fallback: just display the text as-is if no numbered points found
                        return (
                          <div key={idx}>
                            <h3 className="text-lg font-bold text-blue-600 mb-3">
                              Part {idx}
                            </h3>
                            <div className="whitespace-pre-line">{trimmedSection}</div>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={idx}>
                          <h3 className="text-lg font-bold text-blue-600 mb-3">
                            Part {idx}
                          </h3>
                          <ol className="list-decimal ml-6 space-y-2">
                            {points.map((point, pointIdx) => (
                              <li key={pointIdx} className="mb-2">
                                {point.replace(/^\d+\.\s+/, "")}
                              </li>
                            ))}
                          </ol>
                        </div>
                      );
                    });
                  })()
                ) : (
                  /* Single summary */
                  <ol className="list-decimal ml-6 space-y-2">
                    {(() => {
                      const points = summary
                        .split(/(?=\d+\.\s+)/)  // Split before each numbered point
                        .map((line) => line.trim())
                        .filter((line) => line.length > 0 && /^\d+\.\s+/.test(line));
                      
                      return points.map((point, idx) => (
                        <li key={idx} className="mb-2">
                          {point.replace(/^\d+\.\s+/, "")}
                        </li>
                      ));
                    })()}
                  </ol>
                )}
              </div>
            ) : (
              <div className="text-gray-900 leading-relaxed space-y-4">
                {summary.includes("**Part") ? (
                  /* Multi-part summary */
                  (() => {
                    const parts = summary.split(/\*\*Part \d+:\*\*/);
                    return parts.map((section, idx) => {
                      // Skip empty first element
                      if (idx === 0) return null;
                      
                      return (
                        <div key={idx}>
                          <h3 className="text-lg font-bold text-blue-600 mb-2">
                            Part {idx}
                          </h3>
                          <p className="whitespace-pre-line">{section.trim()}</p>
                        </div>
                      );
                    });
                  })()
                ) : (
                  /* Single summary */
                  <p className="whitespace-pre-line">{summary}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
