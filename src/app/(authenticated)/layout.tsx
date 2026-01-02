import Sidebar from "@/components/Sidebar/Sidebar";
import NavBar from "@/components/Navbar/NavBar";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background font-fredoka">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <NavBar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
