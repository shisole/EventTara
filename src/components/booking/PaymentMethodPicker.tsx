"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface PaymentMethodPickerProps {
  selected: string;
  onSelect: (method: string) => void;
}

const EWALLET_METHODS = [
  { id: "gcash", name: "GCash", icon: "💙" },
  { id: "maya", name: "Maya", icon: "💚" },
];

const CASH_METHOD = { id: "cash", name: "Cash", icon: "💵" };

export default function PaymentMethodPicker({ selected, onSelect }: PaymentMethodPickerProps) {
  const [ewalletEnabled, setEwalletEnabled] = useState(false);

  useEffect(() => {
    void fetch("/api/feature-flags")
      .then((r) => r.json())
      .then((d: { ewalletPayments?: boolean }) => setEwalletEnabled(d.ewalletPayments === true))
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {});
  }, []);

  const methods = ewalletEnabled
    ? [
        ...EWALLET_METHODS.map((m) => ({ ...m, comingSoon: false })),
        { ...CASH_METHOD, comingSoon: false },
      ]
    : [
        ...EWALLET_METHODS.map((m) => ({ ...m, comingSoon: true })),
        { ...CASH_METHOD, comingSoon: false },
      ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Payment Method
      </label>
      <div className={cn("grid gap-3", methods.length > 2 ? "grid-cols-3" : "grid-cols-1")}>
        {methods.map((method) => (
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
