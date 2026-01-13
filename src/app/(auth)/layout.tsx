import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Authentication - Wisker",
    description: "Sign in or create an account",
};

interface AuthLayoutProps {
    children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {children}
        </main>
    );
}
