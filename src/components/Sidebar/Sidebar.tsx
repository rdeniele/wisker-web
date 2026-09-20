"use client";
import React, { useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LuChevronDown,
  LuFileText,
  LuLogOut,
  LuPanelLeftClose,
  LuPanelLeftOpen,
} from "react-icons/lu";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import Logo from "@/components/ui/Logo";
import Tooltip from "@/components/ui/Tooltip";
import Skeleton from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/button";
import { NAV_ITEMS, type NavItem } from "@/components/shell/nav";

interface SidebarSubject {
  id: string;
  title: string;
  notes: Array<{ id: string; title: string }>;
}

/** Shows a spinner in the link while its route is loading. Must sit inside <Link>. */
function PendingSpinner() {
  const { pending } = useLinkStatus();
  return pending ? (
    <Spinner className="absolute right-3 h-4 w-4 text-orange-600" />
  ) : null;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Persistent desktop navigation (lg and up). Collapses to an icon rail; the
 * preference is remembered by the shell. Below lg the bottom navigation takes over.
 */
function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const [subjects, setSubjects] = useState<SidebarSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);

  const firstName =
    (user?.user_metadata?.first_name as string | undefined) || "Student";
  const initial = firstName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push("/login");
  };

  // Load the nested subject list the first time it is expanded.
  useEffect(() => {
    if (!subjectsOpen || subjectsLoaded || loadingSubjects) return;
    let cancelled = false;
    (async () => {
      setLoadingSubjects(true);
      try {
        const response = await fetch("/api/subjects");
        if (response.ok) {
          const data = await response.json();
          const list = data.data?.subjects || data.data || [];
          if (!cancelled) setSubjects(list);
        }
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      } finally {
        if (!cancelled) {
          setLoadingSubjects(false);
          setSubjectsLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectsOpen, subjectsLoaded, loadingSubjects]);

  const renderItem = (item: NavItem) => {
    const active = item.isActive(pathname);
    const Icon = item.icon;
    const isSubjects = item.href === "/subjects";

    const link = (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        aria-label={collapsed ? item.name : undefined}
        className={cn(
          "relative flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl px-3.5 font-display text-base font-medium transition-colors",
          collapsed && "justify-center px-0",
          active
            ? "bg-orange-100 text-ink shadow-[0_3px_0_#f6d3a4]"
            : "text-gray-600 hover:bg-sand hover:text-ink",
        )}
      >
        <Icon
          className={cn("h-6 w-6 shrink-0", active && "text-orange-700")}
          aria-hidden
        />
        {!collapsed && <span className="truncate">{item.name}</span>}
        {!collapsed && <PendingSpinner />}
      </Link>
    );

    return (
      <li key={item.href}>
        <div className="flex items-center gap-1">
          {collapsed ? (
            <Tooltip label={item.name} className="w-full">
              {link}
            </Tooltip>
          ) : (
            link
          )}
          {isSubjects && !collapsed && (
            <button
              type="button"
              onClick={() => setSubjectsOpen((v) => !v)}
              aria-expanded={subjectsOpen}
              aria-controls="sidebar-subjects"
              aria-label={subjectsOpen ? "Hide subject list" : "Show subject list"}
              className="btn btn-icon h-10 min-h-0 w-10 min-w-0 shrink-0 text-gray-500"
            >
              <LuChevronDown
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  subjectsOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
          )}
        </div>

        {isSubjects && !collapsed && subjectsOpen && (
          <div id="sidebar-subjects" className="mb-1 ml-5 mt-1 border-l-2 border-line pl-3">
            {loadingSubjects ? (
              <div className="space-y-2 py-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-4/5" />
              </div>
            ) : subjects.length === 0 ? (
              <p className="px-2 py-2 text-sm font-semibold text-gray-500">
                No subjects yet
              </p>
            ) : (
              <ul className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
                {subjects.map((subject) => (
                  <li key={subject.id}>
                    <Link
                      href={`/subjects/${subject.id}`}
                      className={cn(
                        "flex min-h-9 items-center rounded-xl px-2.5 py-1.5 text-[15px] font-bold transition-colors hover:bg-sand",
                        pathname === `/subjects/${subject.id}`
                          ? "text-orange-700"
                          : "text-gray-700",
                      )}
                    >
                      <span className="truncate">{subject.title}</span>
                    </Link>
                    {subject.notes?.length > 0 && (
                      <ul className="ml-2 space-y-0.5">
                        {subject.notes.map((note) => (
                          <li key={note.id}>
                            <Link
                              href={`/subjects/${subject.id}?noteId=${note.id}`}
                              className="flex min-h-8 items-center gap-2 rounded-lg px-2.5 py-1 text-sm font-semibold text-gray-600 hover:bg-sand hover:text-ink"
                            >
                              <LuFileText className="h-4 w-4 shrink-0" aria-hidden />
                              <span className="truncate">{note.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </li>
    );
  };

  const logoutButton = (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      aria-label={collapsed ? "Log out" : undefined}
      className={cn(
        "flex h-12 w-full items-center gap-3 rounded-2xl px-3.5 font-display text-base font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-60",
        collapsed && "justify-center px-0",
      )}
    >
      {isLoggingOut ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <LuLogOut className="h-6 w-6 shrink-0" aria-hidden />
      )}
      {!collapsed && <span>Log out</span>}
    </button>
  );

  return (
    <aside
      aria-label="Sidebar"
      className={cn(
        "fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-line bg-white transition-[width] duration-300 ease-out lg:flex",
        collapsed ? "w-[var(--sidebar-w-collapsed)]" : "w-[var(--sidebar-w)]",
      )}
    >
      {/* Brand + collapse */}
      <div
        className={cn(
          "flex h-[var(--topbar-h)] shrink-0 items-center border-b border-line px-5",
          collapsed ? "justify-center px-0" : "justify-between",
        )}
      >
        <Link
          href="/dashboard"
          aria-label="Wisker dashboard"
          className="rounded-xl"
        >
          <Logo variant={collapsed ? "mark" : "full"} size={collapsed ? 34 : 36} />
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="btn btn-icon h-10 min-h-0 w-10 min-w-0 text-gray-500"
          >
            <LuPanelLeftClose className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center pt-3">
          <Tooltip label="Expand sidebar">
            <button
              type="button"
              onClick={onToggle}
              aria-label="Expand sidebar"
              className="btn btn-icon h-11 w-11 text-gray-500"
            >
              <LuPanelLeftOpen className="h-5 w-5" aria-hidden />
            </button>
          </Tooltip>
        </div>
      )}

      {/* Primary navigation */}
      <nav
        aria-label="Primary"
        className={cn("min-h-0 flex-1 overflow-y-auto px-3.5 py-5", collapsed && "px-3")}
      >
        {!collapsed && (
          <p className="eyebrow mb-2 px-3.5 text-[12px] text-gray-500">Study</p>
        )}
        <ul className="space-y-1.5">{NAV_ITEMS.map(renderItem)}</ul>
      </nav>

      {/* Account */}
      <div className={cn("shrink-0 space-y-2 border-t border-line p-3.5", collapsed && "p-3")}>
        {!collapsed && (
          <div className="flex items-center gap-3 rounded-2xl bg-sand p-3">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#fad9a8] bg-white font-display text-lg font-semibold text-orange-700"
              aria-hidden
            >
              {authLoading ? "" : initial}
            </span>
            <div className="min-w-0">
              {authLoading ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <>
                  <p className="truncate font-bold leading-tight text-ink">
                    {firstName}
                  </p>
                  <p className="truncate text-[13px] font-semibold text-gray-600">
                    {user?.email}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
        {collapsed ? (
          <Tooltip label="Log out" className="w-full">
            {logoutButton}
          </Tooltip>
        ) : (
          logoutButton
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
