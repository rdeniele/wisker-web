"use client";
import Image from "next/image";
import { FaRegClone, FaQuestionCircle, FaRegLightbulb } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { subjects } from "@/lib/data/subjects";
import { useState } from "react";
import CreateSubject from "./components/CreateSubject";
import OptionWidget from "@/components/ui/OptionWidget";

function SubjectsPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 font-fredoka">
          Subjects
        </h1>
      </div>

      {/* Subject Cards as Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="bg-white rounded-2xl shadow-md p-0 pb-4 relative overflow-hidden flex flex-col h-full cursor-pointer hover:shadow-lg transition"
            style={{ boxShadow: "0 4px 0 #ececec" }}
            onClick={() => router.push(`/subjects/${subject.id}`)}
          >
            {/* Card header */}
            <div className="flex items-start justify-between p-6 pb-2">
              <div>
                <div className="text-2xl font-extrabold text-gray-900 font-fredoka mb-1">
                  {subject.name}
                </div>
                <div className="text-gray-500 text-sm font-medium">
                  {subject.notes} Notes created &bull; {subject.time}
                </div>
              </div>
              <Image
                src={subject.img}
                alt="cat reading"
                width={80}
                height={80}
                className="w-20 h-20 object-contain -mt-6 -mr-2"
                draggable={false}
              />
              <div className="absolute top-4 right-4">
                {openMenuId === String(subject.id) ? (
                  <OptionWidget
                    onView={() => {
                      setOpenMenuId(null);
                      router.push(`/subjects/${subject.id}`);
                    }}
                    onEdit={() => {
                      setOpenMenuId(null);
                      // Add edit logic here
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
            <div className="flex gap-2 px-4 py-3 rounded-b-2xl mt-auto">
              <button
                className="flex-1 flex flex-col items-center justify-center text-white font-semibold py-1.5 rounded-md shadow-lg hover:shadow-xl text-sm transition active:scale-95 gap-1 bg-[#6c63ff] hover:bg-[#574fd6]"
                onClick={(e) => e.stopPropagation()}
              >
                <FaRegClone className="text-base" />
                <span className="text-xs">Flashcards</span>
              </button>
              <button
                className="flex-1 flex flex-col items-center justify-center text-white font-semibold py-1.5 rounded-md shadow-lg hover:shadow-xl text-sm transition active:scale-95 gap-1 bg-[#6c63ff] hover:bg-[#574fd6]"
                onClick={(e) => e.stopPropagation()}
              >
                <FaQuestionCircle className="text-base" />
                <span className="text-xs">Quiz me</span>
              </button>
              <button
                className="flex-1 flex flex-col items-center justify-center text-white font-semibold py-1.5 rounded-md shadow-lg hover:shadow-xl text-sm transition active:scale-95 gap-1 bg-[#6c63ff] hover:bg-[#574fd6]"
                onClick={(e) => e.stopPropagation()}
              >
                <FaRegLightbulb className="text-base" />
                <span className="text-xs">Summarize</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Subject Floating Button */}
      <button
        className="fixed bottom-8 right-8 bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-2xl shadow-lg flex items-center gap-2 text-lg z-50 transition active:scale-95"
        onClick={() => setShowModal(true)}
      >
        <span className="text-2xl">+</span> Add Subject
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
    </div>
  );
}

export default SubjectsPage;
