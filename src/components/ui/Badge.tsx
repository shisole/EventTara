import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "hiking" | "mtb" | "road_bike" | "running" | "trail_run" | "beta";
}

const variantStyles: Record<string, string> = {
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  hiking: "bg-forest-100 text-forest-700 dark:bg-forest-900/50 dark:text-forest-300",
  mtb: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
  road_bike: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  running: "bg-golden-100 text-golden-700 dark:bg-golden-900/50 dark:text-golden-300",
  trail_run: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  beta: "bg-lime-500 text-gray-900",
};

const UIBadge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
);

UIBadge.displayName = "UIBadge";
export default UIBadge;
