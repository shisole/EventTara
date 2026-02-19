import { Skeleton, SkeletonText, SkeletonCircle } from "@/components/ui";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero image skeleton */}
      <Skeleton className="h-64 md:h-96 w-full rounded-2xl mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content — left column (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Badge + title + meta */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-10 w-3/4" />
            <SkeletonText className="w-1/2" />
            <SkeletonText className="w-1/3" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-40 mb-3" />
            <SkeletonText />
            <SkeletonText />
            <SkeletonText className="w-5/6" />
            <SkeletonText className="w-4/6" />
          </div>

          {/* Gallery grid: 3 image skeletons */}
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — right column */}
        <div className="space-y-6">
          {/* Booking card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5 sm:p-6 space-y-4">
            {/* Price */}
            <div className="flex justify-center">
              <Skeleton className="h-10 w-28" />
            </div>

            {/* Attendee count */}
            <SkeletonText className="w-3/4 mx-auto" />

            {/* CTA button */}
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>

          {/* Organizer card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5 space-y-3">
            <Skeleton className="h-5 w-32 mb-1" />
            <div className="flex items-center gap-3">
              <SkeletonCircle className="h-12 w-12 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonText className="w-2/3" />
                <SkeletonText className="w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
