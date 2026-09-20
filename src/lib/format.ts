/** Small date helpers shared by dashboard and subject screens. */

const MS_DAY = 86_400_000;

/** "just now", "5m ago", "3h ago", "2d ago", "4w ago". */
export function relativeTime(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 45) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/** Whole calendar days from today until `input` (negative if in the past). */
export function daysUntil(input: string | Date): number {
  const target = typeof input === "string" ? new Date(input) : new Date(input);
  const a = new Date();
  a.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - a.getTime()) / MS_DAY);
}

/** "Today", "Tomorrow", "In 5 days", or "Mar 4". */
export function examCountdown(input: string | Date): string {
  const d = daysUntil(input);
  if (d < 0) return "Passed";
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d < 14) return `In ${d} days`;
  return new Date(input).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
