import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700", className)} />;
}

export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-4 w-full rounded-md", className)} />;
}

export function SkeletonCircle({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-10 w-10 rounded-full", className)} />;
}

/** Skeleton shaped like an EventCard */
export function SkeletonEventCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-20 rounded-full" />
        <SkeletonText className="w-3/4" />
        <SkeletonText className="w-1/2" />
        <div className="flex justify-between pt-2">
          <SkeletonText className="w-20" />
          <SkeletonText className="w-16" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton for a stats card */
export function SkeletonStatCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6 space-y-3">
      <SkeletonText className="w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

/** Skeleton for a table row */
export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 py-4 px-4 border-b border-gray-100 dark:border-gray-800">
      <SkeletonText className="w-1/4" />
      <SkeletonText className="w-1/6" />
      <SkeletonText className="w-1/6" />
      <SkeletonText className="w-1/6" />
      <SkeletonText className="w-20" />
    </div>
  );
}
