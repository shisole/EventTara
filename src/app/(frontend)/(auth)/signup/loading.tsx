import { Skeleton, SkeletonText } from "@/components/ui";

export default function SignupLoading() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
      <SkeletonText className="w-52 h-7 mx-auto" />
      <Skeleton className="w-full h-12 rounded-xl" />
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-1">
          <SkeletonText className="w-20 h-4" />
          <Skeleton className="w-full h-12 rounded-xl" />
        </div>
        <div className="space-y-1">
          <SkeletonText className="w-16 h-4" />
          <Skeleton className="w-full h-12 rounded-xl" />
        </div>
        <div className="space-y-1">
          <SkeletonText className="w-12 h-4" />
          <Skeleton className="w-full h-12 rounded-xl" />
        </div>
        <Skeleton className="w-full h-12 rounded-xl" />
      </div>
      <SkeletonText className="w-44 h-4 mx-auto" />
    </div>
  );
}
