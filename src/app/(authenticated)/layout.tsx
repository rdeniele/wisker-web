import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/shell/AppShell";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/lib/AuthContext";

// Force dynamic rendering since we use cookies for auth
export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ToastProvider>
      <AuthProvider>
        <AppShell>{children}</AppShell>
      </AuthProvider>
    </ToastProvider>
  );
}
