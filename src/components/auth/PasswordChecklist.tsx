"use client";

import { useMemo } from "react";
import { LuCheck, LuCircle } from "react-icons/lu";
import { cn } from "@/lib/utils";

export interface PasswordRequirement {
  id: string;
  text: string;
  met: boolean;
}

/** The password rules, evaluated live. Shared by sign-up and password reset. */
export function usePasswordRequirements(password: string) {
  return useMemo<PasswordRequirement[]>(
    () => [
      {
        id: "length",
        text: "At least 7 characters",
        met: password.length >= 7,
      },
      {
        id: "numberSpecial",
        text: "At least 1 numbers and special character",
        met: /(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password),
      },
      {
        id: "uppercase",
        text: "At least 1 uppercase character",
        met: /[A-Z]/.test(password),
      },
    ],
    [password],
  );
}

/** Requirement list; render it once the user has started typing. */
export default function PasswordChecklist({
  requirements,
}: {
  requirements: PasswordRequirement[];
}) {
  return (
    <ul
      aria-label="Password requirements"
      className="animate-fade-up space-y-2 rounded-2xl bg-sand p-4"
    >
      {requirements.map((requirement) => (
        <li
          key={requirement.id}
          className="flex items-center gap-2.5 text-[15px] font-semibold"
        >
          {requirement.met ? (
            <LuCheck
              className="h-5 w-5 shrink-0 text-green-600"
              strokeWidth={3}
              aria-label="Met"
            />
          ) : (
            <LuCircle
              className="h-5 w-5 shrink-0 text-gray-500"
              aria-label="Not met yet"
            />
          )}
          <span className={cn(requirement.met ? "text-green-700" : "text-gray-600")}>
            {requirement.text}
          </span>
        </li>
      ))}
    </ul>
  );
}
