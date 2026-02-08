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
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      // Dynamically import pdfjs only when needed (client-side only)
      const pdfjs = await import("pdfjs-dist");

      // Set up worker
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Join all text items with spaces
        const pageText = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(" ");

        fullText += `\n\n--- Page ${i} ---\n\n${pageText}`;
      }

      return fullText.trim();
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error(
        `Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
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
    setUploadProgress("Uploading file...");

    try {
      const isPDF = file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");

      if (!isPDF && !isImage) {
        showToast("Only PDF and image files are supported", "error");
        setIsUploading(false);
        setUploadProgress("");
        return;
      }

      // Generate a title from the filename (remove extension)
      const title = file.name.replace(/\.[^/.]+$/, "");

      const requestBody: {
        subjectId: string;
        title: string;
        content?: string;
        pdfText?: string;
        imageBase64?: string;
      } = {
        subjectId,
        title,
      };

      if (isPDF) {
        setUploadProgress("Extracting text from PDF...");
        const extractedText = await extractTextFromPDF(file);

        if (!extractedText || extractedText.trim().length === 0) {
          throw new Error(
            "No text could be extracted from PDF. It might be empty or image-based.",
          );
        }

        // COST PROTECTION: Warn about large PDFs
        const charCount = extractedText.length;
        const estimatedCredits = Math.max(1, Math.ceil(charCount / 100000));
        const maxAllowedChars = 300000; // Server-side limit

        if (charCount > maxAllowedChars) {
          const shouldContinue = confirm(
            `⚠️ Large PDF Warning\n\n` +
              `This PDF contains ${charCount.toLocaleString()} characters. ` +
              `It will be truncated to ${maxAllowedChars.toLocaleString()} characters to manage costs.\n\n` +
              `Estimated AI credits: ${estimatedCredits}\n\n` +
              `Do you want to continue? (Content from the end of the PDF may be omitted)`,
          );
          if (!shouldContinue) {
            setIsUploading(false);
            setUploadProgress("");
            return;
          }
        } else if (charCount > 100000) {
          showToast(
            `Large PDF: Will use ~${estimatedCredits} AI credits`,
            "warning",
          );
        }

        requestBody.pdfText = extractedText;

        showToast(
          `Extracted ${charCount.toLocaleString()} characters from PDF`,
          "info",
        );
      } else {
        setUploadProgress("Converting image...");
        const base64Content = await convertFileToBase64(file);
        requestBody.imageBase64 = base64Content;
      }

      setUploadProgress("Processing with AI...");

      const response = await fetch("/api/notes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Upload response status:", response.status);
      console.log(
        "Upload response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      let data;
      const responseText = await response.text();
      console.log("Upload response text:", responseText);

      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        throw new Error(`Server error: ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        console.error("Upload error response:", data);
        const errorMessage =
          data.error?.message || data.message || "Failed to upload file";
        throw new Error(errorMessage);
      }

      setUploadProgress("Creating structured note...");

      showToast("File uploaded and processed successfully!", "success");

      // Call the original callback if provided
      if (onFileSelect) {
        onFileSelect(files);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to upload file",
        "error",
      );
    } finally {
      setIsUploading(false);
      setUploadProgress("");
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  return (
    <div
      className={`w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 relative font-fredoka border-2 border-dashed transition-all duration-200 ${dragActive ? "bg-orange-50 border-orange-400 border-4 scale-[1.02]" : "border-orange-200"}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {dragActive && (
        <div className="absolute inset-0 bg-orange-400/10 rounded-2xl flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-white px-6 py-4 rounded-xl shadow-lg border-2 border-orange-400">
            <span className="text-2xl">📁</span>
            <span className="text-lg font-bold text-orange-500 ml-2">
              Drop your files here
            </span>
          </div>
        </div>
      )}

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
        <span className="text-xl font-bold text-gray-800 mb-1">
          Upload a PDF or Image
        </span>
        <label className="w-full flex justify-center">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={handleInputChange}
            disabled={isUploading}
          />
          <span
            className={`bg-orange-400 hover:bg-orange-500 text-white font-semibold px-6 py-2 rounded-xl shadow-md transition-all duration-150 cursor-pointer text-base mt-2 mb-1 ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isUploading ? "Processing..." : "select files"}
          </span>
        </label>
        {uploadProgress && (
          <div className="text-sm text-orange-500 font-medium mt-2 animate-pulse">
            {uploadProgress}
          </div>
        )}
        {!isUploading && (
          <>
            <span className="text-gray-500 text-sm font-medium mt-2 mb-1 flex items-center gap-1">
              <span className="text-base">📂</span>
              or drag & drop files here
            </span>
            <button
              className="text-blue-500 underline text-sm mt-1 mb-2 hover:text-blue-700"
              type="button"
              onClick={onGoogleDrive}
              disabled={isUploading}
            >
              Or upload from Google Drive
            </button>
          </>
        )}
      </div>

      {/* File size note */}
      <div className="text-xs text-gray-500 text-center mb-2">
        Maximum file size: 10MB. AI will extract text and create a
        well-structured note.
        <br />
        <span className="text-orange-500 font-medium">
          PDFs: Text extraction (all pages). Images: AI vision processing
        </span>
        <br />
        <span className="text-blue-500 font-medium">
          Cost: 1 AI credit per ~100k characters (PDFs), 2 credits (images)
        </span>
      </div>

      {/* Tip */}
      <div className="flex items-center gap-2 bg-[#f7f6fd] rounded-xl px-3 py-2 mt-2">
        <span className="text-yellow-400 text-lg">💡</span>
        <span className="text-xs text-gray-700">
          Text-based PDFs are processed instantly! Large PDFs (&gt;300k chars)
          are truncated to manage costs.
        </span>
      </div>
    </div>
  );
};

export default UploadPDF;
