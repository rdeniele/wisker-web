import type { Metadata } from "next";
import { AuthProvider } from "@/lib/AuthContext";
import LandingNav from "@/components/landing/LandingNav";
import AuthRedirect from "@/components/landing/AuthRedirect";
import Hero from "@/components/landing/Hero";
import {
  Marquee,
  WhyItWorks,
  HowItWorks,
  StudyTools,
  FinalsBand,
  FinalCTA,
} from "@/components/landing/Sections";
import FAQ from "@/components/landing/FAQ";
import LandingFooter from "@/components/landing/LandingFooter";
import { BottomAd } from "@/components/ui/AdSenseAd";

export const metadata: Metadata = {
  title: "Wisker: turn your notes into quizzes, flashcards and summaries",
  description:
    "Drop in your PDFs, lecture slides and notes. Wisker turns them into quizzes, flashcards and summaries in seconds, so every study session actually tests you.",
};

/**
 * Marketing page. Everything here renders on the server except the pieces that
 * need interaction (nav, hero quiz, FAQ) and the auth redirect.
 */
export default function Home() {
  return (
    <div className="overflow-x-clip bg-cream text-ink">
      <AuthProvider>
        <LandingNav />
        <AuthRedirect />
      </AuthProvider>
      <main>
        <Hero />
        <Marquee />
        <WhyItWorks />
        <HowItWorks />
        <StudyTools />
        <FinalsBand />
        <FAQ />
        {/* Ad placement: kept clear of the conversion sections above and below */}
        <div className="mx-auto w-full max-w-[1180px] px-5 pb-14 sm:px-6">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
            Sponsored
          </p>
          <BottomAd />
        </div>
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
