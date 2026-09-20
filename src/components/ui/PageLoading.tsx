import LoadingSpinner from "./LoadingSpinner";

/**
 * Route-level loading state. Renders inside the page area (not fixed) so the
 * sidebar / bottom navigation stay put while content loads.
 */
export default function PageLoading() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <LoadingSpinner size="lg" message="Loading..." />
    </div>
  );
}
