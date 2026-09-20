"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LuEllipsis, LuLogOut, LuSearch } from "react-icons/lu";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/button";
import { SearchOverlay } from "./GlobalSearch";
import { NAV_ITEMS } from "./nav";

const tabBase =
  "flex h-full min-h-[56px] w-full flex-col items-center justify-center gap-1 rounded-2xl text-[12px] font-bold leading-none transition-colors";

function Pill({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "grid h-8 w-14 place-items-center rounded-full transition-colors duration-200",
        active ? "bg-orange-100 text-orange-700" : "text-gray-600",
      )}
    >
      {children}
    </span>
  );
}

/**
 * Phone / tablet navigation: four thumb-reachable tabs pinned to the bottom.
 * Home and Subjects are the daily drivers; Search and Menu open overlays so the
 * screen underneath never has to change.
 */
export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const primary = NAV_ITEMS.slice(0, 2);
  const secondary = NAV_ITEMS.slice(2);
  const firstName =
    (user?.user_metadata?.first_name as string | undefined) || "Student";

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setMoreOpen(false);
    router.push("/login");
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid h-[var(--bottom-nav-h)] max-w-xl grid-cols-4 gap-1 px-2 py-1.5">
          {primary.map((item) => {
            const active = item.isActive(pathname);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(tabBase, active ? "text-ink" : "text-gray-600")}
                >
                  <Pill active={active}>
                    <Icon className="h-6 w-6" aria-hidden />
                  </Pill>
                  {item.short}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-haspopup="dialog"
              className={cn(tabBase, "text-gray-600")}
            >
              <Pill active={false}>
                <LuSearch className="h-6 w-6" aria-hidden />
              </Pill>
              Search
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                tabBase,
                secondary.some((i) => i.isActive(pathname)) ? "text-ink" : "text-gray-600",
              )}
            >
              <Pill active={secondary.some((i) => i.isActive(pathname))}>
                <LuEllipsis className="h-6 w-6" aria-hidden />
              </Pill>
              More
            </button>
          </li>
        </ul>
      </nav>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <Modal
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Menu"
        size="sm"
      >
        <div className="flex items-center gap-3 rounded-2xl bg-sand p-3.5">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#fad9a8] bg-white font-display text-xl font-semibold text-orange-700"
            aria-hidden
          >
            {firstName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-ink">{firstName}</p>
            <p className="truncate text-sm font-semibold text-gray-600">
              {user?.email}
            </p>
          </div>
        </div>

        <ul className="mt-3 space-y-1">
          {secondary.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex min-h-[52px] items-center gap-3 rounded-2xl px-3 font-display text-lg font-medium text-ink hover:bg-sand"
                >
                  <Icon className="h-6 w-6 text-gray-600" aria-hidden />
                  {item.name}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl px-3 font-display text-lg font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {loggingOut ? (
                <Spinner className="h-6 w-6" />
              ) : (
                <LuLogOut className="h-6 w-6" aria-hidden />
              )}
              Log out
            </button>
          </li>
        </ul>

        <div className="mt-3 flex justify-center gap-5 border-t border-line pb-2 pt-4 text-sm font-bold text-gray-600">
          <Link href="/terms" className="underline-offset-4 hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="underline-offset-4 hover:underline">
            Privacy
          </Link>
        </div>
      </Modal>
    </>
  );
}
