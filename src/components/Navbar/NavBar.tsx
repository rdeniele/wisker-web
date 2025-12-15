import React from 'react';

import SearchBar from '../ui/SearchBar';

// Heroicons SVGs (free, MIT)
const FireIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 9.75c0-3.75-4.5-7.5-4.5-7.5s-4.5 3.75-4.5 7.5a4.5 4.5 0 009 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22.5a6 6 0 006-6c0-2.25-1.5-4.5-6-9-4.5 4.5-6 6.75-6 9a6 6 0 006 6z" />
  </svg>
);

const PawIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-400">
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <circle cx="6" cy="8" r="2" fill="currentColor" />
    <circle cx="18" cy="8" r="2" fill="currentColor" />
    <circle cx="8" cy="18" r="2" fill="currentColor" />
    <circle cx="16" cy="18" r="2" fill="currentColor" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);


interface NavBarProps {
  metrics?: {
    fireCount?: number;
    pawCount?: number;
  };
  profile?: {
    avatarUrl?: string;
    displayName?: string;
    // Add more profile fields as needed
  };
}

function NavBar({ metrics }: NavBarProps) {
  // Default metrics for demo
  const fireCount = metrics?.fireCount ?? 7;
  const pawCount = metrics?.pawCount ?? 20000;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900">
      {/* Left: Wide SearchBar */}
      <div className="flex-1 flex items-center">
        <div className="w-full max-w-2xl">
          <SearchBar />
        </div>
      </div>

      {/* Right: Metrics and Notification */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <FireIcon />
            <span className="font-semibold text-orange-500">{fireCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <PawIcon />
            <span className="font-semibold text-orange-400">{pawCount.toLocaleString()}</span>
          </div>
        </div>
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