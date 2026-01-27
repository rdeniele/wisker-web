"use client";
import React, { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

const UpgradeIcon = () => (
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
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
    />
  </svg>
);

const LogoutIcon = () => (
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
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
    />
  </svg>
);

const navLinks = [
  { name: "Dashboard", icon: <DashboardIcon />, href: "/dashboard" },
  { name: "Subjects", icon: <SubjectsIcon />, href: "/subjects" },
  { name: "Upgrade", icon: <UpgradeIcon />, href: "/upgrade" },
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
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const firstName = user.user_metadata?.first_name;

        // Use only first name
        setUserName(firstName || "Student");

        // Set plan type - default to Free (you can fetch this from your database later)
        const plan = user.user_metadata?.subscription_plan || "Free";
        setUserPlan(`${plan} Plan`);
      }
    };

    fetchUser();
  }, []);

  // Clear loading state when navigation completes
  useEffect(() => {
    if (navigatingTo && pathname === navigatingTo) {
      setTimeout(() => setNavigatingTo(null), 0);
    }
  }, [navigatingTo, pathname]);

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile/tablet */}
      <aside className="hidden lg:flex group/sidebar sticky top-0 z-40 h-screen w-16 hover:w-56 bg-white flex-col py-6 px-2 hover:px-4 border-r border-gray-200 rounded-br-2xl transition-all duration-300 ease-in-out overflow-x-hidden">
        {/* Logo */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center justify-center gap-2 mb-4 transition-all duration-300 hover:opacity-80 cursor-pointer"
        >
          <Image
            src="/images/wisker_text_pic_logo.png"
            alt="Wisker Logo"
            width={140}
            height={32}
            className="h-8 w-auto group-hover/sidebar:block hidden"
            priority
          />
          <Image
            src="/images/wisker_text_pic_logo.png"
            alt="Wisker Logo Mini"
            width={32}
            height={32}
            className="h-8 w-8 group-hover/sidebar:hidden block"
            priority
          />
        </button>

        {/* User Info (moved to top) */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center transition-colors">
            <span className="text-2xl">🐾</span>
          </div>
          <div className="group-hover/sidebar:flex flex-col hidden">
            <div className="font-semibold text-gray-800 transition-colors truncate">
              {userName || "Loading..."}
            </div>
            <div className="text-xs text-gray-500 transition-colors truncate">
              {userPlan || "Free Plan"}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6 mx-1" />

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const isLoading = navigatingTo === link.href;

            return (
              <button
                key={link.name}
                onClick={() => {
                  if (!isActive) {
                    setNavigatingTo(link.href);
                    startTransition(() => {
                      router.push(link.href);
                    });
                  }
                }}
                disabled={isLoading}
                className={`flex items-center gap-3 px-2 py-2 rounded-lg font-medium transition-all duration-200 group/link text-left ${
                  isActive
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span className="w-6 h-6 shrink-0 transition-colors flex items-center justify-center">
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    link.icon
                  )}
                </span>
                <span className="ml-2 truncate group-hover/sidebar:inline-block hidden transition-all duration-200">
                  {link.name}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center gap-3 px-2 py-2 rounded-lg font-medium transition-all duration-200 group/link text-left w-full text-gray-700 hover:bg-red-50 hover:text-red-600 ${
              isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <span className="w-6 h-6 shrink-0 transition-colors flex items-center justify-center">
              {isLoggingOut ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <LogoutIcon />
              )}
            </span>
            <span className="ml-2 truncate group-hover/sidebar:inline-block hidden transition-all duration-200">
              Logout
            </span>
          </button>
        </div>
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
        className={`lg:hidden fixed top-0 left-0 z-50 h-screen w-64 bg-white flex flex-col py-6 px-4 border-r border-gray-200 rounded-br-2xl transform transition-transform duration-300 ease-in-out ${
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
        <button
          onClick={() => {
            router.push('/dashboard');
            setIsOpen(false);
          }}
          className="flex items-center justify-start gap-2 mb-4 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Image
            src="/images/wiskyer_icon_text.png"
            alt="Wisker Logo"
            width={140}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-2xl">🐾</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <div className="font-semibold text-gray-800 truncate">
              {userName || "Loading..."}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {userPlan || "Free Plan"}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6" />

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const isLoading = navigatingTo === link.href;

            return (
              <button
                key={link.name}
                onClick={() => {
                  if (!isActive) {
                    setNavigatingTo(link.href);
                    startTransition(() => {
                      router.push(link.href);
                      setIsOpen(false);
                    });
                  } else {
                    setIsOpen(false);
                  }
                }}
                disabled={isLoading}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 text-left ${
                  isActive
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span className="w-6 h-6 shrink-0 flex items-center justify-center">
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    link.icon
                  )}
                </span>
                <span className="ml-2">{link.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 text-left w-full text-gray-700 hover:bg-red-50 hover:text-red-600 ${
              isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <span className="w-6 h-6 shrink-0 flex items-center justify-center">
              {isLoggingOut ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <LogoutIcon />
              )}
            </span>
            <span className="ml-2">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
