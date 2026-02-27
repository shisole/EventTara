"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { QRScanIcon } from "@/components/icons";

const ScannerOverlay = dynamic(() => import("@/components/dashboard/ScannerOverlay"));

export default function ScannerFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-lime-500 text-slate-900 shadow-lg transition-colors hover:bg-lime-400 md:bottom-8 md:right-8"
        aria-label="Open QR check-in scanner"
      >
        <QRScanIcon className="h-6 w-6" />
      </button>
      {open && <ScannerOverlay onClose={() => setOpen(false)} />}
    </>
  );
}
