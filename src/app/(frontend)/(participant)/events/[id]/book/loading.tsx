import { Skeleton, SkeletonText } from "@/components/ui";

export default function Loading() {
  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {/* Page title */}
      <Skeleton className="h-8 w-48 mx-auto mb-8" />

      {/* Booking card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5 sm:p-8 space-y-6">
        {/* Event summary */}
        <div className="space-y-3 pb-4 border-b border-gray-100 dark:border-gray-800">
          <SkeletonText className="w-3/4" />
          <SkeletonText className="w-1/2" />
          <SkeletonText className="w-1/3" />
        </div>

        {/* Payment method — two rounded boxes side by side */}
        <div className="space-y-2">
          <SkeletonText className="w-32 mb-3" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>

        {/* Terms / info line */}
        <SkeletonText className="w-4/5" />

        {/* Submit button */}
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
