"use client";
import { useRouter } from "next/navigation";
import { FaRegClone, FaQuestionCircle, FaRegLightbulb } from "react-icons/fa";

interface SubjectActionButtonsProps {
  subjectId: string;
  navigatingTo: string | null;
  onNavigationStart: (id: string) => void;
}

export default function SubjectActionButtons({
  subjectId,
  navigatingTo,
  onNavigationStart,
}: SubjectActionButtonsProps) {
  const router = useRouter();

  const actions = [
    {
      id: "flashcard",
      label: "Flashcards",
      icon: FaRegClone,
      route: `/subjects/${subjectId}/flashcard`,
    },
    {
      id: "quiz",
      label: "Quiz",
      icon: FaQuestionCircle,
      route: `/subjects/${subjectId}/quiz`,
    },
    {
      id: "summary",
      label: "Summary",
      icon: FaRegLightbulb,
      route: `/subjects/${subjectId}/summary`,
    },
  ];

  return (
    <div className="flex gap-2 mt-4">
      {actions.map((action) => {
        const actionKey = `${action.id}-${subjectId}`;
        const isLoading = navigatingTo === actionKey;
        const Icon = action.icon;

        return (
          <button
            key={action.id}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 font-medium text-xs transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={(e) => {
              e.stopPropagation();
              onNavigationStart(actionKey);
              router.push(action.route);
            }}
            disabled={isLoading}
            style={{ boxShadow: "0 4px 0 0 rgba(139, 92, 246, 0.15)" }}
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <Icon className="text-base" />
            )}
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
