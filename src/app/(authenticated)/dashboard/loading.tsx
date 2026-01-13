import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <LoadingSpinner size="lg" message="Loading your dashboard..." fullScreen />
    </div>
  );
}
