"use client";
import Image from "next/image";
import { FaRegClone, FaQuestionCircle, FaRegLightbulb } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { subjects } from "@/lib/data/subjects";
import { useState, useTransition } from "react";
import CreateSubject from "./components/CreateSubject";
import UpdateSubject from "./components/UpdateSubject";
import OptionWidget from "@/components/ui/OptionWidget";

function SubjectsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [, setSelectedSubjectId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 font-fredoka">
          Subjects
        </h1>
      </div>

      {/* Subject Cards as Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="bg-white rounded-2xl shadow-md p-0 pb-4 relative overflow-hidden flex flex-col h-full hover:shadow-lg transition"
            style={{ boxShadow: "0 4px 0 #ececec" }}
          >
            {/* Card header */}
            <div className="flex items-start justify-between p-4 sm:p-6 pb-2 gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl sm:text-2xl font-extrabold text-gray-900 font-fredoka mb-1 wrap-break-word">
                  {subject.name}
                </div>
                <div className="text-gray-500 text-xs sm:text-sm font-medium">
                  {subject.notes} Notes created &bull; {subject.time}
                </div>
              </div>
              <Image
                src={subject.img}
                alt="cat reading"
                width={80}
                height={80}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain -mt-4 sm:-mt-6 -mr-1 sm:-mr-2 shrink-0"
                draggable={false}
              />
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                {openMenuId === String(subject.id) ? (
                  <OptionWidget
                    onView={() => {
                      setOpenMenuId(null);
                      router.push(`/subjects/${subject.id}`);
                    }}
                    onEdit={() => {
                      setOpenMenuId(null);
                      setSelectedSubjectId(subject.id);
                      setShowUpdateModal(true);
                    }}
                    onDelete={() => {
                      setOpenMenuId(null);
                      // Add delete logic here
                    }}
                  />
                ) : (
                  <button
                    className="text-2xl text-gray-400 bg-white rounded-full w-8 h-8 flex items-center justify-center border border-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(String(subject.id));
                    }}
                    aria-label="Options"
                    type="button"
                  >
                    &#8942;
                  </button>
                )}
              </div>
            </div>
            {/* Card actions */}
            <div className="flex flex-col xs:flex-row gap-2 px-3 sm:px-4 py-3 rounded-b-2xl mt-auto">
              <button
                className="flex-1 flex flex-col items-center justify-center text-white font-semibold py-2 sm:py-1.5 rounded-md shadow-lg hover:shadow-xl text-sm transition active:scale-95 gap-1 bg-[#6c63ff] hover:bg-[#574fd6] disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setNavigatingTo(`flashcard-${subject.id}`);
                  startTransition(() => {
                    router.push(`/subjects/${subject.id}/flashcard`);
                  });
                }}
                disabled={navigatingTo === `flashcard-${subject.id}`}
              >
                {navigatingTo === `flashcard-${subject.id}` ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <FaRegClone className="text-base" />
                )}
                <span className="text-xs">Flashcards</span>
              </button>
              <button
                className="flex-1 flex flex-col items-center justify-center text-white font-semibold py-2 sm:py-1.5 rounded-md shadow-lg hover:shadow-xl text-sm transition active:scale-95 gap-1 bg-[#6c63ff] hover:bg-[#574fd6] disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setNavigatingTo(`quiz-${subject.id}`);
                  startTransition(() => {
                    router.push(`/subjects/${subject.id}/quiz`);
                  });
                }}
                disabled={navigatingTo === `quiz-${subject.id}`}
              >
                {navigatingTo === `quiz-${subject.id}` ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <FaQuestionCircle className="text-base" />
                )}
                <span className="text-xs">Quiz me</span>
              </button>
              <button
                className="flex-1 flex flex-col items-center justify-center text-white font-semibold py-2 sm:py-1.5 rounded-md shadow-lg hover:shadow-xl text-sm transition active:scale-95 gap-1 bg-[#6c63ff] hover:bg-[#574fd6] disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setNavigatingTo(`summary-${subject.id}`);
                  startTransition(() => {
                    router.push(`/subjects/${subject.id}/summary`);
                  });
                }}
                disabled={navigatingTo === `summary-${subject.id}`}
              >
                {navigatingTo === `summary-${subject.id}` ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <FaRegLightbulb className="text-base" />
                )}
                <span className="text-xs">Summarize</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Subject Floating Button */}
      <button
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-orange-400 hover:bg-orange-500 text-white font-bold py-2 px-4 sm:py-3 sm:px-8 rounded-2xl shadow-lg flex items-center gap-2 text-base sm:text-lg z-50 transition active:scale-95"
        onClick={() => setShowModal(true)}
      >
        <span className="text-xl sm:text-2xl">+</span> 
        <span className="hidden xs:inline">Add Subject</span>
        <span className="inline xs:hidden">Add</span>
      </button>

      {/* Modal Overlay */}
      {showModal && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
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
          className="fixed inset-0 z-100 flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          onClick={() => {
            setShowUpdateModal(false);
            setSelectedSubjectId(null);
          }}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <UpdateSubject onClose={() => {
              setShowUpdateModal(false);
              setSelectedSubjectId(null);
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SubjectsPage;
