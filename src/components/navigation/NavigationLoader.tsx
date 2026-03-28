"use client";

import { useNavigation } from "@/components/navigation/NavigationContext";

export default function NavigationLoader() {
  const { isNavigating } = useNavigation();

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] h-0.5" role="progressbar">
      <div className="h-full w-full bg-lime-500 origin-left animate-nav-progress" />
    </div>
  );
}
