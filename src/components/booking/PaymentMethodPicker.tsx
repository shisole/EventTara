"use client";

import { cn } from "@/lib/utils";

interface PaymentMethodPickerProps {
  selected: string;
  onSelect: (method: string) => void;
}

const PAYMENT_METHODS = [
  { id: "gcash", name: "GCash", icon: "💙", comingSoon: true },
  { id: "maya", name: "Maya", icon: "💚", comingSoon: true },
  { id: "cash", name: "Cash", icon: "💵", comingSoon: false },
];

export default function PaymentMethodPicker({ selected, onSelect }: PaymentMethodPickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Payment Method
      </label>
      <div className="grid grid-cols-3 gap-3">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.id}
            type="button"
            disabled={method.comingSoon}
            onClick={() => {
              onSelect(method.id);
            }}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 transition-all font-medium",
              method.comingSoon
                ? "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                : selected === method.id
                  ? "border-lime-500 bg-lime-50 dark:bg-lime-950"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{method.icon}</span>
              <span>{method.name}</span>
            </div>
            {method.comingSoon && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Coming Soon
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
