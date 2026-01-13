import React, { useState, useRef, useEffect } from "react";

interface OptionWidgetProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function OptionWidget({ onView, onEdit, onDelete }: OptionWidgetProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none transition-colors"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Options"
        type="button"
      >
        <svg
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="text-gray-600"
        >
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <button
            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            onClick={() => {
              setOpen(false);
              onView && onView();
            }}
            type="button"
          >
            View
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            onClick={() => {
              setOpen(false);
              onEdit && onEdit();
            }}
            type="button"
          >
            Edit
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
            onClick={() => {
              setOpen(false);
              onDelete && onDelete();
            }}
            type="button"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default OptionWidget;
