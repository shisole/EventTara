import { Skeleton, SkeletonText } from "@/components/ui";

function FormFieldSkeleton() {
  return (
    <div className="space-y-1">
      <SkeletonText className="w-28" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Skeleton className="h-5 w-32 mb-6" />

      {/* Page title: "Create New Event" */}
      <Skeleton className="h-8 w-48 mb-8" />

      <div className="space-y-6">
        <FormFieldSkeleton />

        <div className="space-y-1">
          <SkeletonText className="w-24" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>

        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <FormFieldSkeleton />

        <div className="grid grid-cols-2 gap-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>

        <div className="space-y-1">
          <SkeletonText className="w-28" />
          <Skeleton className="h-40 w-full rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700" />
        </div>

        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
