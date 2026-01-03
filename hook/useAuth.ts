"use client"

import { createClient } from "@/lib/supabase/client";
import { UserMetaData } from "@/types/auth";
import { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface UseAuthReturn {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    userMetadata: UserMetaData | null;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    const refreshSession = useCallback(async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
    }, [supabase.auth]);

    useEffect(() => {
        const getInitialSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                setSession(initialSession);
                setUser(initialSession?.user ?? null);
            } catch (e) {
                console.error("Error fetching session:", e);
            } finally {
                setIsLoading(false);
            }
        };

        getInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                setSession(currentSession);
                setUser(currentSession?.user ?? null);
                setIsLoading(false);

                if (event === "SIGNED_OUT") {
                    router.push("/login");
                }
            }
        )

        return () => {
            subscription.unsubscribe();
        }
    }, [supabase.auth, router])

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        router.push("/login");
    }, [supabase.auth, router]);

    const userMetadata: UserMetadata | null = user?.user_metadata 
        ? {
            first_name: user.user_metadata.first_name || "",
            last_name: user.user_metadata.last_name || "",
            display_name: user.user_metadata.display_name || "",
        } 
        : null;

    return {
        user,
        session,
        isLoading,
        userMetadata,
        signOut,
        refreshSession,
    };
}