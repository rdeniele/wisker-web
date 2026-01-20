import React, { useRef, useState } from "react";
import Image from "next/image";
import { useToast } from "@/contexts/ToastContext";

interface UploadPDFProps {
  onClose?: () => void;
  onFileSelect?: (files: FileList | null) => void;
  onGoogleDrive?: () => void;
  subjectId?: string;
}

const UploadPDF: React.FC<UploadPDFProps> = ({
  onClose,
  onFileSelect,
  onGoogleDrive,
  subjectId,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!subjectId) {
      showToast("Subject ID is missing", "error");
      return;
    }

    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      showToast("File size exceeds 10MB limit", "error");
      return;
    }

    setIsUploading(true);

    try {
      const base64Content = await convertFileToBase64(file);
      const isPDF = file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");

      if (!isPDF && !isImage) {
        showToast("Only PDF and image files are supported", "error");
        setIsUploading(false);
        return;
      }

      // Generate a title from the filename (remove extension)
      const title = file.name.replace(/\.[^/.]+$/, "");

      const response = await fetch("/api/notes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId,
          title,
          ...(isPDF ? { pdfBase64: base64Content } : { imageBase64: base64Content }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to upload file");
      }

      showToast("File uploaded and processed successfully!", "success");
      
      // Call the original callback if provided
      if (onFileSelect) {
        onFileSelect(files);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to upload file",
        "error"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  return (
    <div
      className={`w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 relative font-fredoka border-2 border-dashed border-orange-200 ${dragActive ? "bg-orange-50 border-orange-400" : ""}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      {/* Close Button */}
      {onClose && (
        <button
          className="absolute left-4 top-4 text-2xl text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Close"
          type="button"
          onClick={onClose}
        >
          &#10005;
        </button>
      )}

      {/* Header */}
      <h2 className="text-2xl font-bold text-center w-full mt-2 mb-2 text-orange-400">
        Wisker AI PDF/Image Summarizer
      </h2>

      {/* Cat Image */}
      <div className="flex justify-center mb-2">
        <Image
          src="/images/wisky-capture.png"
          alt="Upload PDF cat"
          width={100}
          height={100}
          className="w-24 h-24"
          draggable={false}
          priority
        />
      </div>

      {/* Upload Section */}
      <div className="flex flex-col items-center mb-2">
        <span className="text-xl font-bold text-gray-800 mb-1">Upload a PDF/Image/Doc</span>
        <label className="w-full flex justify-center">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            className="hidden"
            onChange={handleInputChange}
            disabled={isUploading}
          />
          <span
            className={`bg-orange-400 hover:bg-orange-500 text-white font-semibold px-6 py-2 rounded-xl shadow-md transition-all duration-150 cursor-pointer text-base mt-2 mb-1 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleClick}
          >
            {isUploading ? "Uploading..." : "select files"}
          </span>
        </label>
        <span className="text-gray-400 text-xs mt-1 mb-1">or drag & drop files here</span>
        <button
          className="text-blue-500 underline text-sm mt-1 mb-2 hover:text-blue-700"
          type="button"
          onClick={onGoogleDrive}
        >
          Or upload from Google Drive
        </button>
      </div>

      {/* File size note */}
      <div className="text-xs text-gray-500 text-center mb-2">
        Maximum file size: 10MB. Text will be automatically extracted from text-based PDFs.
      </div>

      {/* Tip */}
      <div className="flex items-center gap-2 bg-[#f7f6fd] rounded-xl px-3 py-2 mt-2">
        <span className="text-yellow-400 text-lg">💡</span>
        <span className="text-xs text-gray-700">
          Tip: For best results, use PDFs with selectable text. Image-based PDFs will provide a template for manual entry.
        </span>
      </div>
    </div>
  );
};

export default UploadPDF;