"use client";

import { QRCodeCanvas } from "qrcode.react";
import { type ReactNode, useRef, useState } from "react";

import { Copy, Download } from "@/components/icons";

interface WelcomeQRCodeProps {
  code: string;
  clubName: string;
  title: string;
}

export default function WelcomeQRCode({ code, clubName, title }: WelcomeQRCodeProps): ReactNode {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const welcomeUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://eventtara.com"}/welcome/${code}`;

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${clubName.trim().replaceAll(/\s+/g, "-").toLowerCase()}-welcome-qr.png`;
    document.body.append(link);
    link.click();
    link.remove();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(welcomeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Print or display this QR code at your event. Scanning it takes participants to the{" "}
        <strong>{title}</strong> welcome page where they can sign up and join your club.
      </p>

      <div className="flex flex-col items-center rounded-xl border-2 border-gray-100 bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-800">
        <div ref={qrRef}>
          <QRCodeCanvas
            value={welcomeUrl}
            size={200}
            level="H"
            marginSize={4}
            bgColor="#ffffff"
            fgColor="#0f172a"
            imageSettings={{
              src: "/favicon-192x192.png",
              height: 40,
              width: 40,
              excavate: true,
            }}
          />
        </div>

        <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleDownload}
            className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-lime-400"
          >
            <Download className="mr-2 inline-block h-4 w-4" />
            Download PNG
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Welcome Page URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={welcomeUrl}
            className="min-w-0 flex-1 truncate rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          />
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {copied ? (
              <span className="text-lime-600 dark:text-lime-400">Copied!</span>
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
