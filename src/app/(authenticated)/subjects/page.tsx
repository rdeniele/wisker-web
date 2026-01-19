"use client";
import { useState, useTransition, useEffect } from "react";
import { IoBookSharp } from "react-icons/io5";
import CreateSubject from "./components/CreateSubject";
import UpdateSubject from "./components/UpdateSubject";
import SubjectCard from "./components/SubjectCard";

function SubjectsPage() {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // TODO: Fetch real subjects from backend
  const subjects: Array<{
    id: number;
    name: string;
    notes: number;
    time: string;
    img: string;
  }> = [];

  const handleNavigationStart = (id: string) => {
    setNavigatingTo(id);
    startTransition(() => {
      // Navigation will be handled by SubjectCard/SubjectActionButtons
      setNavigatingTo(null); // Reset after transition
    });
  };

  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Minimalistic Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            My Subjects
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'} to explore
          </p>
        </div>

        {/* Subject Cards Grid - More spacious */}
        {subjects.length === 0 ? (
          <div className="text-center py-20">
            <IoBookSharp className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-6">No subjects yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-2xl font-medium transition-colors"
            >
              Create your first subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                navigatingTo={navigatingTo}
                onNavigationStart={handleNavigationStart}
                onEdit={(id) => {
                  setSelectedSubjectId(id);
                  setShowUpdateModal(true);
                }}
                onDelete={(id) => {
                  // Add delete logic here
                  console.log("Delete subject", id);
                }}
              />
            ))}
          </div>
        )}

        {/* Minimalistic Floating Add Button */}
        <button
          className="fixed bottom-8 right-8 w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-full flex items-center justify-center text-2xl sm:text-3xl z-50 transition-all hover:scale-110 active:scale-95"
          onClick={() => setShowModal(true)}
          aria-label="Add Subject"
          style={{ boxShadow: "0 8px 0 0 rgba(139, 92, 246, 0.18)" }}
        >
          +
        </button>
      </div>

      {/* Modal Overlay - Cleaner backdrop */}
      {showModal && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <CreateSubject onClose={() => setShowModal(false)} />
          </div>
        </div>
      )}

      {/* Update Subject Modal Overlay */}
      {showUpdateModal && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => {
            setShowUpdateModal(false);
            setSelectedSubjectId(null);
          }}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <UpdateSubject 
              onClose={() => {
                setShowUpdateModal(false);
                setSelectedSubjectId(null);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SubjectsPage;
