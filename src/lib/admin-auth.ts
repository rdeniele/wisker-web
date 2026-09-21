/**
 * Admin Authentication Helper
 * Checks if a user has admin access based on email
 */

import { createClient } from "@/lib/supabase/server";
import { ForbiddenError } from "@/lib/errors";

// Allowed admin emails and domains
const ADMIN_EMAILS = ["rondenielep13@gmail.com"];

const ADMIN_DOMAINS = ["@wisker.app", "@acqron.com"];

/**
 * Check if an email has admin access
 */
export function isAdminEmail(email: string): boolean {
  if (!email) return false;

  const lowerEmail = email.toLowerCase();

  // Check exact email matches
  if (ADMIN_EMAILS.includes(lowerEmail)) {
    return true;
  }

  // Check domain matches
  return ADMIN_DOMAINS.some((domain) => lowerEmail.endsWith(domain));
}

/**
 * Get the current authenticated user and check if they're an admin
 */
export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, isAdmin: false };
  }

  // Admin access is granted by email, so the address must be verified;
  // otherwise anyone could sign up as someone@<admin domain>.
  const isAdmin = isAdminEmail(user.email || "") && !!user.email_confirmed_at;

  return { user, isAdmin };
}

/**
 * Admin gate for API routes: returns the admin's identity for audit logging
 * or throws a ForbiddenError.
 */
export async function assertAdmin(): Promise<{ id: string; email: string }> {
  const { user, isAdmin } = await getAdminUser();
  if (!user || !isAdmin) {
    throw new ForbiddenError("Admin access required");
  }
  return { id: user.id, email: user.email ?? "" };
}

/**
 * Require admin access or throw error
 */
export async function requireAdmin() {
  const { user, isAdmin } = await getAdminUser();

  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}
