import React from "react";

interface OptionWidgetProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
}

function OptionWidget({
  onView,
  onEdit,
  onDelete,
  onClose,
}: OptionWidgetProps) {
  return (
    <div className="absolute right-0 top-10 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
      <div className="py-1">
        <button
          className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          onClick={() => {
            onView?.();
            onClose?.();
          }}
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          View
        </button>
        <button
          className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          onClick={() => {
            onEdit?.();
            onClose?.();
          }}
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit
        </button>
        <hr className="my-1 border-gray-200" />
        <button
          className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors font-medium"
          onClick={() => {
            onDelete?.();
            onClose?.();
          }}
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}

export default OptionWidget;
