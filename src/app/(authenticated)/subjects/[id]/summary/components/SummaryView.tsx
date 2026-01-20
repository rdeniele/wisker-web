"use client";
import { useState, useEffect } from "react";
import { FiArrowLeft, FiCopy, FiCheck, FiDownload } from "react-icons/fi";
import { SummaryConfig } from "./SummarySetup";

interface SummaryViewProps {
  subjectName: string;
  config: SummaryConfig;
  onBack: () => void;
}

export default function SummaryView({
  subjectName,
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
        
        const response = await fetch(`/api/learning-tools/${config.learningToolId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch summary');
        }
        
        const data = await response.json();
        const summaryContent = JSON.parse(data.data.generatedContent);
        
        // Extract the summary text based on the type
        if (summaryContent.summary) {
          setSummary(summaryContent.summary);
        } else {
          throw new Error('Invalid summary format');
        }
      } catch (err) {
        console.error('Error fetching summary:', err);
        setError(err instanceof Error ? err.message : 'Failed to load summary');
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
    const blob = new Blob([`${subjectName} - Summary\n\n${summary}`], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${subjectName}-summary.txt`;
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
            {subjectName} - Summary
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
        <div className="prose max-w-none">
          {config.summaryType === "bullet" ? (
            <ul className="list-disc ml-6 text-gray-900">
              {summary.split(/\n|•/)
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
                .map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
            </ul>
          ) : config.summaryType === "keypoints" ? (
            <ol className="list-decimal ml-6 text-gray-900">
              {summary
                .split(/\n/)
                .map((line) => line.trim())
                .filter((line) => /^\d+\.\s+/.test(line))
                .map((point, idx) => (
                  <li key={idx}>{point.replace(/^\d+\.\s+/, "")}</li>
                ))}
            </ol>
          ) : (
            <div className="text-gray-900 leading-relaxed whitespace-pre-line">
              {summary}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
