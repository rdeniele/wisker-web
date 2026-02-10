"use client";
import React, { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QuickNoteCreator from "@/components/ui/QuickNoteCreator";

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

const NoteIcon = () => (
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

const navLinks = [
  { name: "Dashboard", icon: <DashboardIcon />, href: "/dashboard" },
  { name: "Subjects", icon: <SubjectsIcon />, href: "/subjects" },
  { name: "Notes", icon: <NoteIcon />, href: "/notes" },
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
  const [showQuickNote, setShowQuickNote] = useState(false);

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

        // Fetch user's subscription plan from the same endpoint as navbar
        try {
          const response = await fetch("/api/subscription/status");
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              const subData = data.data;

              // Format plan type (FREE -> Free, PRO -> Pro, PREMIUM -> Premium)
              const planType = subData.planType || "FREE";
              const formattedPlan =
                planType.charAt(0) + planType.slice(1).toLowerCase();

              // Check if subscription is active
              const isActive =
                subData.isActive && subData.subscriptionStatus === "active";
              const planLabel = isActive
                ? `${formattedPlan} (Active)`
                : formattedPlan;

              setUserPlan(`${planLabel} Plan`);
            } else {
              setUserPlan("Free Plan");
            }
          } else {
            // Fallback to Free plan if API call fails
            setUserPlan("Free Plan");
          }
        } catch (error) {
          console.error("Failed to fetch user plan:", error);
          setUserPlan("Free Plan");
        }
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
      <aside
        className="hidden lg:flex group/sidebar fixed top-0 left-0 z-50 h-screen w-16 hover:w-56 bg-white flex-col py-6 px-2 hover:px-4 border-r border-gray-200 rounded-br-2xl transition-all duration-300 ease-in-out overflow-x-hidden overflow-y-auto"
      >
        {/* Logo */}
        <button
          onClick={() => router.push("/dashboard")}
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
              {userPlan || "Loading..."}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1">
          <ul className="space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const isNavigating = navigatingTo === link.href;

              return (
                <li key={link.name}>
                  <button
                    onClick={() => {
                      setNavigatingTo(link.href);
                      startTransition(() => {
                        router.push(link.href);
                      });
                    }}
                    disabled={isNavigating}
                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all ${
                      isActive
                        ? "bg-linear-to-r from-purple-500 to-pink-500 text-white"
                        : isNavigating
                        ? "bg-gray-100 text-gray-400"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className={isNavigating ? "opacity-50" : ""}>
                      {link.icon}
                    </span>
                    <span
                      className={`group-hover/sidebar:block hidden ${
                        isNavigating ? "opacity-50" : ""
                      }`}
                    >
                      {link.name}
                    </span>
                    {isNavigating && (
                      <span className="ml-auto">
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick Note Button */}
        <button
          onClick={() => setShowQuickNote(true)}
          className="flex items-center gap-3 w-full px-3 py-2 mt-4 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <NoteIcon />
          <span className="group-hover/sidebar:block hidden">Quick Note</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 w-full px-3 py-2 mt-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          <LogoutIcon />
          <span className="group-hover/sidebar:block hidden">
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.push("/dashboard")}>
          <Image
            src="/images/wisker_text_pic_logo.png"
            alt="Wisker Logo"
            width={120}
            height={28}
            className="h-7 w-auto"
            priority
          />
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </header>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        >
          <aside
            className="absolute top-16 left-0 right-0 bottom-0 bg-white overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* User Info */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-3xl">🐾</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    {userName || "Loading..."}
                  </div>
                  <div className="text-sm text-gray-500">
                    {userPlan || "Loading..."}
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav>
                <ul className="space-y-2">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    const isNavigating = navigatingTo === link.href;

                    return (
                      <li key={link.name}>
                        <button
                          onClick={() => {
                            setNavigatingTo(link.href);
                            setIsOpen(false);
                            startTransition(() => {
                              router.push(link.href);
                            });
                          }}
                          disabled={isNavigating}
                          className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all ${
                            isActive
                              ? "bg-linear-to-r from-purple-500 to-pink-500 text-white"
                              : isNavigating
                              ? "bg-gray-100 text-gray-400"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <span className={isNavigating ? "opacity-50" : ""}>
                            {link.icon}
                          </span>
                          <span className={isNavigating ? "opacity-50" : ""}>
                            {link.name}
                          </span>
                          {isNavigating && (
                            <span className="ml-auto">
                              <svg
                                className="animate-spin h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Quick Note Button */}
              <button
                onClick={() => {
                  setShowQuickNote(true);
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 mt-4 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <NoteIcon />
                <span>Quick Note</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-3 w-full px-4 py-3 mt-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <LogoutIcon />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Quick Note Creator Modal */}
      {showQuickNote && (
        <QuickNoteCreator onClose={() => setShowQuickNote(false)} />
      )}
    </>
  );
}

export default Sidebar;
