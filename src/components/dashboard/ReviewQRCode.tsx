"use client";

import { QRCodeCanvas } from "qrcode.react";
import { type ReactNode, useRef, useState } from "react";

import { Copy, Download } from "@/components/icons";

interface ReviewQRCodeProps {
  clubSlug: string;
  clubName: string;
}

export default function ReviewQRCode({ clubSlug, clubName }: ReviewQRCodeProps): ReactNode {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const reviewUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://eventtara.com"}/clubs/${clubSlug}/reviews`;

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${clubName.trim().replaceAll(/\s+/g, "-").toLowerCase()}-review-qr.png`;
    document.body.append(link);
    link.click();
    link.remove();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(reviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Share this QR code at your events so participants can easily leave reviews.
      </p>

      <div className="flex flex-col items-center rounded-xl border-2 border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div ref={qrRef}>
          <QRCodeCanvas
            value={reviewUrl}
            size={200}
            level="M"
            marginSize={8}
            bgColor="#ffffff"
            fgColor="#0f172a"
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleDownload}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
          >
            <Download className="mr-2 inline-block h-4 w-4" />
            Download as PNG
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Shareable Review URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={reviewUrl}
            className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          />
          <button
            onClick={handleCopy}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {copied ? (
              <>
                <span className="text-teal-600 dark:text-teal-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="mr-2 inline-block h-4 w-4" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
