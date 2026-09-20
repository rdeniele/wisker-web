import React from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

/** Frame for long-form legal text: brand header, readable measure, warm card. */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream">
      <header className="border-b border-[#f2e7d8] bg-cream/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3 sm:px-6">
          <Link href="/" aria-label="Wisker home" className="rounded-xl">
            <Logo size={34} />
          </Link>
          <Link href="/signup" className="link text-[15px]">
            Sign up
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <article className="prose-wisker card rounded-[28px] p-6 text-[1.0625rem] sm:p-10 [&_h1]:mt-0 [&_h1]:text-[2rem] [&_h1]:font-semibold [&_h1]:leading-tight sm:[&_h1]:text-4xl [&_h2]:text-[1.35rem] [&_h2]:font-semibold [&_section]:scroll-mt-24">
          {children}
        </article>
      </main>
    </div>
  );
}
