"use client";

import React, { useState, useMemo } from "react";
import PageHeader from "@/components/ui/pageheader";
import InputBox from "@/components/ui/inputboxes";
import Button from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Toast from "@/components/ui/Toast";
import { useToast } from "../../../../hook/useToast";

interface PasswordRequirement {
  id: string;
  text: string;
  met: boolean;
}

export default function SignupPage() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check password requirements in real-time
  const passwordRequirements = useMemo<PasswordRequirement[]>(
    () => [
      {
        id: "length",
        text: "At least 7 characters",
        met: password.length >= 7,
      },
      {
        id: "numberSpecial",
        text: "At least 1 numbers and special character",
        met: /(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password),
      },
      {
        id: "uppercase",
        text: "At least 1 uppercase character",
        met: /[A-Z]/.test(password),
      },
    ],
    [password],
  );

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

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
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

  const handleGoogleSignUp = () => {
    console.log("Google sign up clicked");
  };

  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
    >
      {/* Toast Notification */}
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={hideToast}
      />

      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <PageHeader
            title="Create an account"
            subtitle="Create your account in just a few steps."
            centered={false}
          />
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First Name Input */}
          <InputBox
            label="First Name"
            type="text"
            placeholder="Enter your first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />

          {/* Last Name Input */}
          <InputBox
            label="Last Name"
            type="text"
            placeholder="Enter your last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />

          {/* Email Input */}
          <InputBox
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password Input */}
          <InputBox
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showPasswordToggle={true}
            required
          />

          {/* Confirm Password Input */}
          <InputBox
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
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

          {/* Password Requirements - Only show when user has started typing */}
          {password.length > 0 && (
            <div className="space-y-3 transition-all duration-300 ease-in-out">
              <h3 className="text-lg font-semibold text-gray-900">
                Password Requirements
              </h3>
              <div className="space-y-2">
                {passwordRequirements.map((requirement) => (
                  <div
                    key={requirement.id}
                    className="flex items-center gap-3 transition-all duration-200"
                  >
                    <div className="shrink-0">
                      {requirement.met ? (
                        <svg
                          className="w-5 h-5 text-orange-500 transition-colors duration-200"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-red-500 transition-colors duration-200"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-base transition-colors duration-200 ${
                        requirement.met ? "text-gray-700" : "text-gray-600"
                      }`}
                    >
                      {requirement.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sign Up Button */}
          <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
            Sign Up
          </Button>

          {/* Divider */}
          {/* <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 text-gray-500">
                or continue with
              </span>
            </div>
          </div> */}

          {/* Google Sign Up Button */}
          {/* <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            onClick={handleGoogleSignUp}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button> */}

          {/* Sign In Link */}
          <div className="text-center pt-6">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Terms and Privacy */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              By continuing, you agree to our{" "}
              <Link
                href="/terms"
                className="text-orange-500 hover:text-orange-600 transition-colors"
              >
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-orange-500 hover:text-orange-600 transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
