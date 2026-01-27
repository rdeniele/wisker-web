"use client";
import React, { useState } from "react";

import SearchBar from "../ui/SearchBar";
import { CreditsDisplay } from "../ui/CreditsDisplay";

// Heroicons SVGs (free, MIT)
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6 text-gray-700"
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
    className="w-6 h-6 text-gray-700"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

function NavBar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 py-3 bg-white border-b border-gray-200 transition-colors">
      {/* Left: SearchBar that expands when clicked */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {isSearchOpen ? (
          <>
            <div className="w-full max-w-md md:max-w-2xl transition-all duration-300">
              <SearchBar />
            </div>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open search"
          >
            <SearchIcon />
          </button>
        )}
      </div>

      {/* Right: Credits and Notification - slide when search opens */}
      <div
        className={`flex items-center gap-3 md:gap-4 ml-2 md:ml-4 transition-all duration-300 ${isSearchOpen ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"}`}
      >
        <CreditsDisplay />
        <div className="flex items-center gap-4">
          <div className="relative">
            <BellIcon />
            <span className="absolute top-0 right-0 block w-2 h-2 bg-red-500 rounded-full"></span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
