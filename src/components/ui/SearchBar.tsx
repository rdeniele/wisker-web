import React from 'react';

function SearchBar() {
  return (
    <div className="flex items-center w-full max-w-xl bg-white rounded-full shadow-sm border border-gray-200 px-4 py-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5 text-gray-400 mr-2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
        />
      </svg>
      <input
        type="text"
        placeholder="Find some study materials"
        className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-base"
        style={{ fontFamily: 'Fredoka, Arial, sans-serif' }}
      />
    </div>
  );
}

export default SearchBar;