import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  centered?: boolean;
  /** Small label above the title. */
  eyebrow?: string;
  /** Action buttons, aligned right on desktop and stacked below on mobile. */
  actions?: React.ReactNode;
}

/** Page title block used at the top of every logged-in page and auth form. */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  className = "",
  centered = true,
  eyebrow,
  actions,
}) => {
  return (
    <header
      className={cn(
        "flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        centered && "text-center sm:flex-col sm:items-center",
        className,
      )}
    >
      <div className={cn("min-w-0", centered ? "mx-auto" : "text-left")}>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
};

export default PageHeader;
