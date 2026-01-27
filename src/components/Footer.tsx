"use client";
import React from "react";
import { FaHome, FaBookOpen, FaListAlt, FaBlog, FaEnvelope, FaFacebook, FaLinkedin } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-neutral-700 text-white pt-8 font-sans text-base w-full">
            <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row md:items-start md:justify-center gap-8 md:gap-16">
                <div className="max-w-xs flex flex-col items-start">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/images/Wisker.png"
                            alt="Wisker Logo"
                            width={32}
                            height={32}
                            className="rounded-lg border-2 border-[#b3d1ff] bg-[#f5faff]"
                            priority
                        />
                        <span className="font-extrabold text-3xl text-white leading-tight">Wisker</span>
                    </div>
                    <p className="mt-4 text-gray-200 text-lg leading-relaxed">
                        Making studying fun and effective with AI-powered learning tools.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-8 w-full">
                    <div>
                        <h4 className="font-semibold mb-3 text-white">Navigation</h4>
                        <ul className="list-none p-0 m-0 text-gray-200">
                            <li>
                                <Link href="/" className="flex items-center gap-2 hover:text-[#b3d1ff] transition-colors"><FaHome />Home</Link>
                            </li>
                            <li><a href="#how-it-works" className="flex items-center gap-2 hover:text-[#b3d1ff] transition-colors"><FaBookOpen />How It Works</a></li>
                            <li><a href="#features" className="flex items-center gap-2 hover:text-[#b3d1ff] transition-colors"><FaListAlt />Features</a></li>
                            <li><a href="#blogs" className="flex items-center gap-2 hover:text-[#b3d1ff] transition-colors"><FaBlog />Blogs</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-3 text-white">Contact</h4>
                        <ul className="list-none p-0 m-0 text-gray-200">
                            <li><a href="mailto:info@wisker.app" className="flex items-center gap-2 hover:text-[#b3d1ff] transition-colors"><FaEnvelope />info@wisker.app</a></li>
                            <li><a href="https://www.facebook.com/profile.php?id=61577887210771" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#b3d1ff] transition-colors"><FaFacebook />Facebook</a></li>
                            <li><a href="https://www.linkedin.com/company/wisker/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#b3d1ff] transition-colors"><FaLinkedin />LinkedIn</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <hr className="border-t border-gray-500 my-8" />
            <div className="text-center py-4 text-gray-200 text-sm">
                © 2025 Wisker. All rights reserved. Made with <span className="text-pink-400 text-lg">♥</span> for students everywhere.
            </div>
        </footer>
    );
}
