"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { QRScanIcon } from "@/components/icons";

const ScannerOverlay = dynamic(() => import("@/components/dashboard/ScannerOverlay"));

export default function ScannerFAB() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Hide on per-event check-in page (it has its own scanner)
  if (pathname.endsWith("/checkin")) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-40 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-lime-500 text-slate-900 shadow-lg transition-colors hover:bg-lime-400 md:bottom-24 md:right-6"
        aria-label="Open QR check-in scanner"
      >
        <QRScanIcon className="h-6 w-6" />
      </button>
      {open && <ScannerOverlay onClose={() => setOpen(false)} />}
    </>
  );
}
