import React from "react";
import Link from "next/link";
import { LuCheck } from "react-icons/lu";
import Logo from "@/components/ui/Logo";
import Mascot from "@/components/ui/Mascot";

const POINTS = [
  "Quizzes, flashcards and summaries from your own files",
  "Every subject organised in one place",
  "Made to be used on your phone between classes",
];

/**
 * Shared frame for login and sign-up. One column on phones (logo, form, done);
 * from lg up the form sits beside a brand panel so the auth screens read as
 * part of the same product as the landing page.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-cream lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="flex min-h-dvh flex-col px-5 pb-6 pt-5 sm:px-10 lg:px-14">
        <header>
          <Link href="/" aria-label="Wisker home" className="inline-block rounded-xl">
            <Logo size={38} />
          </Link>
        </header>

        <main className="mx-auto my-auto w-full max-w-[440px] py-8 sm:py-10">
          <h1 className="text-[2rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[2.5rem]">
            {title}
          </h1>
          <p className="mb-7 mt-2.5 text-base leading-relaxed text-gray-600 sm:text-lg">
            {subtitle}
          </p>
          {children}
        </main>

        <footer className="flex justify-center gap-5 text-sm font-bold text-gray-600 lg:justify-start">
          <Link href="/terms" className="underline-offset-4 hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="underline-offset-4 hover:underline">
            Privacy
          </Link>
        </footer>
      </div>

      <aside
        aria-hidden
        className="relative hidden flex-col items-center justify-center overflow-hidden bg-indigo-500 p-12 text-white lg:flex"
      >
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-white/10" />
        <Mascot name="laptop" size={220} float className="relative" />
        <h2 className="relative mt-6 max-w-sm text-center text-[2rem] font-semibold leading-[1.1]">
          Upload at 9. Quizzing yourself by 9:01.
        </h2>
        <ul className="relative mt-8 grid max-w-sm gap-3.5">
          {POINTS.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[17px] font-semibold text-indigo-50">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white text-indigo-600">
                <LuCheck className="h-4 w-4" strokeWidth={3} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
