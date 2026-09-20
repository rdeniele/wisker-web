"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/button";
import Alert from "@/components/ui/Alert";
import Skeleton from "@/components/ui/Skeleton";
import InputBox, { TextAreaBox } from "@/components/ui/inputboxes";

interface SubjectFormProps {
  mode: "create" | "update";
  subjectId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

/**
 * Create / edit a subject. One dialog for both so the two flows can't drift:
 * bottom sheet on phones, centred card on larger screens.
 */
export default function SubjectForm({
  mode,
  subjectId,
  onClose,
  onSuccess,
}: SubjectFormProps) {
  const router = useRouter();
  const isUpdate = mode === "update";
  const [subjectName, setSubjectName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isUpdate);
  const [error, setError] = useState<string | null>(null);

  // When editing, load the existing values.
  useEffect(() => {
    if (!isUpdate) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/subjects/${subjectId}`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error?.message || "Failed to fetch subject");
        }
        if (!cancelled) {
          setSubjectName(result.data.title || "");
          setDescription(result.data.description || "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load subject");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isUpdate, subjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subjectName.trim()) {
      setError("Subject name is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: subjectName.trim(),
        description: description.trim() || undefined,
      };
      const response = isUpdate
        ? await fetch(`/api/subjects/${subjectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/subjects/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });

      if (!isUpdate) {
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server error occurred. Please try again.");
        }
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error?.message ||
            result.message ||
            `Failed to ${isUpdate ? "update" : "create"} subject`,
        );
      }

      // Success - refresh and close
      onSuccess?.();
      router.refresh();
      onClose?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isUpdate ? "update" : "create"} subject`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const formId = "subject-form";

  return (
    <Modal
      open
      onClose={() => onClose?.()}
      title={isUpdate ? "Edit subject" : "New subject"}
      description={
        isUpdate
          ? "Update the name and description of this subject."
          : "Group your notes by course so Wisker can build study tools from them."
      }
      locked={isSaving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            isLoading={isSaving}
            disabled={isLoading}
          >
            {isUpdate ? "Save changes" : "Create subject"}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="space-y-4 py-2" aria-busy="true">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <form id={formId} onSubmit={handleSubmit} className="space-y-5 py-1">
          {error && <Alert tone="error">{error}</Alert>}
          <InputBox
            label="Subject name"
            placeholder="e.g. Biology, Torts, Statistics"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            required
            disabled={isSaving}
            autoComplete="off"
          />
          <TextAreaBox
            label={
              <>
                Description{" "}
                <span className="font-semibold text-gray-500">(optional)</span>
              </>
            }
            placeholder="What is this subject about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={1000}
            showCount
            disabled={isSaving}
          />
        </form>
      )}
    </Modal>
  );
}
