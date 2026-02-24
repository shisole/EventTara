"use client";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

const sizes = { sm: "text-sm", md: "text-lg", lg: "text-2xl" };

export default function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
}: StarRatingProps) {
  return (
    <div className={cn("flex gap-0.5", sizes[size])}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
            star <= value ? "text-yellow-400" : "text-gray-300 dark:text-gray-600",
          )}
        >
          &#9733;
        </button>
      ))}
    </div>
  );
}
