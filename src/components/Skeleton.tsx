/**
 * Skeleton Loading Components
 * Provides loading placeholders for better UX
 */

interface SkeletonProps {
  className?: string;
}

export function CardSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 ${className}`}>
      <div className="h-48 bg-gray-200 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16" />
          <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16" />
        </div>
      </div>
    </div>
  );
}

export function ListingDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-20 mb-8" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
        <div className="bg-gray-200 rounded-xl h-64" />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
      
      <div className="bg-white p-8 rounded-2xl shadow-lg border space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-12 bg-gray-200 rounded-lg" />
          </div>
        ))}
        <div className="h-14 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}
