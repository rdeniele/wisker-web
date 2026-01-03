export interface AuthCredentials {
    email: string;
    password: string;
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