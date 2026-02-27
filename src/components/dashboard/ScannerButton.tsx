"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { QRScanIcon } from "@/components/icons";
import { Button } from "@/components/ui";

const ScannerOverlay = dynamic(() => import("@/components/dashboard/ScannerOverlay"));

export default function ScannerButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <QRScanIcon className="h-4 w-4" />
        Scan QR
      </Button>
      {open && <ScannerOverlay onClose={() => setOpen(false)} />}
    </>
  );
}
