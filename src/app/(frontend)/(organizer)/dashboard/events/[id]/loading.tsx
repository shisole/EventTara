import { Skeleton, SkeletonText, SkeletonStatCard, SkeletonCircle } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Event title + badge + action buttons */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 md:w-64" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-20 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Stat cards: Bookings, Checked In, Revenue */}
      <div className="grid grid-cols-3 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* Participants section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-36" />

        {/* Mobile card skeletons */}
        <div className="space-y-3 md:hidden">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <SkeletonText className="w-40" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <SkeletonText className="w-24" />
            </div>
          ))}
        </div>

        {/* Desktop table skeleton */}
        <div className="hidden md:block bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
            <SkeletonText className="w-1/4" />
            <SkeletonText className="w-1/6" />
            <SkeletonText className="w-1/6" />
            <SkeletonText className="w-1/6" />
          </div>

          {/* Participant rows */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <SkeletonCircle />
              <SkeletonText className="w-1/4" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <SkeletonText className="w-1/6 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
