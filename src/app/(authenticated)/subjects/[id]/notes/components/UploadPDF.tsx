import React, { useRef, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import Mascot from "@/components/ui/Mascot";
import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadPDFProps {
  onClose?: () => void;
  onFileSelect?: (files: FileList | null) => void;
  onGoogleDrive?: () => void;
  subjectId?: string;
}

const UploadPDF: React.FC<UploadPDFProps> = ({
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

    // Multiple images -> combine into a single note via vision AI.
    const fileArray = Array.from(files);
    const allImages =
      fileArray.length > 0 && fileArray.every((f) => f.type.startsWith("image/"));

    if (fileArray.length > 1 && allImages) {
      if (fileArray.length > 10) {
        showToast("You can upload up to 10 images at once", "error");
        return;
      }
      if (fileArray.some((f) => f.size > 10 * 1024 * 1024)) {
        showToast("Each image must be 10MB or smaller", "error");
        return;
      }

      setIsUploading(true);
      setUploadProgress(`Converting ${fileArray.length} images...`);
      try {
        const imageBase64s = await Promise.all(
          fileArray.map((f) => convertFileToBase64(f)),
        );
        const title =
          fileArray[0].name.replace(/\.[^/.]+$/, "") || "Scanned notes";

        setUploadProgress("Processing with AI...");
        const response = await fetch("/api/notes/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectId, title, imageBase64s }),
        });

        const responseText = await response.text();
        let resData;
        try {
          resData = JSON.parse(responseText);
        } catch {
          throw new Error(`Server error: ${responseText.substring(0, 200)}`);
        }
        if (!response.ok) {
          throw new Error(
            resData.error?.message || resData.message || "Failed to upload images",
          );
        }

        showToast(
          `${fileArray.length} images uploaded and processed successfully!`,
          "success",
        );
        if (onFileSelect) onFileSelect(files);
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Failed to upload images",
          "error",
        );
      } finally {
        setIsUploading(false);
        setUploadProgress("");
      }
      return;
    }

    const file = files[0];
    
    // Check file type first
    const isPDF = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    const isPPT = file.type === "application/vnd.ms-powerpoint" || 
                  file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation";

    if (!isPDF && !isImage && !isPPT) {
      showToast("Only PDF, PowerPoint, and image files are supported", "error");
      return;
    }

    // Different size limits for different file types
    const maxSizePDF = 10 * 1024 * 1024; // 10MB for PDFs
    const maxSizeImage = 10 * 1024 * 1024; // 10MB for images
    const maxSizePPT = 50 * 1024 * 1024; // 50MB for PowerPoint files
    
    const maxSize = isPPT ? maxSizePPT : (isPDF ? maxSizePDF : maxSizeImage);
    const maxSizeMB = isPPT ? 50 : 10;

    if (file.size > maxSize) {
      showToast(`File size exceeds ${maxSizeMB}MB limit`, "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Uploading file...");

    try {

      // Generate a title from the filename (remove extension)
      const title = file.name.replace(/\.[^/.]+$/, "");

      const requestBody: {
        subjectId: string;
        title: string;
        content?: string;
        pdfText?: string;
        imageBase64?: string;
        pptBase64?: string;
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
      } else if (isPPT) {
        setUploadProgress("Processing PowerPoint file...");
        // For PowerPoint, use FormData to avoid JSON size limits
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subjectId", subjectId);
        formData.append("title", title);
        formData.append("fileType", "powerpoint");

        const response = await fetch("/api/notes/create", {
          method: "POST",
          body: formData, // Send as FormData instead of JSON
        });

        // Handle response
        let data;
        const responseText = await response.text();

        try {
          data = JSON.parse(responseText);
        } catch {
          console.error("Failed to parse server response");
          throw new Error(`Server error: ${responseText.substring(0, 200)}`);
        }

        if (!response.ok) {
          console.error("Upload failed:", response.status, data);
          const errorMessage =
            data.error?.message || data.message || "Failed to upload file";
          throw new Error(errorMessage);
        }

        setUploadProgress("Creating structured note...");
        showToast("File uploaded and processed successfully!", "success");

        if (onFileSelect) {
          onFileSelect(files);
        }

        setIsUploading(false);
        setUploadProgress("");
        return; // Exit early for PowerPoint uploads
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

      // Processing upload response

      let data;
      const responseText = await response.text();

      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("Failed to parse server response");
        throw new Error(`Server error: ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        console.error("Upload failed:", response.status, data);
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
      className={cn(
        "relative rounded-3xl border-2 border-dashed p-5 text-center transition-colors sm:p-7",
        dragActive
          ? "border-orange-500 bg-orange-100"
          : "border-[#f3d6ae] bg-sand",
      )}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <Mascot name="capture" size={88} className="mx-auto" />
      <p className="mt-2 font-display text-xl font-semibold text-ink">
        {dragActive ? "Drop your files here" : "Upload PDF, PowerPoint or images"}
      </p>
      <p className="mt-1 text-[15px] font-semibold text-gray-600">
        Drag and drop them here, or choose from your device.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.ppt,.pptx,image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose files to upload"
        onChange={handleInputChange}
        disabled={isUploading}
      />
      <Button
        size="lg"
        className="mt-5 w-full sm:w-auto"
        onClick={() => inputRef.current?.click()}
        isLoading={isUploading}
      >
        {isUploading ? "Processing..." : "Choose files"}
      </Button>

      <div role="status" aria-live="polite" className="min-h-6">
        {uploadProgress && (
          <p className="mt-3 animate-pulse text-[15px] font-bold text-orange-700">
            {uploadProgress}
          </p>
        )}
      </div>

      {!isUploading && (
        <button
          type="button"
          onClick={onGoogleDrive}
          className="link mt-1 min-h-11 text-[15px]"
        >
          Or upload from Google Drive
        </button>
      )}

      <ul className="mt-4 space-y-1 border-t border-[#f3d6ae] pt-4 text-left text-sm font-semibold text-gray-600">
        <li>Up to 10MB for PDFs and images, 50MB for PowerPoint.</li>
        <li>PDFs and slides use text extraction. Images use AI vision.</li>
        <li>
          Cost: 1 AI credit per ~100k characters. PDFs over 300k characters are
          truncated.
        </li>
      </ul>
    </div>
  );
};

export default UploadPDF;
