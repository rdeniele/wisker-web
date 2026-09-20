"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LuMailCheck } from "react-icons/lu";
import InputBox from "@/components/ui/inputboxes";
import Button from "@/components/ui/button";
import Toast from "@/components/ui/Toast";
import AuthShell from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "../../../../hook/useToast";

export default function ForgotPasswordPage() {
  const { toast, showToast, hideToast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        // The callback exchanges the emailed code for a session, then forwards to /reset-password.
        redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
      });
      if (error) throw error;
      // Same message whether or not the address has an account, so this can't be used to probe for users.
      setSent(true);
    } catch (error) {
      console.error("Password reset request failed:", error);
      showToast("We couldn't send the reset email. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to choose a new one."
    >
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={hideToast}
      />

      {sent ? (
        <div role="status" className="animate-fade-up rounded-[24px] border border-green-200 bg-green-50 p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-green-100 text-green-700">
            <LuMailCheck className="h-7 w-7" aria-hidden />
          </span>
          <h2 className="mt-3 text-xl font-semibold text-ink">Check your inbox</h2>
          <p className="mt-1.5 text-[15px] font-semibold leading-relaxed text-gray-700">
            If an account exists for <span className="font-extrabold text-ink">{email}</span>,
            a reset link is on its way. It can take a minute to arrive.
          </p>
          <Link href="/login" className="link mt-4 inline-block text-[15px]">
            Back to sign in
          </Link>
        </div>
      ) : (
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
          <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
            Send reset link
          </Button>
          <p className="pt-2 text-center text-[15px] font-semibold text-gray-600">
            Remembered it?{" "}
            <Link href="/login" className="link">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
