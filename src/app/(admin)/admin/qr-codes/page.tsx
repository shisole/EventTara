import QRBatchManager from "@/components/admin/QRBatchManager";

export default function QRCodesPage() {
  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
        QR Codes
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Generate one-time-use QR codes that award badges when scanned.
      </p>
      <QRBatchManager />
    </div>
  );
}
