import Image from "next/image";
import { cn } from "@/lib/utils";

const files = {
  hi: "wisky-hi",
  happy: "wisky-happy",
  point: "wisky-point",
  laptop: "wisky-laptop",
  cards: "wisky-cards",
  check: "wisky-check",
  read: "wisky-read",
  search: "wisky-search",
  sad: "wisky-sad",
  idle: "wisky-idle",
  star: "wisky-star",
  idea: "wisky-greatidea",
  gym: "wisky-gym",
  run: "wisky-run",
  answer: "wisky-answer",
  capture: "wisky-capture",
  treasure: "wisky-treasure",
  badresult: "wisky-badresult",
  gaming: "wisky-gaming",
  bottle: "wisky-bottle",
  here: "wisky-here",
} as const;

export type MascotName = keyof typeof files;

interface MascotProps {
  name: MascotName;
  /** Rendered width/height in px (the artwork is roughly square). */
  size?: number;
  className?: string;
  /** Provide alt text only if the mascot carries meaning; otherwise it is decorative. */
  alt?: string;
  priority?: boolean;
  float?: boolean;
}

/** Wisky, the Wisker cat. Decorative by default. */
export default function Mascot({
  name,
  size = 120,
  className,
  alt = "",
  priority,
  float,
}: MascotProps) {
  return (
    <Image
      src={`/images/${files[name]}.png`}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={cn(
        "select-none object-contain",
        float && "animate-float",
        className,
      )}
      draggable={false}
    />
  );
}
