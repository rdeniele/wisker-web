import type { Metadata } from "next";
import Dashboard from "./components/Dashboard";

export const metadata: Metadata = { title: "Dashboard - Wisker" };

function DashboardPage() {
  return <Dashboard />;
}

export default DashboardPage;
