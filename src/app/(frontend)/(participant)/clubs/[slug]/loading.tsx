import { Skeleton, SkeletonCircle, SkeletonEventCard } from "@/components/ui";

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile header skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 overflow-hidden">
        {/* Cover */}
        <Skeleton className="h-40 sm:h-56 w-full rounded-none" />
        <div className="px-5 pb-6 sm:px-8">
          {/* Logo + Name */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
            <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white dark:border-gray-900" />
            <div className="flex-1 space-y-2 sm:pb-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
          {/* Description */}
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          {/* Meta */}
          <div className="mt-4 flex gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          {/* Activity badges */}
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>
      </div>

      {/* Events section skeleton */}
      <section>
        <Skeleton className="h-7 w-24 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonEventCard key={i} />
          ))}
        </div>
      </section>

      {/* Members section skeleton */}
      <section>
        <Skeleton className="h-7 w-32 mb-4" />
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 py-2">
                <SkeletonCircle className="w-12 h-12" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
