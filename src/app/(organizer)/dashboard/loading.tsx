import { Skeleton, SkeletonText, SkeletonStatCard } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* Upcoming Events section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-44" />

        {/* Event row skeletons */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 flex items-center gap-4"
          >
            {/* Title + date block */}
            <div className="flex-1 space-y-2">
              <SkeletonText className="w-1/2" />
              <SkeletonText className="w-1/4" />
            </div>
            {/* Status badge skeleton */}
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
