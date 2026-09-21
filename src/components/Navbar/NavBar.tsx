"use client";
import React from "react";
import Link from "next/link";
import { CreditsDisplay } from "../ui/CreditsDisplay";
import { SearchField } from "../shell/GlobalSearch";
import NotificationsMenu from "../shell/NotificationsMenu";
import Logo from "../ui/Logo";

/**
 * Top bar of the logged-in app.
 *  - lg+: persistent search field, credits, activity.
 *  - below lg: compact brand header. Search is a tab in the bottom navigation.
 */
function NavBar() {
  return (
    <>
      {/* Desktop */}
      <header className="sticky top-0 z-40 hidden h-[var(--topbar-h)] items-center gap-4 border-b border-line bg-cream/85 px-8 backdrop-blur-md lg:flex">
        <SearchField className="w-full max-w-xl" />
        <div className="ml-auto flex items-center gap-3">
          <CreditsDisplay />
          <NotificationsMenu />
        </div>
      </header>

      {/* Mobile / tablet */}
      <header className="pt-safe sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur-md lg:hidden">
        <div className="flex h-[var(--mobile-header-h)] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/dashboard" aria-label="Wisker home" className="shrink-0 rounded-xl">
            <Logo size={34} />
          </Link>
          <div className="flex items-center gap-2">
            <CreditsDisplay compact />
            <NotificationsMenu />
          </div>
        </div>
      </header>
    </>
  );
}

export default NavBar;
