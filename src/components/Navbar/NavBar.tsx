"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CreditsDisplay } from "../ui/CreditsDisplay";

// Icons
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
);

const BellIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
    />
  </svg>
);

const BookIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
    />
  </svg>
);

const DocumentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

interface SearchResult {
  id: string;
  title: string;
  type: "subject" | "note";
  subjectName?: string;
  lastAccessed?: string;
}

interface Notification {
  id: string;
  type: string;
  subjectName: string;
  createdAt: string;
}

interface LearningToolResponse {
  id: string;
  type: string;
  createdAt: string;
  subject?: {
    title: string;
  };
  note?: {
    title: string;
  };
}

function NavBar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    const fetchNotifications = async () => {
      if (showNotifications && notifications.length === 0) {
        setIsLoadingNotifications(true);
        try {
          const response = await fetch("/api/learning-tools?pageSize=5");
          const result = await response.json();
          if (response.ok && result.data?.learningTools) {
            const recentTools = result.data.learningTools.map(
              (tool: LearningToolResponse) => ({
                id: tool.id,
                type: tool.type,
                subjectName:
                  tool.subject?.title || tool.note?.title || "Unknown",
                createdAt: tool.createdAt,
              }),
            );
            setNotifications(recentTools);
          }
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
        } finally {
          setIsLoadingNotifications(false);
        }
      }
    };

    fetchNotifications();
  }, [showNotifications, notifications.length]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.results || []);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "subject") {
      router.push(`/subjects/${result.id}`);
    } else {
      router.push(`/subjects/${result.id}/notes`);
    }
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-6 py-3 bg-white border-b border-gray-200 shadow-sm lg:pl-20">
      {/* Left: Search */}
      <div className="flex-1 flex items-center gap-2 min-w-0" ref={searchRef}>
        {isSearchOpen ? (
          <div className="w-full max-w-md md:max-w-2xl">
            <div className="relative">
              <div className="flex items-center w-full bg-white rounded-lg border-2 border-orange-500 px-4 py-2.5">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search subjects, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 ml-3 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {(searchResults.length > 0 || isSearching) && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg border border-gray-200 shadow-lg max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">
                      Searching...
                    </div>
                  ) : (
                    <div className="py-2">
                      {searchResults.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className="w-full px-4 py-3 hover:bg-gray-50 flex items-start gap-3 text-left transition-colors"
                        >
                          <div className="mt-1 text-gray-400">
                            {result.type === "subject" ? (
                              <BookIcon />
                            ) : (
                              <DocumentIcon />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {result.title}
                            </div>
                            {result.subjectName && (
                              <div className="text-sm text-gray-500 truncate">
                                {result.subjectName}
                              </div>
                            )}
                            {result.lastAccessed && (
                              <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <ClockIcon />
                                {result.lastAccessed}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            aria-label="Open search"
          >
            <SearchIcon />
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div
        className={`flex items-center gap-2 md:gap-4 ml-2 transition-all duration-300 ${isSearchOpen ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"}`}
      >
        <CreditsDisplay />

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900 relative"
            aria-label="Notifications"
          >
            <BellIcon />
            <span className="absolute top-1.5 right-1.5 block w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-gray-200 shadow-lg">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {isLoadingNotifications ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Loading...
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        router.push(`/learning-tools`);
                        setShowNotifications(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          {notification.type === "QUIZ" && "📝"}
                          {notification.type === "FLASHCARD" && "🗂️"}
                          {notification.type === "SUMMARY" && "📄"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            New {notification.type.toLowerCase()} created
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {notification.subjectName}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(
                              notification.createdAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
