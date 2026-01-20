import React from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";

interface CreateNoteModalProps {
  onClose?: () => void;
  onCreateNote?: () => void;
  onUpload?: () => void;
}

const CreateNoteModal: React.FC<CreateNoteModalProps> = ({
  onClose,
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

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 relative font-fredoka">
      {/* Close Button */}
      <button
        className="absolute left-4 top-4 text-2xl text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="Close"
        type="button"
        onClick={onClose}
      >
        &#10005;
      </button>

      {/* Header */}
      <h2 className="text-2xl font-bold text-center w-full mt-2 mb-6 text-orange-400">
        Create
      </h2>

      {/* Options */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {/* Create Notes Button */}
        <button
          className="flex-1 min-h-[260px] w-full flex flex-col items-center bg-[#fff7e6] rounded-2xl p-6 shadow-md hover:shadow-lg transition border-2 border-transparent hover:border-orange-300 focus:outline-none"
          onClick={handleCreateNote}
          type="button"
        >
          <Image
            src="/images/wisky-answer.png"
            alt="Create notes cat"
            width={80}
            height={80}
            className="w-20 h-20 mb-2"
            draggable={false}
            priority
          />
          <span className="text-lg font-bold text-orange-400 mb-1">
            Create notes
          </span>
          <span className="text-gray-600 text-sm text-center">
            No AI needed, free to use
          </span>
        </button>

        {/* Upload PDF/Image Button */}
        <button
          className="flex-1 min-h-[260px] w-full flex flex-col items-center bg-[#fff7e6] rounded-2xl p-6 shadow-md hover:shadow-lg transition border-2 border-transparent hover:border-orange-300 focus:outline-none"
          onClick={onUpload}
          type="button"
        >
          <Image
            src="/images/wisky-capture.png"
            alt="Upload PDF cat"
            width={80}
            height={80}
            className="w-20 h-20 mb-2"
            draggable={false}
            priority
          />
          <span className="text-lg font-bold text-orange-400 mb-1">
            Upload PDF/Image
          </span>
          <span className="text-gray-600 text-sm text-center">
            Get materials for free without AI
          </span>
        </button>
      </div>
    </div>
  );
};

export default CreateNoteModal;
