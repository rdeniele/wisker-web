"use client";
import { useState, useEffect } from "react";
import { FiArrowLeft, FiCopy, FiCheck, FiDownload } from "react-icons/fi";
import { SummaryConfig } from "./SummarySetup";

interface SummaryViewProps {
  noteTitle: string;
  noteContent: string;
  config: SummaryConfig;
  onBack: () => void;
}

export default function SummaryView({
  noteTitle,
  noteContent,
  config,
  onBack,
}: SummaryViewProps) {
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  // Generate summary from note content
  useEffect(() => {
    const generateSummary = () => {
      // For now, we'll create mock summaries based on the config
      // In a real app, you'd use AI to generate these from the note content
      let mockSummary = "";

      if (config.summaryType === "paragraph") {
        if (config.summaryLength === "short") {
          mockSummary = `This note on "${noteTitle}" covers the fundamental concepts and key principles. It provides an overview of the main topics discussed in the content.`;
        } else if (config.summaryLength === "medium") {
          mockSummary = `This note on "${noteTitle}" provides a comprehensive overview of the subject matter. The content explores several key concepts, including their definitions, applications, and relationships. The material is organized to help understand the fundamental principles and their practical implications in various contexts.`;
        } else {
          mockSummary = `This detailed note on "${noteTitle}" offers an in-depth exploration of the subject matter. The content begins by introducing the fundamental concepts and progressively builds upon them to cover more advanced topics. Throughout the note, various examples are provided to illustrate key points, and the relationships between different concepts are carefully explained. The material includes both theoretical frameworks and practical applications, helping readers develop a comprehensive understanding of the topic. Special attention is given to common misconceptions and challenging areas, with detailed explanations to clarify these aspects.`;
        }
      } else if (config.summaryType === "bullet") {
        const shortPoints = [
          "Introduction to the main topic",
          "Key concepts and definitions",
          "Practical applications",
        ];
        const mediumPoints = [
          "Overview of the fundamental concepts",
          "Detailed explanation of key principles",
          "Relationships between different topics",
          "Practical examples and applications",
          "Common challenges and solutions",
        ];
        const detailedPoints = [
          "Comprehensive introduction to the subject matter",
          "Fundamental concepts with detailed definitions",
          "Core principles and their theoretical frameworks",
          "Relationships and connections between key ideas",
          "Real-world examples demonstrating applications",
          "Common misconceptions and clarifications",
          "Advanced topics and their implications",
          "Best practices and recommendations",
          "Further resources for deeper understanding",
        ];

        const points =
          config.summaryLength === "short"
            ? shortPoints
            : config.summaryLength === "medium"
            ? mediumPoints
            : detailedPoints;

        mockSummary = points.map((point) => `• ${point}`).join("\n");
      } else {
        // keypoints
        const shortPoints = [
          "Core concept 1: Fundamental principles",
          "Core concept 2: Key applications",
        ];
        const mediumPoints = [
          "Primary concept: Foundation and theory",
          "Secondary concept: Practical implementation",
          "Tertiary concept: Advanced considerations",
          "Integration: How concepts connect",
        ];
        const detailedPoints = [
          "Foundational principle: Understanding the basics",
          "Theoretical framework: How it all works",
          "Practical applications: Real-world uses",
          "Advanced topics: Going deeper",
          "Common pitfalls: What to avoid",
          "Best practices: Recommended approaches",
          "Future directions: What's next",
        ];

        const points =
          config.summaryLength === "short"
            ? shortPoints
            : config.summaryLength === "medium"
            ? mediumPoints
            : detailedPoints;

        mockSummary = points.map((point, idx) => `${idx + 1}. ${point}`).join("\n\n");
      }

      setSummary(mockSummary);
      setIsLoading(false);
    };

    generateSummary();
  }, [noteTitle, noteContent, config]);

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
        <div className="flex items-center gap-4 text-sm">
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
          <div className="text-gray-900 leading-relaxed whitespace-pre-line">
            {summary}
          </div>
        </div>
      </div>
    </div>
  );
}
