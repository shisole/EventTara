"use client";

import { cn } from "@/lib/utils";

interface PaymentMethodPickerProps {
  selected: string;
  onSelect: (method: string) => void;
}

const PAYMENT_METHODS = [
  { id: "gcash", name: "GCash", icon: "💙" },
  { id: "maya", name: "Maya", icon: "💚" },
  { id: "cash", name: "Cash", icon: "💵" },
];

export default function PaymentMethodPicker({ selected, onSelect }: PaymentMethodPickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
      <div className="grid grid-cols-3 gap-3">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            className={cn(
              "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all font-medium",
              selected === method.id
                ? "border-lime-500 bg-lime-50 dark:bg-lime-950"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            )}
          >
            <span className="text-xl">{method.icon}</span>
            <span>{method.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
