import { Skeleton, SkeletonText, SkeletonCircle } from "@/components/ui";

function BadgeCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 space-y-3">
      {/* Badge image square */}
      <Skeleton className="h-20 w-full rounded-xl" />
      {/* Badge title */}
      <SkeletonText className="w-3/4" />
      {/* Event name */}
      <SkeletonText className="w-1/2" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
      {/* Profile header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <SkeletonCircle className="h-24 w-24" />
        <Skeleton className="h-7 w-40" />
        <SkeletonText className="w-24" />
      </div>

      {/* Stats row: 3 stat boxes */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 space-y-2 text-center">
            <Skeleton className="h-8 w-10 mx-auto" />
            <SkeletonText className="w-16 mx-auto" />
          </div>
        ))}
      </div>

      {/* Badge collection section */}
      <div>
        <Skeleton className="h-7 w-44 mx-auto mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <BadgeCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
