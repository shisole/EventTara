import { Skeleton, SkeletonText } from "@/components/ui";

function FormFieldSkeleton() {
  return (
    <div className="space-y-1">
      {/* Label */}
      <SkeletonText className="w-28" />
      {/* Input */}
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

export default function Loading() {
  return (
    <div>
      {/* Page title: "Edit Event" */}
      <Skeleton className="h-8 w-36 mb-8" />

      <div className="space-y-6 max-w-2xl">
        {/* Event Title */}
        <FormFieldSkeleton />

        {/* Description (taller textarea) */}
        <div className="space-y-1">
          <SkeletonText className="w-24" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>

        {/* Event Type */}
        <FormFieldSkeleton />

        {/* Date & Time */}
        <FormFieldSkeleton />

        {/* Location */}
        <FormFieldSkeleton />

        {/* Max Participants + Price (two-column grid) */}
        <div className="grid grid-cols-2 gap-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>

        {/* Cover Image upload area */}
        <div className="space-y-1">
          <SkeletonText className="w-28" />
          <Skeleton className="h-40 w-full rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700" />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
