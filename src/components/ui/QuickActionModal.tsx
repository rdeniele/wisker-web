"use client";
import React from "react";
import Image from "next/image";

interface QuickActionModalProps {
  onClose: () => void;
  onCreateNote: () => void;
  onCreateSubject: () => void;
}

/**
 * Quick Action Modal - Global modal for quick creation of notes or subjects
 */
const QuickActionModal: React.FC<QuickActionModalProps> = ({
  onClose,
  onCreateNote,
  onCreateSubject,
}) => {
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
      <h2 className="text-2xl font-bold text-center w-full mt-2 mb-6 text-purple-500">
        Quick Create
      </h2>

      {/* Options */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {/* Create Note Button */}
        <button
          className="flex-1 min-h-[260px] w-full flex flex-col items-center bg-purple-50 rounded-2xl p-6 shadow-md hover:shadow-lg transition border-2 border-transparent hover:border-purple-300 focus:outline-none"
          onClick={onCreateNote}
          type="button"
        >
          <Image
            src="/images/wisky-answer.png"
            alt="Create note"
            width={80}
            height={80}
            className="w-20 h-20 mb-2"
            draggable={false}
            priority
          />
          <span className="text-lg font-bold text-purple-500 mb-1">
            New Note
          </span>
          <span className="text-gray-600 text-sm text-center">
            Quickly jot down your thoughts
          </span>
        </button>

        {/* Create Subject Button */}
        <button
          className="flex-1 min-h-[260px] w-full flex flex-col items-center bg-purple-50 rounded-2xl p-6 shadow-md hover:shadow-lg transition border-2 border-transparent hover:border-purple-300 focus:outline-none"
          onClick={onCreateSubject}
          type="button"
        >
          <Image
            src="/images/wisky-laptop.png"
            alt="Create subject"
            width={80}
            height={80}
            className="w-20 h-20 mb-2"
            draggable={false}
            priority
          />
          <span className="text-lg font-bold text-purple-500 mb-1">
            New Subject
          </span>
          <span className="text-gray-600 text-sm text-center">
            Organize your notes by topic
          </span>
        </button>
      </div>
    </div>
  );
};

export default QuickActionModal;
