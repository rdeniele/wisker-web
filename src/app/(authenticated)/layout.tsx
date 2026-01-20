import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar/Sidebar";
import NavBar from "@/components/Navbar/NavBar";
import { ToastProvider } from "@/contexts/ToastContext";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-background font-fredoka overflow-x-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <NavBar />
          <main className="flex-1 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
