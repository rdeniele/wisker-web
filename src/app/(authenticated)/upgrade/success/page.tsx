"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface PlanDetails {
  planName: string;
  billingPeriod: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);

  const verifyPayment = useCallback(async () => {
    try {
      const response = await fetch(`/api/payments/verify?session_id=${sessionId}`);
      const data = await response.json();

      if (data.success && data.status === "paid") {
        setStatus("success");
        setMessage(data.message);
        setPlanDetails(data.data);
      } else {
        setStatus("error");
        setMessage(data.message || "Payment verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      setMessage("Failed to verify payment");
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      queueMicrotask(() => {
        setStatus("error");
        setMessage("No payment session found");
      });
      return;
    }

    // Verify payment with backend (avoid setState sync in effect)
    queueMicrotask(() => {
      verifyPayment();
    });
  }, [sessionId, verifyPayment]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600 text-lg">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link
            href="/upgrade"
            className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful! 🎉
        </h1>
        <p className="text-gray-600 mb-6">
          Welcome to Wisker {planDetails?.planName}! Your subscription is now active.
        </p>

        {/* Plan Details */}
        {planDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Subscription Details</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Plan:</span> {planDetails.planName}
              </p>
              <p>
                <span className="font-medium">Billing:</span>{" "}
                {planDetails.billingPeriod === "yearly" ? "Annual" : "Monthly"}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/subjects"
            className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Start Learning
          </Link>
        </div>

        {/* Additional Info */}
        <p className="text-xs text-gray-500 mt-6">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  );
}
