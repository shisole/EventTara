"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui";

const EVENT_TYPES = [
  { value: "", label: "All Events" },
  { value: "hiking", label: "Hiking" },
  { value: "mtb", label: "Mountain Biking" },
  { value: "road_bike", label: "Road Biking" },
  { value: "running", label: "Running" },
  { value: "trail_run", label: "Trail Running" },
];

export default function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") || "";

  const handleTypeChange = useCallback(
    (type: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (type) {
        params.set("type", type);
      } else {
        params.delete("type");
      }
      router.push(`/events?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible scrollbar-hide">
      {EVENT_TYPES.map((type) => (
        <Button
          key={type.value}
          variant={currentType === type.value ? "primary" : "ghost"}
          size="sm"
          className="whitespace-nowrap shrink-0 sm:shrink"
          onClick={() => handleTypeChange(type.value)}
        >
          {type.label}
        </Button>
      ))}
    </div>
  );
}
