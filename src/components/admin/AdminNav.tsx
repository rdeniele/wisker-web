"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", match: (p: string) => p === "/admin" },
  { href: "/admin/users", label: "Users", match: (p: string) => p.startsWith("/admin/users") },
  { href: "/admin/feedback", label: "Feedback", match: (p: string) => p.startsWith("/admin/feedback") },
  { href: "/admin/plans", label: "Plans", match: (p: string) => p.startsWith("/admin/plans") },
  { href: "/admin/promo-codes", label: "Promo codes", match: (p: string) => p.startsWith("/admin/promo-codes") },
  { href: "/admin/audit", label: "Audit log", match: (p: string) => p.startsWith("/admin/audit") },
];

/** Section switcher shared by every admin page. Scrolls inside itself on narrow screens. */
export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="-mx-1 overflow-x-auto px-1 pb-1 scrollbar-none">
      <ul className="flex w-max min-w-full gap-1 rounded-2xl border border-line bg-white p-1">
        {LINKS.map((l) => {
          const on = l.match(pathname);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center whitespace-nowrap rounded-xl px-3.5 text-sm font-bold transition-colors",
                  on ? "bg-orange-500 text-ink" : "text-gray-600 hover:bg-sand hover:text-ink",
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
