import React, { useRef, useState } from "react";
import Image from "next/image";

interface UploadPDFProps {
  onClose?: () => void;
  onFileSelect?: (files: FileList | null) => void;
  onGoogleDrive?: () => void;
}

const UploadPDF: React.FC<UploadPDFProps> = ({
  onClose,
  onFileSelect,
  onGoogleDrive,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      if (onFileSelect) {
        onFileSelect(e.dataTransfer.files);
      }
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
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
            onChange={e => onFileSelect && onFileSelect(e.target.files)}
            multiple
          />
          <span
            className="bg-orange-400 hover:bg-orange-500 text-white font-semibold px-6 py-2 rounded-xl shadow-md transition-all duration-150 cursor-pointer text-base mt-2 mb-1"
            onClick={handleClick}
          >
            select files
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