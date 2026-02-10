"use client";
import { useState, useTransition } from "react";
import {
  FiArrowLeft,
  FiFileText,
  FiAlignLeft,
  FiList,
  FiZap,
  FiInfo,
} from "react-icons/fi";
import { useToast } from "@/../hook/useToast";

interface SummarySetupProps {
  subjectId: string;
  subjectName: string;
  selectedNoteIds: string[];
  selectedNotesCount: number;
  onGenerate: (config: SummaryConfig) => void;
  onBack: () => void;
}

export interface SummaryConfig {
  learningToolId: string;
  summaryLength: "short" | "medium" | "detailed";
  summaryType: "paragraph" | "bullet" | "keypoints";
}

export default function SummarySetup({
  subjectId,
  subjectName,
  selectedNoteIds,
  selectedNotesCount,
  onGenerate,
  onBack,
}: SummarySetupProps) {
  const [summaryLength, setSummaryLength] = useState<
    "short" | "medium" | "detailed"
  >("medium");
  const [summaryType, setSummaryType] = useState<
    "paragraph" | "bullet" | "keypoints"
  >("paragraph");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleGenerate = async () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/learning-tools/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "SUMMARY",
            source: "SUBJECT",
            subjectId,
            noteIds: selectedNoteIds,
            summaryLength,
            summaryType,
          }),
        });

        if (!response.ok) {
          let errorMessage = "Failed to generate summary";
          
          try {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            errorMessage = errorData.error?.message || errorMessage;
          } catch (parseError) {
            // If response isn't JSON, try to get text
            console.error("Failed to parse error response:", parseError);
            try {
              const errorText = await response.text();
              console.error("Error response text:", errorText);
              errorMessage = `Server error (${response.status}): ${errorText.substring(0, 100)}`;
            } catch {
              errorMessage = `Server error (${response.status})`;
            }
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        showToast("Summary generated successfully!", "success");

        onGenerate({
          learningToolId: data.data.id,
          summaryLength,
          summaryType,
        });
      } catch (error) {
        console.error("Error generating summary:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to generate summary";
        const isServiceUnavailable =
          errorMessage.includes("503") ||
          errorMessage.includes("Service unavailable");

        showToast(
          isServiceUnavailable
            ? "AI service is temporarily unavailable. Please try again in a few moments."
            : errorMessage,
          "error",
        );
      }
    });
  };

  const lengthOptions = [
    {
      value: "short" as const,
      label: "Short",
      description: "Quick overview in 2-3 sentences",
      icon: FiAlignLeft,
    },
    {
      value: "medium" as const,
      label: "Medium",
      description: "Balanced summary with key details",
      icon: FiFileText,
    },
    {
      value: "detailed" as const,
      label: "Detailed",
      description: "Comprehensive summary with examples",
      icon: FiList,
    },
  ];

  const typeOptions = [
    {
      value: "paragraph" as const,
      label: "Paragraph",
      description: "Flowing narrative format",
      icon: FiAlignLeft,
    },
    {
      value: "bullet" as const,
      label: "Bullet Points",
      description: "Organized list format",
      icon: FiList,
    },
    {
      value: "keypoints" as const,
      label: "Key Points",
      description: "Main concepts only",
      icon: FiZap,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group mb-6"
        >
          <FiArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="font-medium">Back to Note Selection</span>
        </button>

        {/* Setup Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <FiFileText className="text-blue-600" size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Summary Setup
            </h1>
            <p className="text-gray-600">
              Generate a summary for{" "}
              <span className="font-semibold">{subjectName}</span>
            </p>
            <p className="text-sm text-blue-600 font-medium mt-2">
              Based on {selectedNotesCount} selected note
              {selectedNotesCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Summary Length */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Summary Length
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {lengthOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSummaryLength(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    summaryLength === option.value
                      ? "border-blue-500 bg-blue-50 shadow-md scale-105"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <option.icon
                      className={`text-2xl ${
                        summaryLength === option.value
                          ? "text-blue-600"
                          : "text-gray-600"
                      }`}
                      size={24}
                    />
                    <span className="font-bold text-gray-900">
                      {option.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Summary Type */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Summary Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSummaryType(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    summaryType === option.value
                      ? "border-blue-500 bg-blue-50 shadow-md scale-105"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <option.icon
                      className={`text-2xl ${
                        summaryType === option.value
                          ? "text-blue-600"
                          : "text-gray-600"
                      }`}
                      size={24}
                    />
                    <span className="font-bold text-gray-900">
                      {option.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Section */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Live Preview
            </label>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              {summaryType === "paragraph" && (
                <div className="text-gray-900 leading-relaxed">
                  <span className="font-bold">Paragraph:</span> <br />
                  {summaryLength === "short" && (
                    <>
                      A brief, flowing summary in 2-3 sentences, covering the
                      main ideas from your notes.
                    </>
                  )}
                  {summaryLength === "medium" && (
                    <>
                      A balanced, narrative summary with key details and
                      transitions between concepts.
                    </>
                  )}
                  {summaryLength === "detailed" && (
                    <>
                      A comprehensive, multi-paragraph summary with examples and
                      deeper explanations.
                    </>
                  )}
                </div>
              )}
              {summaryType === "bullet" && (
                <div className="text-gray-900">
                  <span className="font-bold">Bullet Points:</span>
                  <ul className="list-disc ml-6 mt-2">
                    {summaryLength === "short" && (
                      <li>Quick list of main ideas (2-3 bullets)</li>
                    )}
                    {summaryLength === "medium" && (
                      <>
                        <li>
                          Key concepts and supporting details (5-7 bullets)
                        </li>
                        <li>Organized for clarity</li>
                      </>
                    )}
                    {summaryLength === "detailed" && (
                      <>
                        <li>
                          Comprehensive breakdown with examples (8+ bullets)
                        </li>
                        <li>Includes sub-points and explanations</li>
                      </>
                    )}
                  </ul>
                </div>
              )}
              {summaryType === "keypoints" && (
                <div className="text-gray-900">
                  <span className="font-bold">Key Points:</span>
                  <ul className="list-decimal ml-6 mt-2">
                    {summaryLength === "short" && (
                      <li>2-3 main concepts only</li>
                    )}
                    {summaryLength === "medium" && (
                      <li>5-7 essential ideas, no extra details</li>
                    )}
                    {summaryLength === "detailed" && (
                      <li>Comprehensive list of all major concepts</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold text-lg shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Generating..." : "Generate Summary"}
          </button>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800 text-center flex items-center justify-center gap-2">
              <FiInfo className="text-blue-600" size={16} />
              <span className="font-semibold">Tip:</span> The summary will be
              generated from your selected notes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
