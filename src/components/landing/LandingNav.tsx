"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LuMenu, LuX } from "react-icons/lu";
import { useAuth } from "@/lib/AuthContext";
import { buttonClasses } from "@/components/ui/button";
import Logo from "@/components/ui/Logo";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#tools", label: "Study tools" },
  { href: "#recall", label: "Why it works" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingNav() {
  const { isSignedIn, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#f2e7d8] bg-cream/90 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-[1180px] items-center gap-4 px-5 py-3 sm:px-6 md:gap-8"
      >
        <Link href="/" aria-label="Wisker home" className="shrink-0 rounded-xl">
          <Logo size={38} />
        </Link>

        <ul className="ml-auto hidden items-center gap-7 text-[15px] font-bold text-gray-600 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-lg py-2 transition-colors hover:text-ink"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          {isSignedIn ? (
            <>
              <button
                type="button"
                onClick={logout}
                className={buttonClasses({ variant: "ghost", size: "sm" })}
              >
                Log out
              </button>
              <Link
                href="/dashboard"
                className={buttonClasses({ size: "sm" })}
              >
                Open Wisker
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonClasses({ variant: "ghost", size: "sm" })}
              >
                Log in
              </Link>
              <Link href="/signup" className={buttonClasses({ size: "sm" })}>
                Start free
              </Link>
            </>
          )}
        </div>

        {/* Mobile actions */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          {!isSignedIn && (
            <Link href="/signup" className={buttonClasses({ size: "sm" })}>
              Start free
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="landing-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="btn btn-icon h-11 w-11 rounded-full border border-line bg-white"
          >
            {open ? (
              <LuX className="h-6 w-6" aria-hidden />
            ) : (
              <LuMenu className="h-6 w-6" aria-hidden />
            )}
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="landing-menu"
          className="animate-fade-in border-t border-[#f2e7d8] bg-cream px-5 pb-6 pt-3 md:hidden"
        >
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[52px] items-center rounded-2xl px-3 font-display text-lg font-medium text-ink hover:bg-sand"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-3">
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={buttonClasses({ fullWidth: true })}
                >
                  Open Wisker
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className={buttonClasses({ variant: "secondary", fullWidth: true })}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className={buttonClasses({ variant: "secondary", fullWidth: true })}
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
