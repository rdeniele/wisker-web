"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Mascot from "@/components/ui/Mascot";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { buttonClasses } from "@/components/ui/button";

interface PlanDetails {
  planName: string;
  billingPeriod: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const isPromo = searchParams.get("promo") === "true";

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);

  const verifyPayment = useCallback(async () => {
    try {
      // If it's a promo activation, skip payment verification
      if (isPromo) {
        setStatus("success");
        setMessage("Your promo has been activated successfully!");
        return;
      }

      // Get session ID from sessionStorage if not in URL
      const finalSessionId =
        sessionId || sessionStorage.getItem("paymongoSessionId");

      if (!finalSessionId) {
        setStatus("error");
        setMessage("No payment session found");
        return;
      }

      const response = await fetch(
        `/api/payments/verify?session_id=${finalSessionId}`,
      );
      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message);
        setPlanDetails(data.data);
      } else {
        setStatus("error");
        setMessage(data.message || "Payment verification failed");
      }
    } catch {
      setStatus("error");
      setMessage("Failed to verify payment");
    }
  }, [sessionId, isPromo]);

  useEffect(() => {
    // Verify payment with backend (avoid setState sync in effect)
    queueMicrotask(() => {
      verifyPayment();
    });
  }, [verifyPayment]);

  if (status === "loading") {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4">
        <LoadingSpinner size="lg" message="Verifying your payment..." />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="grid min-h-[60vh] place-items-center px-1">
        <div
          role="alert"
          className="card w-full max-w-md rounded-[28px] p-7 text-center sm:p-9"
        >
          <Mascot name="sad" size={110} className="mx-auto" />
          <h1 className="mt-2 text-2xl font-semibold text-ink">Payment error</h1>
          <p className="mb-6 mt-2 text-[15px] font-semibold text-gray-600">{message}</p>
          <Link href="/upgrade" className={buttonClasses({ size: "lg", fullWidth: true })}>
            Try again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[60vh] place-items-center px-1">
      <div className="card w-full max-w-md rounded-[28px] p-7 text-center sm:p-9">
        <Mascot name="star" size={120} float className="mx-auto" />

        <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight text-ink">
          {isPromo ? "Promo activated!" : "Payment successful!"}
        </h1>
        <p className="mb-6 mt-2 text-base font-semibold text-gray-600">
          {isPromo
            ? "Your promotional subscription has been activated. Enjoy your free access!"
            : `Welcome to Wisker ${planDetails?.planName}! Your subscription is now active.`}
        </p>

        {planDetails && (
          <dl className="mb-6 rounded-2xl bg-sand p-4 text-left text-[15px]">
            <h2 className="mb-2 font-display text-base font-semibold text-ink">
              Subscription details
            </h2>
            <div className="flex justify-between gap-4 py-0.5">
              <dt className="font-bold text-gray-600">Plan</dt>
              <dd className="font-bold text-ink">{planDetails.planName}</dd>
            </div>
            <div className="flex justify-between gap-4 py-0.5">
              <dt className="font-bold text-gray-600">Billing</dt>
              <dd className="font-bold text-ink">
                {planDetails.billingPeriod === "yearly" ? "Annual" : "Monthly"}
              </dd>
            </div>
          </dl>
        )}

        <div className="space-y-3">
          <Link href="/dashboard" className={buttonClasses({ size: "lg", fullWidth: true })}>
            Go to dashboard
          </Link>
          <Link
            href="/subjects"
            className={buttonClasses({ variant: "secondary", size: "lg", fullWidth: true })}
          >
            Start learning
          </Link>
        </div>

        <p className="mt-6 text-sm font-semibold text-gray-500">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  );
}
