import { Skeleton, SkeletonText, SkeletonCircle } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page title: "Check-in: <event name>" */}
      <Skeleton className="h-8 w-72" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: QR Scanner area */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-28" />
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
            {/* Large square representing the camera/QR viewfinder */}
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>

        {/* Right: Participant list */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                {/* Circle avatar */}
                <SkeletonCircle />
                {/* Participant name */}
                <SkeletonText className="flex-1" />
                {/* Check mark / status indicator */}
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
