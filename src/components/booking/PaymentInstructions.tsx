"use client";

interface PaymentInstructionsProps {
  method: "gcash" | "maya";
  paymentInfo: {
    gcash_number?: string;
    maya_number?: string;
  };
  amount?: number;
}

export default function PaymentInstructions({ method, paymentInfo, amount }: PaymentInstructionsProps) {
  const number = method === "gcash" ? paymentInfo.gcash_number : paymentInfo.maya_number;
  const label = method === "gcash" ? "GCash" : "Maya";
  const wrapperClass = method === "gcash"
    ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
    : "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800";

  if (!number) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          The organizer hasn&apos;t set up their {label} number yet. Please try another payment method.
        </p>
      </div>
    );
  }

  return (
    <div className={`${wrapperClass} rounded-xl p-4 space-y-3`}>
      <h4 className="font-medium text-sm">Pay via {label}</h4>
      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Send to this {label} number</p>
        <p className="text-xl font-bold font-mono tracking-wider">{number}</p>
      </div>
      <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
        <li>Open your {label} app</li>
        <li>Send{amount ? ` ₱${amount.toLocaleString()}` : " the exact amount"} to the number above</li>
        <li>Take a screenshot of the confirmation</li>
        <li>Upload the screenshot below</li>
      </ol>
    </div>
  );
}
