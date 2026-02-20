"use client";

import { cn } from "@/lib/utils";

interface PaymentStatusBadgeProps {
  status: "pending" | "paid" | "rejected" | "refunded";
  className?: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  paid: "bg-forest-100 text-forest-700 dark:bg-forest-900/50 dark:text-forest-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  refunded: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize",
        statusStyles[status] || statusStyles.pending,
        className
      )}
    >
      {status}
    </span>
  );
}
