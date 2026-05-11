"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import {
  landingOutlineButtonClass,
  landingPrimaryButtonClass,
} from "@/lib/landing-button-styles";

const logoUrl = "/images/Wisker.png"; // Local logo in public directory

export default function NavBar() {
  const { isSignedIn, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b-2 border-[#b3d1ff] bg-white">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2">
        <div className="flex items-center gap-3">
          <Image
            src={logoUrl}
            alt="Wisker Logo"
            width={40}
            height={40}
            className="rounded-lg border-2 border-[#b3d1ff] bg-[#f5faff]"
            priority
          />
          <span className="font-extrabold text-xl sm:text-2xl text-gray-800 tracking-tight leading-none font-sans">
            Wisker
          </span>
        </div>
        {/* Burger menu button for mobile */}
        <button
          className="sm:hidden flex items-center justify-center p-2 rounded-md focus:outline-none"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg
            className="w-7 h-7 text-[#4a90e2]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
        {/* Desktop menu */}
        <div className="hidden sm:flex items-center gap-4 md:gap-5">
          <Link
            href="/"
            className="text-gray-700 font-bold text-base px-2 py-1 hover:text-[#4a90e2] transition-colors"
          >
            Home
          </Link>
          <a
            href="#features"
            className="text-gray-700 font-bold text-base px-2 py-1 hover:text-[#4a90e2] transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-gray-700 font-bold text-base px-2 py-1 hover:text-[#4a90e2] transition-colors"
          >
            How It Works
          </a>
          <a
            href="#for-students"
            className="text-gray-700 font-bold text-base px-2 py-1 hover:text-[#4a90e2] transition-colors"
          >
            For students
          </a>
          <a
            href="#faq"
            className="text-gray-700 font-bold text-base px-2 py-1 hover:text-[#4a90e2] transition-colors"
          >
            FAQ
          </a>
          {!isSignedIn ? (
            <>
              <a href="/login" className={landingOutlineButtonClass}>
                Login
              </a>
              <a href="/signup" className={landingPrimaryButtonClass}>
                Sign Up Free
              </a>
            </>
          ) : (
            <button
              type="button"
              onClick={logout}
              className={landingOutlineButtonClass}
            >
              Logout
            </button>
          )}
        </div>
      </div>
      {/* Mobile menu dropdown */}
      <div
        className={`sm:hidden w-full bg-white border-t-2 border-[#b3d1ff] px-4 py-2 transition-all duration-200 ${menuOpen ? "block" : "hidden"}`}
      >
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="text-gray-700 font-bold text-base px-2 py-1 hover:text-[#4a90e2] transition-colors"
          >
            Home
          </Link>
          <a
            href="#features"
            className="text-gray-700 font-bold text-base px-2 py-1 hover:text-[#4a90e2] transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-gray-700 font-bold text-base px-2 py-1 hover:text-[#4a90e2] transition-colors"
          >
            How It Works
          </a>
          <a
            href="#for-students"
            className="text-gray-700 font-bold text-base px-2 py-1 hover:text-[#4a90e2] transition-colors"
          >
            For students
          </a>
          <a
            href="#faq"
            className="text-gray-700 font-bold text-base px-2 py-1 hover:text-[#4a90e2] transition-colors"
          >
            FAQ
          </a>
          {!isSignedIn ? (
            <>
              <a href="/login" className={landingOutlineButtonClass}>
                Login
              </a>
              <a href="/signup" className={landingPrimaryButtonClass}>
                Sign Up Free
              </a>
            </>
          ) : (
            <button
              type="button"
              onClick={logout}
              className={landingOutlineButtonClass}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
