"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import OptionWidget from "@/components/ui/OptionWidget";
import SubjectActionButtons from "./SubjectActionButtons";

interface Subject {
  id: string;
  name: string;
  notes: number;
  time: string;
  img: string;
}

interface SubjectCardProps {
  subject: Subject;
  navigatingTo: string | null;
  onNavigationStart: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function SubjectCard({
  subject,
  navigatingTo,
  onNavigationStart,
  onEdit,
  onDelete,
}: SubjectCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div
      className="group bg-white rounded-3xl p-5 border border-gray-100 hover:border-purple-200 transition-all duration-300 flex flex-col h-full cursor-pointer"
      style={{ boxShadow: "0 4px 0 #ececec" }}
      onClick={() => {
        onNavigationStart(subject.id);
        router.push(`/subjects/${subject.id}`);
      }}
    >
      {/* Header with image and menu */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
          <Image
            src={subject.img}
            alt={subject.name}
            width={32}
            height={32}
            className="object-contain"
            draggable={false}
          />
        </div>

        <div className="relative" ref={menuRef}>
          <button
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            aria-label="Options"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>

          {showMenu && (
            <OptionWidget
              onView={() => {
                router.push(`/subjects/${subject.id}`);
              }}
              onEdit={() => {
                onEdit(subject.id);
              }}
              onDelete={() => {
                onDelete(subject.id);
              }}
              onClose={() => setShowMenu(false)}
            />
          )}
        </div>
      </div>

      {/* Subject name and details */}
      <div className="flex-1 mb-3">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {subject.name}
        </h3>
        <p className="text-sm text-gray-500">
          {subject.notes} notes • {subject.time}
        </p>
      </div>

      {/* Action buttons */}
      <SubjectActionButtons
        subjectId={subject.id}
        navigatingTo={navigatingTo}
        onNavigationStart={onNavigationStart}
      />
    </div>
  );
}
