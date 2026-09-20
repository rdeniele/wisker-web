"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { LuEllipsisVertical } from "react-icons/lu";
import { cn } from "@/lib/utils";

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  tone?: "default" | "danger";
}

interface ActionMenuProps {
  /** Accessible name, e.g. "Options for Biology". */
  label: string;
  items: ActionMenuItem[];
  className?: string;
}

/**
 * Kebab menu. Fully keyboard operable (Arrow keys, Home/End, Esc, Tab closes)
 * and sized for touch: 44px trigger, 48px rows.
 */
export default function ActionMenu({ label, items, className }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    // Focus the first item so keyboard users land inside the menu.
    wrapRef.current
      ?.querySelector<HTMLElement>('[role="menuitem"]')
      ?.focus();
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    const nodes = Array.from(
      wrapRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      nodes[(i + 1) % nodes.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      nodes[(i - 1 + nodes.length) % nodes.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      nodes[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      nodes[nodes.length - 1]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="btn btn-icon h-11 w-11 text-gray-600"
      >
        <LuEllipsisVertical className="h-5 w-5" aria-hidden />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKey}
          className="animate-pop-in absolute right-0 top-full z-30 mt-1 w-48 origin-top-right rounded-2xl border border-line bg-white p-1.5 shadow-xl"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-bold transition-colors focus-visible:outline-offset-0",
                item.tone === "danger"
                  ? "text-red-700 hover:bg-red-50"
                  : "text-ink hover:bg-sand",
              )}
            >
              {item.icon && (
                <span className="text-gray-600" aria-hidden>
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
