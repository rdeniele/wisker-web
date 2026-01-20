import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Authentication - Wisker",
  description: "Sign in or create an account",
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If user is already logged in, redirect to dashboard
    if (user) {
      redirect("/dashboard");
    }
  } catch (error) {
    console.error("Auth layout error:", error);
    // Continue rendering even if Supabase check fails
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">{children}</main>
  );
}
