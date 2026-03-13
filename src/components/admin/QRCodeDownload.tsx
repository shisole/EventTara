"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useRef, useState } from "react";

import { Copy, Download } from "@/components/icons";

interface QRCodeDownloadProps {
  token: string;
  serialNumber: number;
  batchName: string;
}

export default function QRCodeDownload({ token, serialNumber, batchName }: QRCodeDownloadProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const claimUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://eventtara.com"}/claim/qr/${token}`;

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${batchName.trim().replaceAll(/\s+/g, "-").toLowerCase()}-${serialNumber}.png`;
    document.body.append(link);
    link.click();
    link.remove();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(claimUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={() => setShowQR(!showQR)}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {showQR ? "Hide QR" : "Show QR"}
        </button>
        <button
          onClick={handleCopy}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {copied ? (
            <span className="text-lime-600 dark:text-lime-400">Copied!</span>
          ) : (
            <>
              <Copy className="mr-1 inline-block h-3 w-3" />
              Copy Link
            </>
          )}
        </button>
      </div>

      {showQR && (
        <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <div ref={qrRef}>
            <QRCodeCanvas
              value={claimUrl}
              size={160}
              level="H"
              marginSize={4}
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          </div>
          <button
            onClick={handleDownload}
            className="mt-2 rounded-md bg-lime-500 px-3 py-1 text-xs font-medium text-gray-900 transition-colors hover:bg-lime-400"
          >
            <Download className="mr-1 inline-block h-3 w-3" />
            Download PNG
          </button>
        </div>
      )}
    </div>
  );
}
