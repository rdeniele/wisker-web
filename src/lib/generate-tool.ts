/**
 * Calls the learning-tool generator and returns the new tool's id.
 * Throws an Error with a human-readable message on any failure, so callers
 * can pass `error.message` straight to a toast.
 */
export async function generateLearningTool(
  payload: Record<string, unknown>,
  label: string,
): Promise<string> {
  const response = await fetch("/api/learning-tools/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `Failed to generate ${label}`;
    try {
      const errorData = await response.json();
      message = errorData.error?.message || errorData.message || message;
    } catch {
      // Not JSON: fall back to the status so there's still something useful.
      message = `Server error (${response.status})`;
    }
    if (message.includes("503") || message.includes("Service unavailable")) {
      message =
        "AI service is temporarily unavailable. Please try again in a few moments.";
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data.data.id as string;
}
