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
    <div className={`p-8 ${className} ${font}`}>{children}</div>
  );
}
