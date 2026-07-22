"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AuthProvider } from "@/lib/AuthContext";
import NavBar from "@/components/NavBar";
import Hero from "@/components/sections/Hero";
import Subheadline from "@/components/sections/Subheadline";
import Features from "@/components/sections/Features";
import HowItWorks from "@/components/sections/HowItWorks";
import AudienceSection from "@/components/sections/AudienceSection";
import SignUpCTA from "@/components/sections/SignUpCTA";
import FAQ from "@/components/sections/FAQ";
import CommunitySection from "@/components/CommunitySection";
import Footer from "@/components/Footer";
import { BottomAd } from "@/components/ui/AdSenseAd";

function HomeContent() {
  const { isSignedIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard once auth state resolves.
    // The landing page renders immediately below regardless, so this never
    // blocks first paint for anonymous visitors.
    if (!loading && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, loading, router]);

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="w-full max-w-[1200px] mx-auto px-4">
        <Hero />
        <Subheadline />
        <Features />
        <HowItWorks />
        <AudienceSection />
        <SignUpCTA />
        <FAQ />
        {/* Ad placement - unobtrusive bottom section ad */}
        <div className="py-12 border-t border-gray-200">
          <p className="text-center text-xs text-gray-400 mb-4">Sponsored</p>
          <BottomAd />
        </div>
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
