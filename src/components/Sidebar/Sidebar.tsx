"use client";
import React, { useState } from "react";
import Image from "next/image";

// Example icons (Heroicons SVGs)
const DashboardIcon = () => (
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
      d="M3 13.5V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v6.75M3 13.5v3.75A2.25 2.25 0 005.25 19.5h13.5A2.25 2.25 0 0021 17.25V13.5M3 13.5h18"
    />
  </svg>
);

const SubjectsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    <rect
      x="4"
      y="4"
      width="16"
      height="16"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const navLinks = [
  { name: "Dashboard", icon: <DashboardIcon />, href: "/dashboard" },
  { name: "Subjects", icon: <SubjectsIcon />, href: "/subjects" },
];

const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile/tablet */}
      <aside className="hidden lg:flex group/sidebar sticky top-0 z-40 h-screen w-16 hover:w-56 bg-white flex-col py-6 px-2 hover:px-4 border-r border-gray-200 transition-all duration-300 ease-in-out overflow-x-hidden shadow-sm">
      {/* Logo */}
      <div className="flex items-center justify-center group-hover/sidebar:justify-start gap-2 mb-4 transition-all duration-300">
        <Image
          src="/images/wiskyer_icon_text.png"
          alt="Wisker Logo"
          width={140}
          height={32}
          className="h-8 w-auto group-hover/sidebar:block hidden"
          priority
        />
        <Image
          src="/images/wiskyer_icon_text.png"
          alt="Wisker Logo Mini"
          width={32}
          height={32}
          className="h-8 w-8 group-hover/sidebar:hidden block"
          priority
        />
      </div>

      {/* User Info (moved to top) */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center transition-colors">
          <span className="text-2xl">🐾</span>
        </div>
        <div className="group-hover/sidebar:flex flex-col hidden">
          <div className="font-semibold text-gray-800 transition-colors">
            Student
          </div>
          <div className="text-xs text-gray-500 transition-colors">
            Wisker User
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 mb-6 mx-1" />

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {navLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            className="flex items-center gap-3 px-2 py-2 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-medium transition-all duration-200 group/link"
          >
            <span className="w-6 h-6 shrink-0 transition-colors">{link.icon}</span>
            <span className="ml-2 truncate group-hover/sidebar:inline-block hidden transition-all duration-200">
              {link.name}
            </span>
          </a>
        ))}
      </nav>
    </aside>

      {/* Mobile/Tablet FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-50 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95"
        aria-label="Open menu"
      >
        <MenuIcon />
      </button>

      {/* Mobile/Tablet Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile/Tablet Sidebar Drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-screen w-64 bg-white flex flex-col py-6 px-4 border-r border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <CloseIcon />
        </button>

        {/* Logo */}
        <div className="flex items-center justify-start gap-2 mb-4">
          <Image
            src="/images/wiskyer_icon_text.png"
            alt="Wisker Logo"
            width={140}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-2xl">🐾</span>
          </div>
          <div className="flex flex-col">
            <div className="font-semibold text-gray-800">Student</div>
            <div className="text-xs text-gray-500">Wisker User</div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6" />

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-medium transition-all duration-200"
            >
              <span className="w-6 h-6 shrink-0">{link.icon}</span>
              <span className="ml-2">{link.name}</span>
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
