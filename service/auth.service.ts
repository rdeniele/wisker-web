import { createClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/utils/validation";
import { AuthCredentials, AuthResponse, SignupCredentials } from "@/types/auth";

export async function signUp(credentials: SignupCredentials): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = credentials;
    
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

    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                display_name: `${firstName.trim()} ${lastName.trim()}`,
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        }
    })
    
    if (error) {
        return {
            success: false,
            message: "Sign up failed.",
            error: error.message,
        }
    }

    if (data.user && !data.session) {
        return {
            success: true,
            message: "Please check your email to confirm your account."
        }
    }

    return {
        success: true,
        message: "Account created successfully.",
    }
}

export async function signIn(credentials: AuthCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    if (!email || !password) {
        return {
            success: false,
            message: "Validation failed",
            error: "Email and password are required.",
        }
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        return {
            success: false,
            message: "Sign in failed.",
            error: error.message,
        }
    }

    return {
        success: true,
        message: "Signed in successfully.",
    }
}

export async function signOut(): Promise<void> {
    const supabase = await createClient();
    await supabase.auth.signOut();
}

export async function getCurrentUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function resetPassword(email: string): Promise<AuthResponse> {
    if (!email) {
        return {
            success: false,
            message: "Validation failed",
            error: "Email is required.",
        }
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery`,
    })

    if (error) {
        return {
            success: false,
            message: "Password reset failed.",
            error: error.message,
        }
    }

    return {
        success: true,
        message: "Check your email for password reset instructions.",
    }
}