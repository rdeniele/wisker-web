"use client";

import React, { useState } from "react";
import InputBox from "@/components/ui/inputboxes";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/Checkbox";
import AuthShell from "@/components/auth/AuthShell";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Toast from "@/components/ui/Toast";
import { useToast } from "../../../../hook/useToast";
import PasswordChecklist, {
  usePasswordRequirements,
} from "@/components/auth/PasswordChecklist";

export default function SignupPage() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Check password requirements in real-time
  const passwordRequirements = usePasswordRequirements(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (password !== confirmPassword) {
      showToast("Passwords do not match!", "error");
      return;
    }

    const allRequirementsMet = passwordRequirements.every((req) => req.met);
    if (!allRequirementsMet) {
      showToast("Please meet all password requirements!", "error");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      showToast("Please provide both first and last name", "error");
      return;
    }

    if (!acceptedTerms) {
      showToast(
        "Please accept the Terms and Conditions and Privacy Policy",
        "error",
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          acceptedTerms: true,
          acceptedPrivacy: true,
        }),
      });

      const result = await res.json();

      if (result.success) {
        showToast(result.message, "success");
        router.push(`/login?message=${encodeURIComponent(result.message)}`);
      } else {
        showToast(result.error || result.message, "error");
      }
    } catch (error) {
      showToast("An unexpected error occurred. Please try again.", "error");
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free to start. Your first quiz is about a minute away."
    >
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={hideToast}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <InputBox
            label="First name"
            type="text"
            placeholder="First name"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <InputBox
            label="Last name"
            type="text"
            placeholder="Last name"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

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
          placeholder="Create a password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showPasswordToggle={true}
          required
        />

        {/* Requirements appear once the user starts typing */}
        {password.length > 0 && (
          <PasswordChecklist requirements={passwordRequirements} />
        )}

        <InputBox
          label="Confirm password"
          type="password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          showPasswordToggle={true}
          required
          error={
            confirmPassword && password !== confirmPassword
              ? "Passwords do not match"
              : ""
          }
        />

        <Checkbox
          className="pt-1"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          required
          label={
            <>
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="link">
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="link">
                Privacy Policy
              </Link>
            </>
          }
        />

        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
          Create account
        </Button>

        {/* Google sign-up is intentionally disabled until the provider is configured. */}

        <p className="pt-2 text-center text-[15px] font-semibold text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="link">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
