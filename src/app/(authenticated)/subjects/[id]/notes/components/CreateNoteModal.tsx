import React from "react";
import { useRouter, useParams } from "next/navigation";
import Mascot, { type MascotName } from "@/components/ui/Mascot";

interface CreateNoteModalProps {
  onClose?: () => void;
  onCreateNote?: () => void;
  onUpload?: () => void;
}

interface Option {
  title: string;
  body: string;
  mascot: MascotName;
  onSelect: () => void;
}

/**
 * The two ways to add a note. Rendered inside the page's <Modal>, so it only
 * owns the choices, not the dialog chrome.
 */
const CreateNoteModal: React.FC<CreateNoteModalProps> = ({
  onCreateNote,
  onUpload,
}) => {
  const router = useRouter();
  const params = useParams();
  // params.id is the subject id

  const handleCreateNote = () => {
    if (onCreateNote) onCreateNote();
    // Redirect to /subjects/[id]/notes/new
    if (params?.id) {
      router.push(`/subjects/${params.id}/notes/new`);
    }
  };

  const options: Option[] = [
    {
      title: "Write a note",
      body: "Type or paste your own notes. No AI needed, free to use.",
      mascot: "answer",
      onSelect: handleCreateNote,
    },
    {
      title: "Upload a file",
      body: "PDF, PowerPoint or images. Wisker reads them into a note for you.",
      mascot: "capture",
      onSelect: () => onUpload?.(),
    },
  ];

  return (
    <div className="grid gap-3.5 pb-3 sm:grid-cols-2 sm:gap-4">
      {options.map((o) => (
        <button
          key={o.title}
          type="button"
          onClick={o.onSelect}
          className="card card-interactive flex min-h-[112px] items-center gap-4 rounded-[24px] bg-sand p-4 text-left sm:min-h-[220px] sm:flex-col sm:justify-center sm:gap-2 sm:p-6 sm:text-center"
        >
          <Mascot name={o.mascot} size={72} className="shrink-0 sm:h-24 sm:w-24" />
          <span>
            <span className="block font-display text-xl font-semibold text-ink">
              {o.title}
            </span>
            <span className="mt-0.5 block text-[15px] font-semibold leading-snug text-gray-600">
              {o.body}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
};

export default CreateNoteModal;
