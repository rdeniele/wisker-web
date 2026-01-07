"use client";
import { useState } from "react";
import { FiArrowLeft, FiFileText, FiAlignLeft, FiList, FiZap, FiInfo } from "react-icons/fi";

interface SummarySetupProps {
  subjectName: string;
  selectedNotesCount: number;
  onGenerate: (config: SummaryConfig) => void;
  onBack: () => void;
}

export interface SummaryConfig {
  summaryLength: "short" | "medium" | "detailed";
  summaryType: "paragraph" | "bullet" | "keypoints";
}

export default function SummarySetup({
  subjectName,
  selectedNotesCount,
  onGenerate,
  onBack,
}: SummarySetupProps) {
  const [summaryLength, setSummaryLength] = useState<"short" | "medium" | "detailed">("medium");
  const [summaryType, setSummaryType] = useState<"paragraph" | "bullet" | "keypoints">("paragraph");

  const handleGenerate = () => {
    onGenerate({ summaryLength, summaryType });
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
              Generate a summary for <span className="font-semibold">{subjectName}</span>
            </p>
            <p className="text-sm text-blue-600 font-medium mt-2">
              Based on {selectedNotesCount} selected note{selectedNotesCount !== 1 ? "s" : ""}
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

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold text-lg shadow-md hover:shadow-lg active:scale-95"
          >
            Generate Summary
          </button>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800 text-center flex items-center justify-center gap-2">
              <FiInfo className="text-blue-600" size={16} />
              <span className="font-semibold">Tip:</span> The summary will be generated from your selected notes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
