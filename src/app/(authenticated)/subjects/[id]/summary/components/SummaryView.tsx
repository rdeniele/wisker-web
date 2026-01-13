"use client";
import { useState, useEffect } from "react";
import { FiArrowLeft, FiCopy, FiCheck, FiDownload } from "react-icons/fi";
import { SummaryConfig } from "./SummarySetup";

interface Note {
  id: number;
  title: string;
}

interface SummaryViewProps {
  subjectName: string;
  selectedNoteIds: number[];
  notes: Note[];
  config: SummaryConfig;
  onBack: () => void;
}

export default function SummaryView({
  subjectName,
  selectedNoteIds,
  notes,
  config,
  onBack,
}: SummaryViewProps) {
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const selectedNotes = notes.filter((note) => selectedNoteIds.includes(note.id));

  // Generate summary from selected notes
  useEffect(() => {
    const generateSummary = () => {
      let mockSummary = "";
      const notesList = selectedNotes.map((n) => n.title).join(", ");

      if (config.summaryType === "paragraph") {
        if (config.summaryLength === "short") {
          mockSummary = `This summary covers the key concepts from ${selectedNotes.length} note${selectedNotes.length > 1 ? "s" : ""} in ${subjectName}: ${notesList}. The content provides an overview of the main topics discussed.`;
        } else if (config.summaryLength === "medium") {
          mockSummary = `This comprehensive summary synthesizes information from ${selectedNotes.length} note${selectedNotes.length > 1 ? "s" : ""} in ${subjectName} (${notesList}). The material explores several key concepts, including their definitions, applications, and relationships. The notes are organized to help understand the fundamental principles and their practical implications across various contexts. Together, these notes provide a cohesive understanding of the subject matter.`;
        } else {
          mockSummary = `This detailed summary offers an in-depth exploration of ${subjectName} based on ${selectedNotes.length} selected note${selectedNotes.length > 1 ? "s" : ""}: ${notesList}. The content begins by introducing fundamental concepts from each note and progressively builds upon them to cover more advanced topics. Throughout the material, various examples are provided to illustrate key points, and the relationships between different concepts across notes are carefully explained. The summary includes both theoretical frameworks and practical applications, helping readers develop a comprehensive understanding of the topic. Special attention is given to common misconceptions and challenging areas, with detailed explanations to clarify these aspects. The integration of multiple notes provides a well-rounded perspective on the subject.`;
        }
      } else if (config.summaryType === "bullet") {
        const shortPoints = selectedNotes.map((note) => `Key concepts from ${note.title}`);
        const mediumPoints = selectedNotes.flatMap((note) => [
          `Overview from ${note.title}`,
          `Key principles and applications`,
        ]);
        const detailedPoints = selectedNotes.flatMap((note) => [
          `Comprehensive introduction from ${note.title}`,
          `Core principles and frameworks`,
          `Practical applications and examples`,
        ]);

        const points =
          config.summaryLength === "short"
            ? shortPoints
            : config.summaryLength === "medium"
            ? mediumPoints
            : detailedPoints;

        mockSummary = points.map((point) => `• ${point}`).join("\n");
      } else {
        // keypoints
        const points = selectedNotes.map((note, idx) => 
          `${idx + 1}. ${note.title}: Key concepts and applications from this note`
        );

        mockSummary = points.join("\n\n");
      }

      setSummary(mockSummary);
      setIsLoading(false);
    };

    generateSummary();
  }, [subjectName, selectedNotes, config]);

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
          <span className="text-gray-400">•</span>
          <p className="text-gray-600">
            {selectedNotes.length} note{selectedNotes.length > 1 ? "s" : ""}
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
