import { Skeleton, SkeletonText, SkeletonCircle } from "@/components/ui";

function InputSkeleton() {
  return (
    <div className="space-y-1">
      <SkeletonText className="w-28" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-10 max-w-2xl">
      {/* Page title: "Settings" */}
      <Skeleton className="h-8 w-28" />

      {/* Organizer Profile card */}
      <section className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 space-y-6">
          {/* Organization Name */}
          <InputSkeleton />

          {/* Description (textarea) */}
          <div className="space-y-1">
            <SkeletonText className="w-24" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>

          {/* Logo uploader: circle preview + upload area */}
          <div className="space-y-1">
            <SkeletonText className="w-16" />
            <div className="flex items-center gap-4">
              <SkeletonCircle className="h-16 w-16" />
              <Skeleton className="h-10 flex-1 rounded-xl" />
            </div>
          </div>

          {/* Save Profile button */}
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </section>

      {/* Payment Settings card */}
      <section className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 space-y-6">
          {/* GCash Number */}
          <InputSkeleton />

          {/* Maya Number */}
          <InputSkeleton />

          {/* Save Payment Settings button */}
          <Skeleton className="h-10 w-48 rounded-xl" />
        </div>
      </section>
    </div>
  );
}
