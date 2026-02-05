"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AuthProvider } from "@/lib/AuthContext";
import NavBar from "@/components/NavBar";
import Hero from "@/components/sections/Hero";
import HowItWorks from "@/components/sections/HowItWorks";
import Features from "@/components/sections/Features";
// import Blogs from "@/components/sections/Blogs";
import Pricing from "@/components/sections/Pricing";
import SignUpCTA from "@/components/sections/SignUpCTA";
import CommunitySection from "@/components/CommunitySection";
import Footer from "@/components/Footer";

function HomeContent() {
  const { isSignedIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  // Don't show landing page while redirecting
  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Redirecting...</div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="w-full max-w-[1200px] mx-auto px-4">
        <Hero />
        <HowItWorks />
        <Features />
        {/* <Blogs /> */}
        <Pricing />
        <SignUpCTA />
        <CommunitySection />
      </main>
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}
