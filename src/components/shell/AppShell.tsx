"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import NavBar from "@/components/Navbar/NavBar";
import MobileNav from "./MobileNav";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "wisker:sidebar";

/**
 * The logged-in frame.
 *   lg+   : collapsible sidebar · top bar · content
 *   < lg  : brand header · content · bottom tab bar
 * The shell owns the page gutter and max width, so pages should not add an
 * outer padding of their own.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      // Read after mount so server and first client render agree.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(STORAGE_KEY) === "collapsed") setCollapsed(true);
    } catch {
      /* storage unavailable: default to expanded */
    }
  }, []);

  const toggle = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded");
      } catch {
        /* ignore */
      }
      return next;
    });

  return (
    <div className="min-h-dvh bg-cream">
      <a
        href="#main"
        className="btn btn-primary btn-sm sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]"
      >
        Skip to content
      </a>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div
        className={cn(
          "flex min-h-dvh min-w-0 flex-col transition-[padding] duration-300 ease-out",
          collapsed ? "lg:pl-[var(--sidebar-w-collapsed)]" : "lg:pl-[var(--sidebar-w)]",
        )}
      >
        <NavBar />
        <main
          id="main"
          className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom,0px)+28px)] pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-14 lg:pt-8"
        >
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
