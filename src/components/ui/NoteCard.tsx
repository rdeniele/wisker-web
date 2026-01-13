"use client";
import { useState, useRef, useEffect } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiClock,
  FiCalendar,
  FiFileText,
} from "react-icons/fi";

interface NoteCardProps {
  id: number;
  title: string;
  createdAt?: Date | string;
  lastOpened?: Date | string;
  characterCount?: number;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  className?: string;
}

export default function NoteCard({
  id,
  title,
  createdAt,
  lastOpened,
  characterCount,
  onClick,
  onEdit,
  onDelete,
  onView,
  className = "",
}: NoteCardProps) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return null;
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  };

  const getTimeAgo = (date: Date | string | undefined) => {
    if (!date) return null;
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;

    const years = Math.floor(days / 365);
    return `${years} year${years !== 1 ? "s" : ""} ago`;
  };
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleMenuClick = (e: React.MouseEvent, action?: () => void) => {
    e.stopPropagation();
    setShowMenu(false);
    action?.();
  };

  return (
    <div
      key={id}
      className={`bg-white rounded-xl p-5 flex flex-col justify-between transition-all duration-300 border border-gray-100 hover:border-purple-200 cursor-pointer relative hover:scale-105 hover:-translate-y-1 ${className}`}
      onClick={onClick}
      style={{ boxShadow: '0 4px 0 #ececec' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-lg font-semibold font-fredoka text-gray-800 mb-1">
            {title}
          </div>
          <div className="flex flex-col gap-0.5">
            {characterCount !== undefined && (
              <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <FiFileText size={12} />
                <span>{characterCount.toLocaleString()} characters</span>
              </div>
            )}
            {lastOpened && (
              <div className="text-xs text-gray-600 font-medium flex items-center gap-1">
                <FiClock size={12} />
                <span>{getTimeAgo(lastOpened)}</span>
              </div>
            )}
            {createdAt && (
              <div className="text-xs text-gray-400 font-normal flex items-center gap-1">
                <FiCalendar size={12} />
                <span>{formatDate(createdAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Three dots menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-gray-100 rounded-full transition"
            aria-label="Options"
          >
            <BsThreeDotsVertical className="text-gray-600" size={18} />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
              {onView && (
                <button
                  onClick={(e) => handleMenuClick(e, onView)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FiEye size={16} />
                  View
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => handleMenuClick(e, onEdit)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FiEdit size={16} />
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => handleMenuClick(e, onDelete)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <FiTrash2 size={16} />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
