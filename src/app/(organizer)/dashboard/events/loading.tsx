import { Skeleton, SkeletonTableRow } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header + Create Event button */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Events table card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
        {/* Table header row */}
        <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
          <Skeleton className="h-4 w-1/4 rounded-md" />
          <Skeleton className="h-4 w-1/6 rounded-md" />
          <Skeleton className="h-4 w-1/6 rounded-md" />
          <Skeleton className="h-4 w-1/6 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md ml-auto" />
        </div>

        {/* Table body rows */}
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    </div>
  );
}
