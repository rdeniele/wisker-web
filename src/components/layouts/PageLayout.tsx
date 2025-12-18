import NavBar from "@/components/Navbar/NavBar";
import Sidebar from "@/components/Sidebar/Sidebar";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  font?: string;
}

export default function PageLayout({
  children,
  className = "",
  font = "font-fredoka",
}: PageLayoutProps) {
  return (
    <div className={`flex min-h-screen bg-[#fafafa] ${font}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <NavBar />
        <div className={`p-8 ${className}`}>{children}</div>
      </div>
    </div>
  );
}
