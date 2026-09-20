"use client";

import React, { useState, useEffect, Suspense } from "react";
import InputBox from "@/components/ui/inputboxes";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/Checkbox";
import AuthShell from "@/components/auth/AuthShell";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Toast from "@/components/ui/Toast";
import { useToast } from "../../../../hook/useToast";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for success message from signup
    const message = searchParams.get("message");
    if (message) {
      showToast(message, "success");
    }
  }, [searchParams, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();
      // Login processed

      if (result.success) {
        showToast(result.message, "success");
        router.push("/dashboard");
      } else {
        showToast(result.error || result.message, "error");
      }
    } catch (error) {
      showToast("An unexpected error occurred. Please try again.", "error");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleGoogleSignIn = () => {
  //   console.log("Google sign in clicked");
  // };

  return (
    <AuthShell
      title="Welcome back!"
      subtitle="Let's pick up right where you left off and dive back in."
    >
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={hideToast}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <InputBox
          label="Email address"
          type="email"
          placeholder="you@school.edu"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <InputBox
          label="Password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showPasswordToggle={true}
          required
        />

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Checkbox
            label="Remember me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <Link href="/forgot-password" className="link text-[15px]">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
          Sign in
        </Button>

        {/* Google sign-in is intentionally disabled until the provider is configured. */}

        <p className="pt-2 text-center text-[15px] font-semibold text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="link">
            Sign up free
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center bg-cream">
          <LoadingSpinner message="Loading..." />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
