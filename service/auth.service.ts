import { createClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/utils/validation";
import { AuthCredentials, AuthResponse, SignupCredentials } from "@/types/auth";

export async function signUp(
  credentials: SignupCredentials,
): Promise<AuthResponse> {
  const { email, password, firstName, lastName, acceptedTerms, acceptedPrivacy } = credentials;

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return {
      success: false,
      message: "Password validation failed.",
      error: passwordValidation.errors.join(", "),
    };
  }

  if (!firstName.trim() || !lastName.trim()) {
    return {
      success: false,
      message: "Validation failed",
      error: "First name and last name cannot be empty.",
    };
  }

  if (!acceptedTerms || !acceptedPrivacy) {
    return {
      success: false,
      message: "Validation failed",
      error: "You must accept the Terms and Conditions and Privacy Policy.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        display_name: `${firstName.trim()} ${lastName.trim()}`,
        accepted_terms: acceptedTerms,
        accepted_privacy: acceptedPrivacy,
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  });

  if (error) {
    let errorMessage = error.message;

    // Provide more specific error messages
    if (error.message.includes("User already registered")) {
      errorMessage =
        "An account with this email already exists. Please sign in instead.";
    }

    return {
      success: false,
      message: "Sign up failed.",
      error: errorMessage,
    };
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    return {
      success: true,
      message:
        "Success! Please check your email to confirm your account before signing in.",
    };
  }

  // If session exists, user is auto-confirmed (email confirmation disabled)
  if (data.user && data.session) {
    return {
      success: true,
      message: "Account created successfully! You can now sign in.",
    };
  }

  return {
    success: true,
    message: "Account created successfully.",
  };
}

export async function signIn(
  credentials: AuthCredentials,
): Promise<AuthResponse> {
  const { email, password } = credentials;

  if (!email || !password) {
    return {
      success: false,
      message: "Validation failed",
      error: "Email and password are required.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log("Supabase signIn response:", { data: !!data.user, session: !!data.session, error: error?.message });

  if (error) {
    // Provide more specific error messages
    let errorMessage = error.message;
    console.error("Supabase signIn error details:", error);

    if (error.message.includes("Email not confirmed")) {
      errorMessage =
        "Please confirm your email address before signing in. Check your inbox for the confirmation link.";
    } else if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Invalid email or password. Please check your credentials and try again. If you just signed up, you may need to confirm your email first.";
    }

    return {
      success: false,
      message: "Sign in failed.",
      error: errorMessage,
    };
  }

  // Check if user session was created successfully
  if (!data.session) {
    return {
      success: false,
      message: "Sign in failed.",
      error: "Failed to create session. Please try again.",
    };
  }

  return {
    success: true,
    message: "Signed in successfully.",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function resetPassword(email: string): Promise<AuthResponse> {
  if (!email) {
    return {
      success: false,
      message: "Validation failed",
      error: "Email is required.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery`,
  });

  if (error) {
    return {
      success: false,
      message: "Password reset failed.",
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Check your email for password reset instructions.",
  };
}
