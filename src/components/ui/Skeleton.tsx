import { cn } from "@/lib/utils";

/** Shimmering placeholder. Size it with utility classes. */
export default function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}
