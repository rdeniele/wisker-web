import {
  LuAlignLeft,
  LuFileText,
  LuList,
  LuSmile,
  LuMeh,
  LuZap,
} from "react-icons/lu";
import type { Option } from "./ToolSetupFrame";

export type Difficulty = "easy" | "medium" | "hard";
export type SummaryLength = "short" | "medium" | "detailed";
export type SummaryType = "paragraph" | "bullet" | "keypoints";

export const DIFFICULTY_OPTIONS: Option<Difficulty>[] = [
  { value: "easy", label: "Easy", description: "Basic concepts and definitions", icon: LuSmile },
  { value: "medium", label: "Medium", description: "Moderate understanding required", icon: LuMeh },
  { value: "hard", label: "Hard", description: "Advanced analysis and application", icon: LuZap },
];

export const LENGTH_OPTIONS: Option<SummaryLength>[] = [
  { value: "short", label: "Short", description: "Quick overview in 2-3 sentences", icon: LuAlignLeft },
  { value: "medium", label: "Medium", description: "Balanced summary with key details", icon: LuFileText },
  { value: "detailed", label: "Detailed", description: "Comprehensive summary with examples", icon: LuList },
];

export const TYPE_OPTIONS: Option<SummaryType>[] = [
  { value: "paragraph", label: "Paragraph", description: "Flowing narrative format", icon: LuAlignLeft },
  { value: "bullet", label: "Bullet points", description: "Organized list format", icon: LuList },
  { value: "keypoints", label: "Key points", description: "Main concepts only", icon: LuZap },
];
