import React from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Mascot from "@/components/ui/Mascot";
import Button from "@/components/ui/button";

type StudyStateProps =
  | { kind: "loading"; message?: string }
  | {
      kind: "error";
      title?: string;
      message: string;
      onBack: () => void;
      backLabel?: string;
    };

/** Loading / error content for study screens (rendered inside StudyShell). */
export default function StudyState(props: StudyStateProps) {
  if (props.kind === "loading") {
    return <LoadingSpinner size="lg" message={props.message ?? "Loading..."} />;
  }
  return (
    <div className="flex flex-col items-center py-8 text-center" role="alert">
      <Mascot name="sad" size={120} />
      <h2 className="mt-3 text-2xl font-semibold text-ink">
        {props.title ?? "Something went wrong"}
      </h2>
      <p className="mt-1.5 max-w-sm text-[15px] font-semibold leading-relaxed text-gray-600">
        {props.message}
      </p>
      <Button className="mt-6" size="lg" onClick={props.onBack}>
        {props.backLabel ?? "Go back"}
      </Button>
    </div>
  );
}
