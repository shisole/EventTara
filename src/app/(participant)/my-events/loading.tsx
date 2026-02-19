import { Skeleton, SkeletonText } from "@/components/ui";

function BookingCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5 space-y-3">
      {/* Event title */}
      <SkeletonText className="w-2/3" />
      {/* Date line */}
      <SkeletonText className="w-1/2" />
      {/* Status badge */}
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
      {/* Page title */}
      <Skeleton className="h-8 w-36" />

      {/* Upcoming section */}
      <section className="space-y-4">
        <Skeleton className="h-7 w-28" />
        <BookingCardSkeleton />
        <BookingCardSkeleton />
        <BookingCardSkeleton />
      </section>

      {/* Past events section */}
      <section className="space-y-4">
        <Skeleton className="h-7 w-36" />
        <BookingCardSkeleton />
        <BookingCardSkeleton />
      </section>
    </div>
  );
}
