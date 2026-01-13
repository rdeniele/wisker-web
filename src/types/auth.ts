import { Session, User } from "@supabase/supabase-js";

export interface AuthCredentials {
    email: string;
    password: string;
}

export interface SignupCredentials {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    error?: string;
}

export interface AuthFormState {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword?: string;
    isLoading: boolean;
    error: string | null;
}

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserMetaData {
    first_name: string;
    last_name: string;
    display_name: string;
}

export interface UseAuthReturn {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    userMetadata: UserMetaData | null;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
}
