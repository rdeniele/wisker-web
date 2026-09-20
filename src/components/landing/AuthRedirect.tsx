"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

/**
 * Sends signed-in visitors to their dashboard once auth state resolves.
 * Renders nothing, so the landing page never waits on it for first paint.
 */
export default function AuthRedirect() {
  const { isSignedIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, loading, router]);

  return null;
}
