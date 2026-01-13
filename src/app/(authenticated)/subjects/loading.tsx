import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function SubjectsLoading() {
  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <LoadingSpinner size="lg" message="Loading subjects..." fullScreen />
    </div>
  );
}
