import React from "react";
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

function Sidebar() {
  return (
    <aside className="group/sidebar sticky top-0 z-40 h-screen w-16 hover:w-56 bg-white flex flex-col py-6 px-2 hover:px-4 border-r border-gray-200 transition-all duration-300 ease-in-out overflow-x-hidden shadow-sm">
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
  );
}

export default Sidebar;
