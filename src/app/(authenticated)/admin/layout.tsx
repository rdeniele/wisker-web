import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin-auth";
import AdminNav from "@/components/admin/AdminNav";

/**
 * Every /admin page requires an admin: non-admins are sent back to their
 * dashboard before any admin UI is rendered (the APIs enforce it again).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <AdminNav />
      {children}
    </div>
  );
}
