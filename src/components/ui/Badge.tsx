import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "hiking" | "mtb" | "road_bike" | "running" | "trail_run" | "beta";
}

const variantStyles: Record<string, string> = {
  default: "bg-gray-100 text-gray-700",
  hiking: "bg-forest-100 text-forest-700",
  mtb: "bg-coral-100 text-coral-700",
  road_bike: "bg-blue-100 text-blue-700",
  running: "bg-golden-100 text-golden-700",
  trail_run: "bg-amber-100 text-amber-700",
  beta: "bg-coral-500 text-white",
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
