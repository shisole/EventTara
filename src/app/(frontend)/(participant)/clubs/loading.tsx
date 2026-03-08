import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <Skeleton className="h-9 w-52 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Search bar skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-11 w-full max-w-md rounded-full" />

        {/* Filter pills skeleton */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>

        {/* Results count skeleton */}
        <Skeleton className="h-4 w-24" />

        {/* Club grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3 mb-3" />
              <div className="flex gap-1">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
