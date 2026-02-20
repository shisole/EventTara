"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";

interface QRScannerProps {
  eventId: string;
  onCheckin: (result: { success: boolean; message: string; userName?: string }) => void;
}

export default function QRScanner({ eventId, onCheckin }: QRScannerProps) {
  const scannerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  const startScanning = async () => {
    setError("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText: string) => {
          // Expected formats:
          // User:      eventtara:checkin:{eventId}:{userId}
          // Companion: eventtara:checkin:{eventId}:companion:{companionId}
          const parts = decodedText.split(":");
          if (parts[0] !== "eventtara" || parts[1] !== "checkin") {
            onCheckin({ success: false, message: "Invalid QR code" });
            return;
          }

          const qrEventId = parts[2];

          if (qrEventId !== eventId) {
            onCheckin({ success: false, message: "QR code is for a different event" });
            return;
          }

          // Determine if this is a companion or user QR
          const isCompanion = parts[3] === "companion";
          const body: Record<string, string> = { event_id: eventId };

          if (isCompanion) {
            body.companion_id = parts[4];
          } else {
            body.user_id = parts[3];
          }

          // Call check-in API
          const res = await fetch("/api/checkins", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          const data = await res.json();
          onCheckin({
            success: res.ok,
            message: data.message || data.error,
            userName: data.userName,
          });
        },
        () => {} // ignore errors during scanning
      );
      setScanning(true);
    } catch (err: any) {
      setError(err?.message || "Failed to start camera");
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div id="qr-reader" className="rounded-xl overflow-hidden" />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button
        onClick={scanning ? stopScanning : startScanning}
        variant={scanning ? "outline" : "primary"}
        className="w-full"
      >
        {scanning ? "Stop Scanner" : "Start QR Scanner"}
      </Button>
    </div>
  );
}
