import React from "react";
import Link from "next/link";
import Image from "next/image";

const linkClass =
  "inline-flex min-h-[32px] items-center text-[15.5px] text-[#b6aba1] transition-colors hover:text-cream";

export default function LandingFooter() {
  return (
    <footer className="bg-ink px-5 pb-8 pt-14 text-[#b6aba1] sm:px-6">
      <div className="mx-auto grid max-w-[1180px] gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Image
            src="/images/wisker_text_pic_logo.png"
            alt="Wisker"
            width={96}
            height={96}
            className="h-24 w-24 object-contain"
          />
          <p className="mt-3.5 max-w-[300px] text-[15.5px] leading-[1.6]">
            Active recall, automated. Built for students who&apos;d rather be
            quizzed than bored.
          </p>
        </div>
        <nav aria-label="Product">
          <h4 className="mb-3 text-[15px] font-semibold uppercase tracking-[0.04em] text-cream">
            Product
          </h4>
          <ul className="grid gap-1">
            <li>
              <a href="#how" className={linkClass}>How it works</a>
            </li>
            <li>
              <a href="#tools" className={linkClass}>Study tools</a>
            </li>
            <li>
              <a href="#faq" className={linkClass}>FAQ</a>
            </li>
            <li>
              <Link href="/login" className={linkClass}>Log in</Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Contact">
          <h4 className="mb-3 text-[15px] font-semibold uppercase tracking-[0.04em] text-cream">
            Contact
          </h4>
          <ul className="grid gap-1">
            <li>
              <a href="mailto:info@wisker.app" className={linkClass}>
                info@wisker.app
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/profile.php?id=61577887210771"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href="https://www.linkedin.com/company/wisker/?viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <h4 className="mb-3 text-[15px] font-semibold uppercase tracking-[0.04em] text-cream">
            Legal
          </h4>
          <ul className="grid gap-1">
            <li>
              <Link href="/terms" className={linkClass}>Terms</Link>
            </li>
            <li>
              <Link href="/privacy" className={linkClass}>Privacy</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="mx-auto mt-10 max-w-[1180px] border-t border-[#3d3733] pt-5 text-sm">
        © {new Date().getFullYear()} Wisker. Made for students everywhere.
      </div>
    </footer>
  );
}
