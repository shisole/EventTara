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

/** Skeleton shaped like an EventCard (Airbnb-style flat layout) */
export function SkeletonEventCard() {
  return (
    <div>
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="pt-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <SkeletonText className="w-3/5 h-[18px]" />
          <SkeletonText className="w-10 h-[18px]" />
        </div>
        <SkeletonText className="w-1/3 h-3.5" />
        <SkeletonText className="w-2/3 h-3.5" />
        <div className="flex items-center justify-between">
          <SkeletonText className="w-16 h-3.5" />
          <SkeletonText className="w-20 h-3.5" />
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

/** Skeleton shaped like a FeedCard */
export function SkeletonFeedCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/20 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonCircle />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <SkeletonText className="w-28" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <SkeletonText className="w-48" />
        </div>
        <SkeletonText className="w-12" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-6 w-8 rounded-full" />
    </div>
  );
}

/** Skeleton shaped like a ForumThreadCard row */
export function SkeletonForumThread() {
  return (
    <div className="flex items-center gap-4 py-3.5 px-4">
      <SkeletonCircle className="h-8 w-8" />
      <div className="flex-1 min-w-0 space-y-2">
        <SkeletonText className="w-2/3 h-4" />
        <SkeletonText className="w-1/3 h-3" />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Skeleton className="hidden sm:block h-5 w-16 rounded-full" />
        <SkeletonText className="w-8 h-4" />
      </div>
    </div>
  );
}

/** Skeleton for forum sidebar categories */
export function SkeletonForumSidebar() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5 px-3 py-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <SkeletonText className="w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for a full thread detail page */
export function SkeletonForumThreadDetail() {
  return (
    <div className="space-y-6">
      <SkeletonText className="w-32 h-4" />
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 space-y-4">
        <SkeletonText className="w-3/4 h-6" />
        <div className="flex items-center gap-3">
          <SkeletonCircle className="h-8 w-8" />
          <div className="space-y-1.5">
            <SkeletonText className="w-28 h-4" />
            <SkeletonText className="w-20 h-3" />
          </div>
        </div>
        <div className="space-y-2 pt-2">
          <SkeletonText className="w-full" />
          <SkeletonText className="w-full" />
          <SkeletonText className="w-2/3" />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 space-y-4">
        <SkeletonText className="w-20 h-5" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-3">
            <SkeletonCircle className="h-8 w-8" />
            <div className="flex-1 space-y-2">
              <SkeletonText className="w-24 h-3" />
              <SkeletonText className="w-full" />
              <SkeletonText className="w-1/2" />
            </div>
          </div>
        ))}
      </div>
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
