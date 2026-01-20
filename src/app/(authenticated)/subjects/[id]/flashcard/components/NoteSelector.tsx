"use client";
import { useState } from "react";
import { FiArrowLeft, FiCheckSquare, FiSquare, FiLayers } from "react-icons/fi";

interface Note {
  id: string;
  title: string;
  rawContent: string;
}

interface NoteSelectorProps {
  subjectName: string;
  notes: Note[];
  onNotesSelected: (noteIds: string[]) => void;
  onBack: () => void;
}

export default function NoteSelector({
  subjectName,
  notes,
  onNotesSelected,
  onBack,
}: NoteSelectorProps) {
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());

  const toggleNote = (noteId: string) => {
    const newSelected = new Set(selectedNotes);
    if (newSelected.has(noteId)) {
      newSelected.delete(noteId);
    } else {
      newSelected.add(noteId);
    }
    setSelectedNotes(newSelected);
  };

  const toggleAll = () => {
    if (selectedNotes.size === notes.length) {
      setSelectedNotes(new Set());
    } else {
      setSelectedNotes(new Set(notes.map((n) => n.id)));
    }
  };

  const handleContinue = () => {
    if (selectedNotes.size > 0) {
      onNotesSelected(Array.from(selectedNotes));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group mb-6"
        >
          <FiArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="font-medium">Back to Subject</span>
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
              <FiLayers className="text-purple-600" size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Select Notes
            </h1>
            <p className="text-gray-600">
              Choose notes from{" "}
              <span className="font-semibold">{subjectName}</span> to include in
              your flashcards
            </p>
          </div>

          {/* Select All */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <button
              onClick={toggleAll}
              className="flex items-center gap-3 text-purple-600 hover:text-purple-700 font-semibold transition"
            >
              {selectedNotes.size === notes.length ? (
                <FiCheckSquare
                  size={20}
                  className="text-purple-600"
                  aria-checked="true"
                  role="checkbox"
                />
              ) : (
                <FiSquare
                  size={20}
                  className="text-gray-400"
                  aria-checked="false"
                  role="checkbox"
                />
              )}
              <span>
                {selectedNotes.size === notes.length
                  ? "Deselect All"
                  : "Select All"}
              </span>
            </button>
          </div>

          {/* Notes List */}
          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
            {notes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No notes available. Create some notes first!
              </div>
            ) : (
              notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => toggleNote(note.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedNotes.has(note.id)
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {selectedNotes.has(note.id) ? (
                        <FiCheckSquare
                          className="text-purple-600"
                          size={20}
                          aria-checked="true"
                          role="checkbox"
                        />
                      ) : (
                        <FiSquare
                          className="text-gray-400"
                          size={20}
                          aria-checked="false"
                          role="checkbox"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {note.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {note.rawContent.length} characters
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={selectedNotes.size === 0}
            className="w-full py-4 bg-[#615FFF] text-white rounded-xl hover:bg-[#524CE5] transition font-bold text-lg shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with {selectedNotes.size} note
            {selectedNotes.size !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
