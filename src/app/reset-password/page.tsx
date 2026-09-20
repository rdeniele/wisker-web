"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import InputBox from "@/components/ui/inputboxes";
import Button, { buttonClasses } from "@/components/ui/button";
import Toast from "@/components/ui/Toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AuthShell from "@/components/auth/AuthShell";
import PasswordChecklist, {
  usePasswordRequirements,
} from "@/components/auth/PasswordChecklist";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "../../../hook/useToast";

type Session = "checking" | "ready" | "missing";

/** Landing page for the emailed reset link (via /api/auth/callback). */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [session, setSession] = useState<Session>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const requirements = usePasswordRequirements(password);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!cancelled) setSession(data.user ? "ready" : "missing");
      })
      .catch(() => {
        if (!cancelled) setSession("missing");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast("Passwords do not match!", "error");
      return;
    }
    if (!requirements.every((r) => r.met)) {
      showToast("Please meet all password requirements!", "error");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw error;
      showToast("Password updated. Taking you to your dashboard.", "success");
      router.push("/dashboard");
    } catch (error) {
      console.error("Password update failed:", error);
      showToast(
        error instanceof Error ? error.message : "We couldn't update your password.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (session === "checking") {
    return (
      <div className="grid min-h-dvh place-items-center bg-cream">
        <LoadingSpinner message="Checking your reset link..." />
      </div>
    );
  }

  return (
    <AuthShell
      title={session === "ready" ? "Choose a new password" : "Link expired"}
      subtitle={
        session === "ready"
          ? "Pick something you haven't used before."
          : "This reset link is invalid or has expired. Reset links only work once."
      }
    >
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={hideToast}
      />

      {session === "missing" ? (
        <Link href="/forgot-password" className={buttonClasses({ size: "lg", fullWidth: true })}>
          Request a new link
        </Link>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <InputBox
            label="New password"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showPasswordToggle
            required
          />
          {password.length > 0 && <PasswordChecklist requirements={requirements} />}
          <InputBox
            label="Confirm new password"
            type="password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            showPasswordToggle
            required
            error={
              confirmPassword && password !== confirmPassword
                ? "Passwords do not match"
                : ""
            }
          />
          <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
            Update password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
