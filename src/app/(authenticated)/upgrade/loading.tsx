import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function UpgradeLoading() {
  return (
    <div className="p-6">
      <LoadingSpinner size="lg" message="Loading upgrade options..." fullScreen />
    </div>
  );
}
