interface EmptyStateProps {
  message?: string;
  className?: string;
}

export default function EmptyState({
  message = "No data found.",
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`text-gray-500 col-span-full text-center py-8 ${className}`}
    >
      {message}
    </div>
  );
}
